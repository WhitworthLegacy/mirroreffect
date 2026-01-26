import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase";
import { trackInitiateCheckout } from "@/lib/metaCapi";

const CheckoutBodySchema = z.object({
  language: z.enum(["fr", "nl"]).default("fr"),
  client_name: z.string().min(2),
  client_email: z.string().email(),
  client_phone: z.string().min(6),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_type: z.string().optional(), // Mariage, Anniversaire, Bapteme, etc.
  address: z.string().min(2).optional(),
  venue: z.string().optional(),
  lieuEvent: z.string().optional(),
  lead_id: z.string().optional(),
  zone_code: z.enum(["BE", "FR_NORD"]),
  pack_code: z.enum(["DISCOVERY", "ESSENTIAL", "PREMIUM"]),
  guest_count: z.number().optional(), // Nombre d'invités
  options: z.array(z.string()).default([]),
  event_id: z.string().optional()
});

const DEPOSIT_CENTS = 20000;

// Générer un ID unique pour l'event
function generateEventId(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    return Response.json({
      ok: false,
      requestId,
      error: { type: "INVALID_JSON", message: "Body non valide JSON", status: 400 }
    }, { status: 400 });
  }

  const parsed = CheckoutBodySchema.safeParse(raw);

  if (!parsed.success) {
    const issues = parsed.error.format();
    const missingFields = Object.keys(issues).filter((key) => key !== "_errors");

    return Response.json({
      ok: false,
      requestId,
      error: { type: "VALIDATION_ERROR", message: "Validation body échouée", status: 400, issues, missingFields }
    }, { status: 400 });
  }

  let b = parsed.data;

  // Fix défensif: normaliser address depuis plusieurs sources
  const normalizedAddress = b.address || b.venue || b.lieuEvent || "";
  b = { ...b, address: normalizedAddress };

  if (process.env.NODE_ENV !== "production") {
    console.log(`[checkout] Debug (${requestId}):`, {
      leadId: b.lead_id,
      email: b.client_email,
      address_final: normalizedAddress
    });
  }

  try {
    // 1) Pricing (MVP hardcoded)
    const transport_fee_cents = b.zone_code === "BE" ? 10000 : 15000;
    const pack_total_cents =
      b.pack_code === "DISCOVERY" ? 45000 :
      b.pack_code === "ESSENTIAL" ? 50000 :
      55000;
    const total_cents = transport_fee_cents + pack_total_cents;
    const balance_due_cents = total_cents - DEPOSIT_CENTS;

    // 2) Générer Event ID (sera confirmé après paiement)
    const eventId = generateEventId();

    // 3) Créer payment Mollie
    const apiKey = process.env.MOLLIE_API_KEY;
    if (!apiKey) return Response.json({ error: "missing_mollie_key" }, { status: 500 });

    const webhookUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/api/webhooks/mollie`
      : null;
    const redirectUrl = `${process.env.APP_URL}/booking/success?event_id=${eventId}&lang=${b.language}`;
    const metadataAddress = normalizedAddress || "";

    console.log(`[checkout] Config Mollie (${requestId}):`, {
      eventId,
      webhookUrlConfigured: !!webhookUrl,
      redirectUrlConfigured: !!redirectUrl,
      appUrl: process.env.APP_URL ? "[DÉFINI]" : "[MANQUANT]"
    });

    const res = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: (DEPOSIT_CENTS / 100).toFixed(2) },
        description: `${b.client_email}`,
        redirectUrl,
        webhookUrl: webhookUrl ?? undefined,
        metadata: {
          event_id: eventId,
          lead_id: b.lead_id || undefined,
          event_date: b.event_date,
          event_type: b.event_type || "b2c",
          kind: "deposit",
          env: process.env.APP_ENV ?? "dev",
          app: "mirroreffect-web",
          client_name: b.client_name,
          client_email: b.client_email,
          client_phone: b.client_phone,
          address: metadataAddress,
          language: b.language,
          pack_code: b.pack_code,
          zone_code: b.zone_code,
          guest_count: b.guest_count || null,
          options: b.options.join(","),
          transport_fee_cents,
          total_cents,
          deposit_cents: DEPOSIT_CENTS,
          balance_due_cents
        }
      })
    });

    const mollie = await res.json();

    if (!res.ok || !mollie?.id || !mollie?._links?.checkout?.href) {
      console.error("MOLLIE CREATE ERROR", mollie);
      return Response.json({ error: "mollie_create_failed", detail: mollie }, { status: 500 });
    }

    // 4) Enregistrer le paiement dans Supabase
    const supabase = createSupabaseServerClient();

    const { error: paymentError } = await supabase.from("payments").insert({
      payment_id: mollie.id,
      event_id: eventId,
      provider: "mollie",
      amount_cents: DEPOSIT_CENTS,
      status: "open"
    });

    if (paymentError) {
      console.error(`[checkout] Erreur création payment:`, paymentError);
      // Ne pas bloquer - le webhook gérera la création si nécessaire
    } else {
      console.log(`[checkout] Payment créé dans Supabase:`, { payment_id: mollie.id, event_id: eventId });
    }

    // 5) Meta CAPI - Track InitiateCheckout event (non-bloquant)
    trackInitiateCheckout({
      email: b.client_email,
      phone: b.client_phone,
      firstName: b.client_name,
      eventId,
      value: total_cents / 100,
      contentName: b.pack_code,
      clientIp: req.headers.get("x-forwarded-for")?.split(",")[0] || undefined,
      userAgent: req.headers.get("user-agent") || undefined
    }).catch((err) => console.error(`[checkout] Meta CAPI erreur:`, err));

    return Response.json({
      ok: true,
      requestId,
      event_id: eventId,
      mollie_payment_id: mollie.id,
      checkout_url: mollie._links.checkout.href,
      deposit_cents: DEPOSIT_CENTS,
      total_cents
    });
  } catch (e) {
    const error = e as Error & { type?: string; status?: number; message?: string };
    const errorType = error.type || "SERVER_ERROR";
    const errorStatus = error.status || 500;
    const errorMessage = error.message || String(e);

    console.error(`[checkout] Erreur (${requestId}):`, {
      type: errorType,
      status: errorStatus,
      message: errorMessage,
      error: e
    });

    return Response.json({
      ok: false,
      requestId,
      error: { type: errorType, message: errorMessage, status: errorStatus }
    }, { status: errorStatus >= 400 && errorStatus < 600 ? errorStatus : 500 });
  }
}
