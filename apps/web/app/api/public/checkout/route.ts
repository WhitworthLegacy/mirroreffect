import { z } from "zod";
import { gasPost } from "@/lib/gas";
import { trackInitiateCheckout } from "@/lib/metaCapi";

const CheckoutBodySchema = z.object({
  language: z.enum(["fr", "nl"]).default("fr"),
  client_name: z.string().min(2),
  client_email: z.string().email(),
  client_phone: z.string().min(6),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  address: z.string().min(2).optional(), // Optionnel dans Zod pour fallback défensif
  venue: z.string().optional(), // Fallback possible
  lieuEvent: z.string().optional(), // Fallback possible
  lead_id: z.string().optional(),
  zone_code: z.enum(["BE", "FR_NORD"]),
  pack_code: z.enum(["DISCOVERY", "ESSENTIAL", "PREMIUM"]),
  options: z.array(z.string()).default([]),
  event_id: z.string().optional() // Pour compatibilité
});

const DEPOSIT_CENTS = 20000;

// Générer un ID unique pour l'event
function generateEventId(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Convertir cents en euros formaté
function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
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
      error: {
        type: "INVALID_JSON",
        message: "Request body is not valid JSON",
        status: 400
      }
    }, { status: 400 });
  }

  const parsed = CheckoutBodySchema.safeParse(raw);

  if (!parsed.success) {
    const issues = parsed.error.format();
    const missingFields = Object.keys(issues).filter((key) => key !== "_errors");
    
    return Response.json({
      ok: false,
      requestId,
      error: {
        type: "VALIDATION_ERROR",
        message: "Request body validation failed",
        status: 400,
        issues,
        missingFields
      }
    }, { status: 400 });
  }

  let b = parsed.data;

  // Fix défensif: normaliser address depuis plusieurs sources
  // address = lieu event est accepté comme business rule
  const normalizedAddress = b.address || 
                            b.venue || 
                            b.lieuEvent || 
                            "";

  // Mettre à jour b avec address normalisé
  b = {
    ...b,
    address: normalizedAddress
  };

  if (process.env.NODE_ENV !== "production") {
    console.log(`[checkout] Debug (${requestId}):`, {
      leadId: b.lead_id,
      email: b.client_email,
      address_received: raw && typeof raw === "object" && "address" in raw ? raw.address : undefined,
      venue_received: raw && typeof raw === "object" && "venue" in raw ? raw.venue : undefined,
      lieuEvent_received: raw && typeof raw === "object" && "lieuEvent" in raw ? raw.lieuEvent : undefined,
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

    // Webhook URL (sécurité assurée par validation via Mollie API, pas par token)
    const webhookUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/api/webhooks/mollie`
      : null;
    const redirectUrl = `${process.env.APP_URL}/booking/success?event_id=${eventId}&lang=${b.language}`;
    const metadataAddress = normalizedAddress || "";

    console.log(`[checkout] Mollie payment config (${requestId}):`, {
      eventId,
      webhookUrlConfigured: !!webhookUrl,
      redirectUrlConfigured: !!redirectUrl,
      appUrl: process.env.APP_URL ? "[SET]" : "[MISSING]"
    });

    const res = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
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
          kind: "deposit",
          env: process.env.APP_ENV ?? "dev",
          app: "mirroreffect-web",
          // Stocker toutes les données pour le webhook
          // CRITIQUE: client_email est OBLIGATOIRE pour le webhook
          client_name: b.client_name,
          client_email: b.client_email, // REQUIRED - validé par Zod
          client_phone: b.client_phone,
          address: metadataAddress,
          language: b.language,
          pack_code: b.pack_code,
          zone_code: b.zone_code,
          options: b.options.join(","),
          transport_fee_cents,
          total_cents,
          deposit_cents: DEPOSIT_CENTS,
          balance_due_cents
        },
      }),
    });

    const mollie = await res.json();

    if (!res.ok || !mollie?.id || !mollie?._links?.checkout?.href) {
      console.error("MOLLIE CREATE ERROR", mollie);
      return Response.json({ error: "mollie_create_failed", detail: mollie }, { status: 500 });
    }

    // 4) Log payment dans Payments sheet (status=open)
    await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Payments",
        values: {
          "Payment ID": mollie.id,
          "Event ID": eventId,
          "Lead ID": b.lead_id || "",
          "Provider": "mollie",
          "Amount": centsToEuros(DEPOSIT_CENTS),
          "Status": "open",
          "Created At": new Date().toISOString()
        }
      }
    });

    // 5) Supprimer promo notifications en attente
    // Note: On ne peut pas facilement delete via GAS, on marquera comme cancelled dans le webhook si besoin

    // 6) Meta CAPI - Track InitiateCheckout event (non-blocking)
    trackInitiateCheckout({
      email: b.client_email,
      phone: b.client_phone,
      firstName: b.client_name,
      eventId,
      value: total_cents / 100,
      contentName: b.pack_code,
      clientIp: req.headers.get("x-forwarded-for")?.split(",")[0] || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    }).catch((err) => console.error(`[checkout] Meta CAPI error:`, err));

    return Response.json({
      ok: true,
      requestId,
      event_id: eventId,
      mollie_payment_id: mollie.id,
      checkout_url: mollie._links.checkout.href,
      deposit_cents: DEPOSIT_CENTS,
      total_cents,
    });
  } catch (e) {
    const error = e as Error & { type?: string; status?: number; message?: string };
    const errorType = error.type || "SERVER_ERROR";
    const errorStatus = error.status || 500;
    const errorMessage = error.message || String(e);

    console.error(`[checkout] Error (${requestId}):`, {
      type: errorType,
      status: errorStatus,
      message: errorMessage,
      error: e
    });

    return Response.json({
      ok: false,
      requestId,
      error: {
        type: errorType,
        message: errorMessage,
        status: errorStatus
      }
    }, { status: errorStatus >= 400 && errorStatus < 600 ? errorStatus : 500 });
  }
}
