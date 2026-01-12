import { ZenfactureWebhookInputSchema, ZenfactureWebhookOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";

export async function POST(req: Request) {
  const guard = await requireRole(req, ["system"]);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = ZenfactureWebhookInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Verify Zenfacture signature and update invoice status.
  const output = ZenfactureWebhookOutputSchema.parse({
    received: true
  });

  return Response.json(output);
}
