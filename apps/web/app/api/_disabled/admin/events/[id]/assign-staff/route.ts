import { AdminAssignStaffInputSchema, AdminAssignStaffOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request, context: { params: { id: string } }) {
  const guard = await requireRole(req, ["admin", "ops"]);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = AdminAssignStaffInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const eventId = context.params.id;

  const { error } = await supabase
    .from("event_staff_assignments")
    .upsert(
      {
        event_id: eventId,
        user_id: parsed.data.user_id,
        role: parsed.data.role ?? null
      },
      { onConflict: "event_id,user_id" }
    );

  if (error) {
    return Response.json({ error: "assignment_failed" }, { status: 500 });
  }

  return Response.json(AdminAssignStaffOutputSchema.parse({ assigned: true }));
}
