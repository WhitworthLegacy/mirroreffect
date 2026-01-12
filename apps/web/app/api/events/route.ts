import { EventCreateInputSchema, EventCreateOutputSchema, EventListQuerySchema, EventListOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";

export async function GET(req: Request) {
  const guard = await requireRole(req, ["admin", "ops", "sales", "staff"]);
  if (guard) return guard;

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = EventListQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Filter events per role (staff scoped to assigned mirrors).
  const output = EventListOutputSchema.parse({
    items: []
  });

  return Response.json(output);
}

export async function POST(req: Request) {
  const guard = await requireRole(req, ["admin", "ops"]);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = EventCreateInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Create event, reserve mirror stock, enqueue Google Calendar sync.
  const output = EventCreateOutputSchema.parse({
    eventId: "stub",
    status: "scheduled"
  });

  return Response.json(output);
}
