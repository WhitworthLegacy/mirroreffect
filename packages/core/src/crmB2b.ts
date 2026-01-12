import { z } from "zod";

export const B2BLeadListQuerySchema = z.object({
  stage: z.string().optional(),
  ownerId: z.string().optional()
});

export const B2BLeadListOutputSchema = z.object({
  items: z.array(
    z.object({
      leadId: z.string().min(1),
      company: z.string().min(1),
      status: z.string().min(1)
    })
  )
});

export const B2BLeadCreateInputSchema = z.object({
  company: z.string().min(1),
  contactEmail: z.string().email(),
  notes: z.string().optional()
});

export const B2BLeadCreateOutputSchema = z.object({
  leadId: z.string().min(1),
  status: z.string().min(1)
});

export type B2BLeadListQuery = z.infer<typeof B2BLeadListQuerySchema>;
export type B2BLeadListOutput = z.infer<typeof B2BLeadListOutputSchema>;
export type B2BLeadCreateInput = z.infer<typeof B2BLeadCreateInputSchema>;
export type B2BLeadCreateOutput = z.infer<typeof B2BLeadCreateOutputSchema>;
