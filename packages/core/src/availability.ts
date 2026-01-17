import { z } from "zod";

const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const FrenchDateSchema = z.string().regex(/^\d{1,2}\/\d{1,2}\/\d{4}$/);

export const AvailabilityQuerySchema = z.object({
  date: z.string().min(1)
});

export const AvailabilityOutputSchema = z.object({
  date: z.string().min(1),
  available: z.boolean(),
  remainingMirrors: z.number().int().min(0)
});

export const PublicAvailabilityQuerySchema = z.object({
  date: z.union([DateStringSchema, FrenchDateSchema])
});

export const PublicAvailabilityResponseSchema = z.object({
  date: DateStringSchema,
  total_mirrors: z.number().int().min(0),
  reserved_mirrors: z.number().int().min(0),
  remaining_mirrors: z.number().int().min(0),
  available: z.boolean()
});

export const AdminAvailabilityQuerySchema = z.object({
  from: DateStringSchema,
  to: DateStringSchema
});

export const AdminAvailabilityDaySchema = z.object({
  date: DateStringSchema,
  total_mirrors: z.number().int().min(0),
  reserved_mirrors: z.number().int().min(0),
  remaining_mirrors: z.number().int().min(0),
  available: z.boolean(),
  event_ids: z.array(z.string().min(1))
});

export const AdminAvailabilityResponseSchema = z.object({
  from: DateStringSchema,
  to: DateStringSchema,
  days: z.array(AdminAvailabilityDaySchema)
});

export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>;
export type AvailabilityOutput = z.infer<typeof AvailabilityOutputSchema>;
export type PublicAvailabilityQuery = z.infer<typeof PublicAvailabilityQuerySchema>;
export type PublicAvailabilityResponse = z.infer<typeof PublicAvailabilityResponseSchema>;
export type AdminAvailabilityQuery = z.infer<typeof AdminAvailabilityQuerySchema>;
export type AdminAvailabilityResponse = z.infer<typeof AdminAvailabilityResponseSchema>;
