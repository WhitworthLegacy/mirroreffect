import { AdminEventsListOutputSchema, AdminEventsListQuerySchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const guard = await requireRole(req, ["admin", "ops", "sales"]);
  if (guard) return guard;

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = AdminEventsListQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("events")
    .select("id,event_date,status,ops_stage_id,assigned_ops_user_id");

  if (parsed.data.from) {
    query = query.gte("event_date", parsed.data.from);
  }

  if (parsed.data.to) {
    query = query.lte("event_date", parsed.data.to);
  }

  if (parsed.data.stage) {
    query = query.eq("ops_stage_id", parsed.data.stage);
  }

  if (parsed.data.q) {
    // TODO: Replace with full-text search field when available.
    query = query.ilike("search_text", `%${parsed.data.q}%`);
  }

  const { data, error } = await query.order("event_date", { ascending: true });

  if (error) {
    return Response.json({ error: "events_fetch_failed" }, { status: 500 });
  }

  return Response.json(
    AdminEventsListOutputSchema.parse({
      items: data ?? []
    })
  );
}
