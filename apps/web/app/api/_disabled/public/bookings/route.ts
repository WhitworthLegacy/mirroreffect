import { z } from "zod";
import { requireRole } from "@/lib/roleGuard";

const BookingCreateInputSchema = z.object({
  date: z.string().min(1),
  zoneId: z.string().min(1),
  packId: z.string().min(1),
  options: z.array(z.string().min(1)),
  contactEmail: z.string().email(),
  contactName: z.string().min(1),
  notes: z.string().optional()
});

const BookingCreateOutputSchema = z.object({
  bookingId: z.string().min(1),
  paymentId: z.string().min(1),
  status: z.enum(["pending_payment", "confirmed", "rejected"])
});

const DEPOSIT_EUR_CENTS = 18000;

export async function POST(req: Request) {
  const guard = await requireRole(req, ["public"]);
  if (guard) return guard;

  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return Response.json({ error: "missing_idempotency_key" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BookingCreateInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  // TODO: Enforce booking per-day (date-only, no time) and validate zone/pack/options.
  // TODO: Lookup existing booking by idempotency key and return it if found.
  // TODO: Create booking record in pending_payment state (B2C funnel only).
  // TODO: Create Mollie payment for 180 EUR deposit and store paymentId.

  const output = BookingCreateOutputSchema.parse({
    bookingId: "stub",
    paymentId: "stub",
    status: "pending_payment"
  });

  return Response.json(output, { status: 201 });
}
