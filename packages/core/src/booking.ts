import { z } from "zod";

export const QualificationCreateInputSchema = z.object({
  date: z.string().min(1),
  location: z.string().min(1),
  guests: z.number().int().min(1)
});

export const QualificationCreateOutputSchema = z.object({
  qualified: z.boolean(),
  reason: z.string().min(1),
  requestId: z.string().min(1)
});

export const BookingCreateInputSchema = z.object({
  date: z.string().min(1),
  contactEmail: z.string().email(),
  contactName: z.string().min(1),
  notes: z.string().optional()
});

export const BookingCreateOutputSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["pending_payment", "confirmed", "rejected"])
});

export type QualificationCreateInput = z.infer<typeof QualificationCreateInputSchema>;
export type QualificationCreateOutput = z.infer<typeof QualificationCreateOutputSchema>;
export type BookingCreateInput = z.infer<typeof BookingCreateInputSchema>;
export type BookingCreateOutput = z.infer<typeof BookingCreateOutputSchema>;
