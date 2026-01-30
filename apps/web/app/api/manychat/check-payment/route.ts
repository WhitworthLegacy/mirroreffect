import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

interface ManyChatCheckPaymentPayload {
  email: string;
}

/**
 * API pour Manychat External Request
 * Vérifie si un client a payé son acompte
 *
 * POST /api/manychat/check-payment
 * Body: { "email": "client@example.com" }
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`[manychat-check-payment][${requestId}] Requête reçue`);

  try {
    const payload: ManyChatCheckPaymentPayload = await req.json();

    // Validation
    if (!payload.email) {
      return Response.json({
        ok: false,
        error: "Missing email",
        requestId,
      }, { status: 400 });
    }

    const clientEmail = payload.email.toLowerCase();

    console.log(`[manychat-check-payment][${requestId}] Checking payment for:`, clientEmail);

    const supabase = createSupabaseServerClient();

    // Vérifier si un event (paiement confirmé) existe pour cet email
    const { data: event, error } = await supabase
      .from("events")
      .select("event_id, event_date, client_name, status")
      .eq("client_email", clientEmail)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error(`[manychat-check-payment][${requestId}] Supabase error:`, error);
      return Response.json({
        ok: false,
        error: "Database error",
        requestId,
      }, { status: 500 });
    }

    const paid = Boolean(event);

    console.log(`[manychat-check-payment][${requestId}] Result:`, {
      email: clientEmail,
      paid,
      event_id: event?.event_id || null,
    });

    if (paid && event) {
      // Client a payé
      return Response.json({
        ok: true,
        paid: true,
        event_id: event.event_id,
        event_date: event.event_date,
        client_name: event.client_name,
        message: "✅ Paiement confirmé ! Merci pour votre réservation.",
        requestId,
      });
    } else {
      // Client n'a pas encore payé
      return Response.json({
        ok: true,
        paid: false,
        message: "⏳ Paiement en attente. N'oubliez pas de réserver votre date !",
        requestId,
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[manychat-check-payment][${requestId}] Error:`, errorMsg);
    return Response.json(
      { ok: false, requestId, error: errorMsg },
      { status: 500 }
    );
  }
}
