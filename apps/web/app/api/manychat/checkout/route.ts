import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

interface ManyChatCheckoutPayload {
  lead_id?: string;
  email: string;
  name?: string;
  phone?: string;
  event_date?: string;
  event_type?: string;
  address?: string;
  pack_code?: "DISCOVERY" | "ESSENTIAL" | "PREMIUM";
  zone_code?: "BE" | "FR_NORD";
  guest_count?: string | number;
  language?: "fr" | "nl";
}

const DEPOSIT_CENTS = 20000; // 200€ d'acompte

/**
 * API pour Manychat External Request
 * Génère un lien de paiement Mollie pour l'acompte
 *
 * POST /api/manychat/checkout
 * Body: { email, name, phone, event_date, pack_code, zone_code, ... }
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`[manychat-checkout][${requestId}] Requête reçue`);

  try {
    const payload: ManyChatCheckoutPayload = await req.json();

    // Validation des champs requis
    if (!payload.email) {
      return Response.json({
        ok: false,
        error: "Missing email",
        requestId,
      }, { status: 400 });
    }

    if (!payload.event_date) {
      return Response.json({
        ok: false,
        error: "Missing event_date",
        requestId,
      }, { status: 400 });
    }

    // Valeurs par défaut
    const packCode = payload.pack_code || "ESSENTIAL";
    const zoneCode = payload.zone_code || "BE";
    const language = payload.language || "fr";
    const clientEmail = payload.email.toLowerCase();
    const clientName = payload.name || "";
    const clientPhone = payload.phone || "";

    console.log(`[manychat-checkout][${requestId}] Processing checkout:`, {
      email: clientEmail,
      packCode,
      zoneCode,
      eventDate: payload.event_date,
    });

    // Calculer le prix
    const transport_fee_cents = zoneCode === "BE" ? 10000 : 15000;
    const pack_total_cents =
      packCode === "DISCOVERY" ? 45000 :
      packCode === "ESSENTIAL" ? 50000 :
      55000;
    const total_cents = transport_fee_cents + pack_total_cents;
    const balance_due_cents = total_cents - DEPOSIT_CENTS;

    // Générer un Event ID
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Récupérer ou créer le lead_id
    const supabase = createSupabaseServerClient();
    let leadId = payload.lead_id;

    if (!leadId) {
      // Chercher un lead existant par email
      const { data: existingLead } = await supabase
        .from("leads")
        .select("lead_id")
        .eq("client_email", clientEmail)
        .eq("status", "progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingLead) {
        leadId = existingLead.lead_id;
        console.log(`[manychat-checkout][${requestId}] Lead existant trouvé:`, leadId);
      } else {
        // Créer un nouveau lead
        const newLeadId = `L-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const { error: leadError } = await supabase.from("leads").insert({
          lead_id: newLeadId,
          status: "progress",
          step: 10,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          language,
          event_date: payload.event_date,
          event_type: payload.event_type || null,
          event_location: payload.address || "",
          guest_count: payload.guest_count
            ? (typeof payload.guest_count === 'string'
                ? parseInt(payload.guest_count, 10)
                : payload.guest_count)
            : null,
          utm_source: "manychat",
          utm_medium: "messenger",
          utm_campaign: "checkout",
        });

        if (leadError) {
          console.error(`[manychat-checkout][${requestId}] Lead creation error:`, leadError);
        } else {
          leadId = newLeadId;
          console.log(`[manychat-checkout][${requestId}] Lead créé:`, leadId);
        }
      }
    }

    // Créer le paiement Mollie
    const apiKey = process.env.MOLLIE_API_KEY;
    if (!apiKey) {
      return Response.json({
        ok: false,
        error: "Configuration error: missing Mollie API key",
        requestId,
      }, { status: 500 });
    }

    const webhookUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/api/webhooks/mollie`
      : null;
    const redirectUrl = `${process.env.APP_URL}/booking/success?event_id=${eventId}&lang=${language}`;

    console.log(`[manychat-checkout][${requestId}] Creating Mollie payment:`, {
      eventId,
      amount: DEPOSIT_CENTS / 100,
      redirectUrl,
      webhookConfigured: !!webhookUrl,
    });

    const res = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: {
          currency: "EUR",
          value: (DEPOSIT_CENTS / 100).toFixed(2)
        },
        description: `Acompte Mirror Effect - ${clientEmail}`,
        redirectUrl,
        webhookUrl: webhookUrl ?? undefined,
        metadata: {
          event_id: eventId,
          lead_id: leadId || undefined,
          event_date: payload.event_date,
          event_type: payload.event_type || "b2c",
          kind: "deposit",
          source: "manychat",
          env: process.env.APP_ENV ?? "production",
          app: "mirroreffect-web",
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          address: payload.address || "",
          language,
          pack_code: packCode,
          zone_code: zoneCode,
          guest_count: payload.guest_count || null,
          transport_fee_cents,
          total_cents,
          deposit_cents: DEPOSIT_CENTS,
          balance_due_cents
        }
      })
    });

    const mollie = await res.json();

    if (!res.ok || !mollie?.id || !mollie?._links?.checkout?.href) {
      console.error(`[manychat-checkout][${requestId}] Mollie error:`, mollie);
      return Response.json({
        ok: false,
        error: "Payment creation failed",
        requestId,
        detail: mollie
      }, { status: 500 });
    }

    // Enregistrer le paiement dans Supabase
    const { error: paymentError } = await supabase.from("payments").insert({
      payment_id: mollie.id,
      event_id: eventId,
      provider: "mollie",
      amount_cents: DEPOSIT_CENTS,
      status: "open"
    });

    if (paymentError) {
      console.error(`[manychat-checkout][${requestId}] Payment record error:`, paymentError);
      // Ne pas bloquer - le webhook gérera la création si nécessaire
    }

    console.log(`[manychat-checkout][${requestId}] Checkout créé:`, {
      event_id: eventId,
      payment_id: mollie.id,
      checkout_url: mollie._links.checkout.href,
    });

    return Response.json({
      ok: true,
      requestId,
      event_id: eventId,
      lead_id: leadId,
      payment_id: mollie.id,
      checkout_url: mollie._links.checkout.href,
      deposit_amount: `${(DEPOSIT_CENTS / 100).toFixed(2)}€`,
      total_amount: `${(total_cents / 100).toFixed(2)}€`,
      message: `Votre lien de paiement est prêt ! Montant de l'acompte : ${(DEPOSIT_CENTS / 100).toFixed(2)}€`,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[manychat-checkout][${requestId}] Error:`, errorMsg);
    return Response.json(
      { ok: false, requestId, error: errorMsg },
      { status: 500 }
    );
  }
}
