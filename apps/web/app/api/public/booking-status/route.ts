import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase";

const BookingStatusQuerySchema = z.object({
  event_id: z.string().min(1)
});

const DEPOSIT_CENTS = 18000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = BookingStatusQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  const { event_id } = parsed.data;
  const supabase = createSupabaseServerClient();

  try {
    // 1. Vérifier la table events
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("event_id", event_id)
      .single();

    if (eventError && eventError.code !== "PGRST116") {
      console.error("[booking-status] Erreur requête events:", eventError);
      return Response.json({ error: "database_error" }, { status: 500 });
    }

    // 2. Vérifier la table payments
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("event_id", event_id)
      .order("created_at", { ascending: false });

    if (paymentsError) {
      console.error("[booking-status] Erreur requête payments:", paymentsError);
      return Response.json({ error: "database_error" }, { status: 500 });
    }

    // Si pas d'event trouvé, vérifier s'il y a un paiement
    if (!event) {
      if (payments && payments.length > 0) {
        const latestPayment = payments[0];
        const depositPaid = payments.some(
          (p) => p.status === "paid" && p.amount_cents === DEPOSIT_CENTS
        );
        const paidPayment = payments.find((p) => p.status === "paid");

        return Response.json({
          ok: true,
          event_id,
          client_name: null,
          event_date: null,
          total_cents: null,
          status: "pending",
          deposit_paid: depositPaid,
          payment_status: latestPayment.status,
          paid_at: paidPayment?.paid_at || null
        });
      }

      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    // Event trouvé - déterminer le statut du paiement
    let depositPaid = false;
    let paymentStatus = "unknown";
    let paidAt: string | null = null;

    if (payments && payments.length > 0) {
      const latestPayment = payments[0];
      paymentStatus = latestPayment.status || "unknown";

      const paidPayment = payments.find(
        (p) => p.status === "paid" && p.amount_cents === DEPOSIT_CENTS
      );

      if (paidPayment) {
        depositPaid = true;
        paidAt = paidPayment.paid_at || null;
      }
    }

    // Si l'event existe dans la table events, l'acompte a été payé (par définition)
    if (event.deposit_cents && event.deposit_cents > 0) {
      depositPaid = true;
    }

    return Response.json({
      ok: true,
      event_id,
      client_name: event.client_name || null,
      event_date: event.event_date || null,
      total_cents: event.total_cents || null,
      status: "active",
      deposit_paid: depositPaid,
      payment_status: paymentStatus,
      paid_at: paidAt
    });
  } catch (error) {
    console.error("[booking-status] Erreur:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
