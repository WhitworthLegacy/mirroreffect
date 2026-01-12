import { AvailabilityQuerySchema, AvailabilityOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";

export async function GET(req: Request) {
  const guard = await requireRole(req, ["public"]);
  if (guard) return guard;

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = AvailabilityQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Compute availability by mirror stock per-day.
  const output = AvailabilityOutputSchema.parse({
    date: parsed.data.date,
    available: true,
    remainingMirrors: 0
  });

  return Response.json(output);
}
