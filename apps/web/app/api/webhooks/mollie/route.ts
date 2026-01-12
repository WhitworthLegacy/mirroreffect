import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { fetchMolliePaymentStatus } from "@/lib/payments/mollie";

const DEPOSIT_EUR_CENTS = 18000;

export async function POST(req: Request) {
  // ✅ Simple protection (au lieu de requireRole)
  const secret = req.headers.get("x-webhook-secret");
  if (!process.env.MOLLIE_WEBHOOK_SECRET || secret !== process.env.MOLLIE_WEBHOOK_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // ✅ Mollie => id=tr_... (form-urlencoded)
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const molliePaymentId = params.get("id");

  if (!molliePaymentId) {
    return Response.json({ error: "missing_id" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // ✅ Idempotence simple: si payment déjà "paid" => OK
  const { data: existing } = await supabase
    .from("payments")
    .select("id,status,event_id,provider_payment_id")
    .eq("provider", "mollie")
    .eq("provider_payment_id", molliePaymentId)
    .maybeSingle();

  if (existing?.status === "paid") {
    return Response.json({ received: true });
  }

  // ✅ Fetch status Mollie
  const payment = await fetchMolliePaymentStatus(molliePaymentId);
  if (!payment) return Response.json({ error: "payment_not_found" }, { status: 404 });

  // On ne traite que paid
  if (payment.status !== "paid") {
    // update payment row if exists
    if (existing?.id) {
      await supabase.from("payments").update({ status: payment.status }).eq("id", existing.id);
    }
    return Response.json({ received: true });
  }

  // ✅ Validate acompte
  if (payment.amount_cents !== DEPOSIT_EUR_CENTS) {
    return Response.json({ error: "invalid_deposit_amount" }, { status: 400 });
  }

  // ✅ On bosse avec event_id dans metadata (simple & robuste)
  const eventId = payment.metadata?.event_id;
  if (!eventId) {
    return Response.json({ error: "missing_event_id" }, { status: 400 });
  }

  // ✅ Charge event (pour date)
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id,event_date,status")
    .eq("id", eventId)
    .single();

  if (eventErr || !event) return Response.json({ error: "event_not_found" }, { status: 404 });

  const { data: currentResource } = await supabase
    .from("event_resources")
    .select("inventory_item_id")
    .eq("event_id", event.id)
    .is("released_at", null)
    .maybeSingle();

  let mirrorId = currentResource?.inventory_item_id ?? null;

  if (!mirrorId) {
    // ✅ Trouver un miroir dispo ce jour (exactement comme availability)
    const { data: mirrors, error: mirrorsError } = await supabase
      .from("inventory_items")
      .select("id")
      .eq("type", "mirror")
      .neq("status", "out_of_service");

    if (mirrorsError) return Response.json({ error: "inventory_error" }, { status: 500 });

    const { data: reservations, error: reservationsError } = await supabase
      .from("event_resources")
      .select("inventory_item_id, events!inner(event_date,status,deleted_at)")
      .eq("events.event_date", event.event_date)
      .neq("events.status", "cancelled")
      .is("events.deleted_at", null)
      .is("released_at", null);

    if (reservationsError) return Response.json({ error: "reservation_error" }, { status: 500 });

    const reservedIds = new Set((reservations ?? []).map((r: any) => r.inventory_item_id).filter(Boolean));
    const freeMirror = (mirrors ?? []).find((m: any) => !reservedIds.has(m.id));

    if (!freeMirror) return Response.json({ error: "no_mirror_available" }, { status: 409 });

    mirrorId = freeMirror.id;
  }

  if (!currentResource && mirrorId) {
    const { error: resourceError } = await supabase.from("event_resources").insert({
      event_id: event.id,
      inventory_item_id: mirrorId,
    });

    if (resourceError) return Response.json({ error: "resource_create_failed" }, { status: 500 });
  }

  // ✅ Upsert payment row (only existing columns)
  if (existing?.id) {
    await supabase.from("payments").update({
      status: "paid",
      paid_at: payment.paid_at,
      amount_cents: payment.amount_cents,
      event_id: event.id,
    }).eq("id", existing.id);
  } else {
    await supabase.from("payments").insert({
      provider: "mollie",
      provider_payment_id: molliePaymentId,
      event_id: event.id,
      amount_cents: payment.amount_cents,
      status: "paid",
      paid_at: payment.paid_at,
    });
  }

  // ✅ Enqueue emails (tes tables existent)
  await supabase.from("notification_queue").insert([
    { template_key: "B2C_BOOKING_CONFIRMED", event_id: event.id },
    { template_key: "B2C_EVENT_RECAP", event_id: event.id },
  ]);

  return Response.json({ received: true });
}
