import { z } from "zod";

const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const EventListQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional()
});

export const EventListOutputSchema = z.object({
  items: z.array(
    z.object({
      eventId: z.string().min(1),
      date: z.string().min(1),
      status: z.string().min(1)
    })
  )
});

export const EventCreateInputSchema = z.object({
  date: z.string().min(1),
  bookingId: z.string().min(1),
  mirrorId: z.string().min(1)
});

export const EventCreateOutputSchema = z.object({
  eventId: z.string().min(1),
  status: z.string().min(1)
});

export const AdminEventsListQuerySchema = z.object({
  from: DateStringSchema.optional(),
  to: DateStringSchema.optional(),
  stage: z.string().optional(),
  q: z.string().optional()
});

export const AdminEventListItemSchema = z.object({
  id: z.string().min(1),
  event_date: DateStringSchema,
  status: z.string().min(1),
  ops_stage_id: z.string().nullable(),
  assigned_ops_user_id: z.string().nullable()
});

export const AdminEventsListOutputSchema = z.object({
  items: z.array(AdminEventListItemSchema)
});

export const AdminEventDetailOutputSchema = z.object({
  id: z.string().min(1),
  event_date: DateStringSchema,
  status: z.string().min(1),
  address: z.string().nullable(),
  on_site_contact: z.string().nullable(),
  schedule_notes: z.string().nullable(),
  assigned_ops_user_id: z.string().nullable(),
  ops_stage_id: z.string().nullable(),
  resources: z.array(
    z.object({
      id: z.string().min(1),
      inventory_item_id: z.string().min(1),
      released_at: z.string().nullable()
    })
  ),
  staff: z.array(
    z.object({
      user_id: z.string().min(1),
      role: z.string().nullable()
    })
  )
});

export const AdminEventUpdateInputSchema = z.object({
  address: z.string().min(1).optional(),
  on_site_contact: z.string().min(1).optional(),
  schedule_notes: z.string().min(1).optional(),
  assigned_ops_user_id: z.string().min(1).optional(),
  ops_stage_id: z.string().min(1).optional()
});

export const AdminEventUpdateOutputSchema = z.object({
  id: z.string().min(1),
  updated: z.boolean()
});

export const AdminAssignMirrorInputSchema = z.object({
  mirror_id: z.string().min(1).optional()
});

export const AdminAssignMirrorOutputSchema = z.object({
  assigned: z.boolean(),
  mirror_id: z.string().min(1)
});

export const AdminAssignStaffInputSchema = z.object({
  user_id: z.string().min(1),
  role: z.string().optional()
});

export const AdminAssignStaffOutputSchema = z.object({
  assigned: z.boolean()
});

export const AdminCancelEventOutputSchema = z.object({
  cancelled: z.boolean()
});

export type EventListQuery = z.infer<typeof EventListQuerySchema>;
export type EventListOutput = z.infer<typeof EventListOutputSchema>;
export type EventCreateInput = z.infer<typeof EventCreateInputSchema>;
export type EventCreateOutput = z.infer<typeof EventCreateOutputSchema>;
export type AdminEventsListQuery = z.infer<typeof AdminEventsListQuerySchema>;
export type AdminEventsListOutput = z.infer<typeof AdminEventsListOutputSchema>;
export type AdminEventDetailOutput = z.infer<typeof AdminEventDetailOutputSchema>;
export type AdminEventUpdateInput = z.infer<typeof AdminEventUpdateInputSchema>;
export type AdminEventUpdateOutput = z.infer<typeof AdminEventUpdateOutputSchema>;
export type AdminAssignMirrorInput = z.infer<typeof AdminAssignMirrorInputSchema>;
export type AdminAssignMirrorOutput = z.infer<typeof AdminAssignMirrorOutputSchema>;
export type AdminAssignStaffInput = z.infer<typeof AdminAssignStaffInputSchema>;
export type AdminAssignStaffOutput = z.infer<typeof AdminAssignStaffOutputSchema>;
export type AdminCancelEventOutput = z.infer<typeof AdminCancelEventOutputSchema>;
