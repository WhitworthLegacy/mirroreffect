import { PublicAvailabilityQuerySchema, PublicAvailabilityResponseSchema } from "@mirroreffect/core";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

console.log("ENV CHECK", {
  hasUrl: !!process.env.SUPABASE_URL,
  hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = PublicAvailabilityQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { date } = parsed.data;

  const { count: totalMirrors, error: totalError } = await supabase
    .from("inventory_items")
    .select("id", { count: "exact", head: true })
    .eq("type", "mirror")
    .neq("status", "out_of_service");

  if (totalError) {
    return Response.json({ error: "inventory_error" }, { status: 500 });
  }

  const { count: reservedMirrors, error: reservedError } = await supabase
    .from("event_resources")
    .select("id, events!inner(event_date,status,deleted_at)", { count: "exact", head: true })
    .eq("events.event_date", date)
    .neq("events.status", "cancelled")
    .is("events.deleted_at", null)
    .is("released_at", null);

  if (reservedError) {
    return Response.json({ error: "reservation_error" }, { status: 500 });
  }

  const total = totalMirrors ?? 0;
  const reserved = reservedMirrors ?? 0;
  const remaining = Math.max(0, total - reserved);

  // TODO: Hide event details; public endpoint returns counts only.
  const output = PublicAvailabilityResponseSchema.parse({
    date,
    total_mirrors: total,
    reserved_mirrors: reserved,
    remaining_mirrors: remaining,
    available: remaining > 0
  });

  return Response.json(output);
}
