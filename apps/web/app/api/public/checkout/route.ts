import { z } from "zod";
import { gasPost } from "@/lib/gas";

const CheckoutBodySchema = z.object({
  language: z.enum(["fr", "nl"]).default("fr"),
  client_name: z.string().min(2),
  client_email: z.string().email(),
  client_phone: z.string().min(6),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  address: z.string().min(2),
  lead_id: z.string().optional(),
  zone_code: z.enum(["BE", "FR_NORD"]),
  pack_code: z.enum(["DISCOVERY", "ESSENTIAL", "PREMIUM"]),
  options: z.array(z.string()).default([]),
});

const DEPOSIT_CENTS = 18000;

// Générer un ID unique pour l'event
function generateEventId(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Convertir cents en euros formaté
function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = CheckoutBodySchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json({ error: "invalid_body", issues: parsed.error.format() }, { status: 400 });
    }

    const b = parsed.data;

    // 1) Pricing (MVP hardcoded)
    const transport_fee_cents = b.zone_code === "BE" ? 9000 : 11000;
    const pack_total_cents =
      b.pack_code === "DISCOVERY" ? 39000 :
      b.pack_code === "ESSENTIAL" ? 44000 :
      49000;
    const total_cents = transport_fee_cents + pack_total_cents;
    const balance_due_cents = total_cents - DEPOSIT_CENTS;

    // 2) Générer Event ID (sera confirmé après paiement)
    const eventId = generateEventId();

    // 3) Créer payment Mollie
    const apiKey = process.env.MOLLIE_API_KEY;
    if (!apiKey) return Response.json({ error: "missing_mollie_key" }, { status: 500 });

    const webhookUrl = process.env.APP_URL ? `${process.env.APP_URL}/api/webhooks/mollie` : null;
    const redirectUrl = `${process.env.APP_URL}/booking/success?event_id=${eventId}&lang=${b.language}`;

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
          lead_id: b.lead_id,
          event_date: b.event_date,
          kind: "deposit",
          env: process.env.APP_ENV ?? "dev",
          app: "mirroreffect-web",
          // Stocker toutes les données pour le webhook
          client_name: b.client_name,
          client_email: b.client_email,
          client_phone: b.client_phone,
          address: b.address,
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

    return Response.json({
      event_id: eventId,
      mollie_payment_id: mollie.id,
      checkout_url: mollie._links.checkout.href,
      deposit_cents: DEPOSIT_CENTS,
      total_cents,
    });
  } catch (e) {
    console.error("[checkout] Error:", e);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
