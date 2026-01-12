import { BookingCreateInputSchema, BookingCreateOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";

export async function POST(req: Request) {
  const guard = await requireRole(req, ["public"]);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = BookingCreateInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Enforce booking per-day and mirror stock availability.
  // TODO: Persist booking request and trigger Mollie payment intent.
  const output = BookingCreateOutputSchema.parse({
    bookingId: "stub",
    status: "pending_payment"
  });

  return Response.json(output);
}
