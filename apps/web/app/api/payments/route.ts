import { PaymentIntentCreateInputSchema, PaymentIntentCreateOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";

export async function POST(req: Request) {
  const guard = await requireRole(req, ["admin", "ops"]);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = PaymentIntentCreateInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Create Mollie payment intent and persist pre-payment funnel state.
  const output = PaymentIntentCreateOutputSchema.parse({
    paymentId: "stub",
    status: "pending"
  });

  return Response.json(output);
}
