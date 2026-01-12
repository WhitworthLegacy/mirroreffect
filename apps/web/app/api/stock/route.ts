import { StockAdjustInputSchema, StockAdjustOutputSchema, StockListQuerySchema, StockListOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";

export async function GET(req: Request) {
  const guard = await requireRole(req, ["admin", "ops", "staff"]);
  if (guard) return guard;

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = StockListQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Return mirror stock inventory.
  const output = StockListOutputSchema.parse({
    items: []
  });

  return Response.json(output);
}

export async function POST(req: Request) {
  const guard = await requireRole(req, ["admin", "ops"]);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = StockAdjustInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Update stock and write audit log.
  const output = StockAdjustOutputSchema.parse({
    adjustmentId: "stub",
    status: "applied"
  });

  return Response.json(output);
}
