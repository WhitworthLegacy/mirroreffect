import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const CheckoutBodySchema = z.object({
  language: z.enum(["fr", "nl"]).default("fr"),
  client_name: z.string().min(2),
  client_email: z.string().email(),
  client_phone: z.string().min(6),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  event_id: z.string().uuid().optional(),
  zone_code: z.enum(["BE", "FR_NORD"]),
  // tu peux utiliser pack_id si tu préfères, mais code = plus simple pour test
  pack_code: z.enum(["DISCOVERY", "ESSENTIAL", "PREMIUM"]),

  // options codes (facultatif MVP)
  options: z.array(z.string()).default([]),
});

function cents(n: number) {
  return Math.round(n * 100);
}

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = CheckoutBodySchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json({ error: "invalid_body", issues: parsed.error.format() }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const b = parsed.data;

    // 1) pricing (MVP hardcoded pour débloquer vite) — tu brancheras DB packs/zones après
    const transport_fee_cents = b.zone_code === "BE" ? 9000 : 11000;

    const pack_total_cents =
      b.pack_code === "DISCOVERY" ? 39000 :
      b.pack_code === "ESSENTIAL" ? 44000 :
      49000;

    const total_cents = transport_fee_cents + pack_total_cents;

    // 2) créer event (doit matcher tes NOT NULL)
    let eventId = b.event_id ?? null;

    if (eventId) {
      const { error: updateErr } = await supabase
        .from("events")
        .update({
          language: b.language,
          client_name: b.client_name,
          client_email: b.client_email,
          client_phone: b.client_phone,
          event_date: b.event_date,
          transport_fee_cents,
          total_cents,
          deposit_cents: 18000,
          balance_due_cents: total_cents - 18000,
          status: "active",
        })
        .eq("id", eventId);

      if (updateErr) {
        console.error("EVENT UPDATE ERROR", updateErr);
        return Response.json({ error: "event_update_failed" }, { status: 500 });
      }
    } else {
      const { data: created, error: createErr } = await supabase
        .from("events")
        .insert({
          event_type: "b2c",
          language: b.language,
          client_name: b.client_name,
          client_email: b.client_email,
          client_phone: b.client_phone,
          event_date: b.event_date,
          transport_fee_cents,
          total_cents,
          deposit_cents: 18000,
          balance_due_cents: total_cents - 18000,
          status: "active",
        })
        .select("id")
        .single();

      if (createErr || !created?.id) {
        console.error("EVENT CREATE ERROR", createErr);
        return Response.json({ error: "event_create_failed" }, { status: 500 });
      }

      eventId = created.id;
    }

    await supabase
      .from("notification_queue")
      .delete()
      .eq("template_key", "B2C_PROMO_48H")
      .eq("to_email", b.client_email)
      .eq("status", "queued");

    // 3) créer payment Mollie (acompte fixe 180€)
    const apiKey = process.env.MOLLIE_API_KEY;
    if (!apiKey) return Response.json({ error: "missing_mollie_key" }, { status: 500 });

    const deposit_cents = 18000;

    const webhookUrl =
      (process.env.APP_URL ? `${process.env.APP_URL}/api/webhooks/mollie` : null);

    const redirectUrl = `${process.env.APP_URL}/booking/success?event_id=${eventId}&lang=${b.language}`;

    const res = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: (deposit_cents / 100).toFixed(2) },
        description: `${b.client_email}`,
        redirectUrl,
        webhookUrl: webhookUrl ?? undefined,
        metadata: {
            event_id: eventId,        // 🔑 obligatoire pour le webhook
            event_date: b.event_date, // pratique debug
            kind: "deposit",          // utile si plus tard tu fais solde
            env: process.env.APP_ENV ?? "dev",
            app: "mirroreffect-web"
        },
      }),
    });

    const mollie = await res.json();

    if (!res.ok || !mollie?.id || !mollie?._links?.checkout?.href) {
      console.error("MOLLIE CREATE ERROR", mollie);
      return Response.json({ error: "mollie_create_failed", detail: mollie }, { status: 500 });
    }

    // 4) log payment en DB
    await supabase.from("payments").insert({
        provider: "mollie",
        provider_payment_id: mollie.id,
        event_id: eventId,
        amount_cents: deposit_cents,
        status: "open",
        // paid_at null tant que pas payé
    });

    return Response.json({
      event_id: eventId,
      mollie_payment_id: mollie.id,
      checkout_url: mollie._links.checkout.href,
      deposit_cents,
      total_cents,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
