import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const BookingStatusQuerySchema = z.object({
  event_id: z.string().min(1)
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = BookingStatusQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { event_id } = parsed.data;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, client_name, event_date, total_cents, status")
    .eq("id", event_id)
    .single();

  if (eventError || !event) {
    return Response.json({ error: "event_not_found" }, { status: 404 });
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("status, amount_cents, paid_at, provider_payment_id")
    .eq("event_id", event_id)
    .eq("provider", "mollie");

  if (paymentsError) {
    return Response.json({ error: "payments_error" }, { status: 500 });
  }

  const paidDeposit = (payments ?? []).some(
    (payment) => payment.status === "paid" && payment.amount_cents === 18000
  );

  const latestStatus = (payments ?? [])[0]?.status ?? "unknown";

  return Response.json({
    event_id: event.id,
    client_name: event.client_name,
    event_date: event.event_date,
    total_cents: event.total_cents,
    status: event.status,
    deposit_paid: paidDeposit,
    payment_status: latestStatus
  });
}
