import { B2BLeadCreateInputSchema, B2BLeadCreateOutputSchema, B2BLeadListQuerySchema, B2BLeadListOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";

export async function GET(req: Request) {
  const guard = await requireRole(req, ["admin", "ops", "sales"]);
  if (guard) return guard;

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = B2BLeadListQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: List B2B pipeline entries.
  const output = B2BLeadListOutputSchema.parse({
    items: []
  });

  return Response.json(output);
}

export async function POST(req: Request) {
  const guard = await requireRole(req, ["admin", "ops", "sales"]);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = B2BLeadCreateInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Create B2B CRM lead and audit log.
  const output = B2BLeadCreateOutputSchema.parse({
    leadId: "stub",
    status: "new"
  });

  return Response.json(output);
}
