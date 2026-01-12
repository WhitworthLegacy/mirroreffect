import { z } from "zod";

export const PaymentIntentCreateInputSchema = z.object({
  bookingId: z.string().min(1),
  amountCents: z.number().int().min(1),
  currency: z.string().min(1)
});

export const PaymentIntentCreateOutputSchema = z.object({
  paymentId: z.string().min(1),
  status: z.string().min(1)
});

export type PaymentIntentCreateInput = z.infer<typeof PaymentIntentCreateInputSchema>;
export type PaymentIntentCreateOutput = z.infer<typeof PaymentIntentCreateOutputSchema>;
