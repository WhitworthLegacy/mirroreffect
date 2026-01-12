import { z } from "zod";

export const AdminAuditLogInputSchema = z.object({
  action: z.string().min(1),
  entityId: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

export const AdminAuditLogOutputSchema = z.object({
  auditId: z.string().min(1),
  status: z.string().min(1)
});

export const NotificationSendCustomInputSchema = z.object({
  to_email: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1)
});

export const NotificationSendCustomOutputSchema = z.object({
  log_id: z.string().min(1)
});

export const NotificationResendOutputSchema = z.object({
  resent: z.boolean()
});

export type AdminAuditLogInput = z.infer<typeof AdminAuditLogInputSchema>;
export type AdminAuditLogOutput = z.infer<typeof AdminAuditLogOutputSchema>;
export type NotificationSendCustomInput = z.infer<typeof NotificationSendCustomInputSchema>;
export type NotificationSendCustomOutput = z.infer<typeof NotificationSendCustomOutputSchema>;
export type NotificationResendOutput = z.infer<typeof NotificationResendOutputSchema>;
