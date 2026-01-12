import { QualificationCreateInputSchema, QualificationCreateOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";

export async function POST(req: Request) {
  const guard = await requireRole(req, ["public"]);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = QualificationCreateInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Qualification rules for B2C pre-payment funnel (no CRM write).
  const output = QualificationCreateOutputSchema.parse({
    qualified: false,
    reason: "stub",
    requestId: "stub"
  });

  return Response.json(output);
}
