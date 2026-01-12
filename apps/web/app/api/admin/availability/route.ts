import { AdminAvailabilityQuerySchema, AdminAvailabilityResponseSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

function eachDate(from: string, to: string) {
  const days: string[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);

  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + 86400000)) {
    days.push(cursor.toISOString().slice(0, 10));
  }

  return days;
}

export async function GET(req: Request) {
  const guard = await requireRole(req, ["admin", "ops"]);
  if (guard) return guard;

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = AdminAvailabilityQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { from, to } = parsed.data;

  const { count: totalMirrors, error: totalError } = await supabase
    .from("inventory_items")
    .select("id", { count: "exact", head: true })
    .eq("type", "mirror")
    .neq("status", "out_of_service");

  if (totalError) {
    return Response.json({ error: "inventory_error" }, { status: 500 });
  }

  const { data: reservations, error: reservationsError } = await supabase
    .from("event_resources")
    .select("event_id, events!inner(event_date,status,deleted_at)")
    .gte("events.event_date", from)
    .lte("events.event_date", to)
    .neq("events.status", "cancelled")
    .is("events.deleted_at", null)
    .is("released_at", null);

  if (reservationsError) {
    return Response.json({ error: "reservation_error" }, { status: 500 });
  }

  const total = totalMirrors ?? 0;
  const byDate = new Map<string, { reserved: number; eventIds: Set<string> }>();

  for (const row of reservations ?? []) {
    const eventDate = (row as { events?: { event_date?: string } }).events?.event_date;
    const eventId = (row as { event_id?: string }).event_id;

    if (!eventDate || !eventId) {
      continue;
    }

    if (!byDate.has(eventDate)) {
      byDate.set(eventDate, { reserved: 0, eventIds: new Set() });
    }

    const entry = byDate.get(eventDate);
    if (entry) {
      entry.reserved += 1;
      entry.eventIds.add(eventId);
    }
  }

  const days = eachDate(from, to).map((date) => {
    const entry = byDate.get(date);
    const reserved = entry?.reserved ?? 0;
    const remaining = Math.max(0, total - reserved);

    return {
      date,
      total_mirrors: total,
      reserved_mirrors: reserved,
      remaining_mirrors: remaining,
      available: remaining > 0,
      event_ids: entry ? Array.from(entry.eventIds) : []
    };
  });

  // TODO: Optional filtering of event_ids based on admin scope.
  const output = AdminAvailabilityResponseSchema.parse({
    from,
    to,
    days
  });

  return Response.json(output);
}
