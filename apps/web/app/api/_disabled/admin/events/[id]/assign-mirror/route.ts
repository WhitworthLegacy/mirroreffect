import { AdminAssignMirrorInputSchema, AdminAssignMirrorOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request, context: { params: { id: string } }) {
  const guard = await requireRole(req, ["admin", "ops"]);
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));
  const parsed = AdminAssignMirrorInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const eventId = context.params.id;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,event_date,status")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    return Response.json({ error: "event_not_found" }, { status: 404 });
  }

  if (event.status === "cancelled") {
    return Response.json({ error: "event_cancelled" }, { status: 409 });
  }

  const { data: existingResource } = await supabase
    .from("event_resources")
    .select("id")
    .eq("event_id", eventId)
    .is("released_at", null)
    .maybeSingle();

  if (existingResource) {
    return Response.json({ error: "mirror_already_assigned" }, { status: 409 });
  }

  const { data: mirrors, error: mirrorsError } = await supabase
    .from("inventory_items")
    .select("id")
    .eq("type", "mirror")
    .neq("status", "out_of_service");

  if (mirrorsError) {
    return Response.json({ error: "inventory_error" }, { status: 500 });
  }

  const { data: reservations, error: reservationsError } = await supabase
    .from("event_resources")
    .select("inventory_item_id, events!inner(event_date,status,deleted_at)")
    .eq("events.event_date", event.event_date)
    .neq("events.status", "cancelled")
    .is("events.deleted_at", null)
    .is("released_at", null);

  if (reservationsError) {
    return Response.json({ error: "reservation_error" }, { status: 500 });
  }

  const reservedIds = new Set(
    (reservations ?? []).map((row) => (row as { inventory_item_id?: string }).inventory_item_id).filter(Boolean)
  );

  const mirrorId =
    parsed.data.mirror_id ??
    (mirrors ?? []).find((item) => !reservedIds.has((item as { id: string }).id))?.id;

  if (!mirrorId || reservedIds.has(mirrorId)) {
    return Response.json({ error: "no_mirror_available" }, { status: 409 });
  }

  const { error: resourceError } = await supabase.from("event_resources").insert({
    event_id: eventId,
    inventory_item_id: mirrorId
  });

  if (resourceError) {
    return Response.json({ error: "resource_create_failed" }, { status: 500 });
  }

  const { error: stockError } = await supabase.from("stock_movements").insert({
    inventory_item_id: mirrorId,
    movement_type: "assign",
    event_id: eventId
  });

  if (stockError) {
    return Response.json({ error: "stock_movement_failed" }, { status: 500 });
  }

  return Response.json(AdminAssignMirrorOutputSchema.parse({ assigned: true, mirror_id: mirrorId }));
}
