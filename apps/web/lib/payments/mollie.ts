import { z } from "zod";

const MolliePaymentSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  amount: z.object({
    value: z.string().min(1),
    currency: z.string().min(1)
  }),
  paidAt: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

function parseAmountToCents(amount: { value: string }) {
  const normalized = Number(amount.value);
  if (Number.isNaN(normalized)) {
    return 0;
  }
  return Math.round(normalized * 100);
}

export async function fetchMolliePaymentStatus(paymentId: string) {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing MOLLIE_API_KEY");
  }

  // TODO: Replace with Mollie SDK if desired; keep REST for now.
  const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    return null;
  }

  const json = await res.json().catch(() => null);
  const parsed = MolliePaymentSchema.safeParse(json);

  if (!parsed.success) {
    return null;
  }

  return {
    id: parsed.data.id,
    status: parsed.data.status,
    amount_cents: parseAmountToCents(parsed.data.amount),
    currency: parsed.data.amount.currency,
    paid_at: parsed.data.paidAt ?? null,
    metadata: parsed.data.metadata ?? null
  };
}
