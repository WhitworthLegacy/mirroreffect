import { z } from "zod";

export const MollieWebhookInputSchema = z.object({
  id: z.string().min(1)
});

export const MollieWebhookOutputSchema = z.object({
  received: z.boolean()
});

export const ZenfactureWebhookInputSchema = z.object({
  id: z.string().min(1),
  status: z.string().optional()
});

export const ZenfactureWebhookOutputSchema = z.object({
  received: z.boolean()
});

export type MollieWebhookInput = z.infer<typeof MollieWebhookInputSchema>;
export type MollieWebhookOutput = z.infer<typeof MollieWebhookOutputSchema>;
export type ZenfactureWebhookInput = z.infer<typeof ZenfactureWebhookInputSchema>;
export type ZenfactureWebhookOutput = z.infer<typeof ZenfactureWebhookOutputSchema>;
