import { AdminEventDetailOutputSchema, AdminEventUpdateInputSchema, AdminEventUpdateOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

async function validateStageTransition(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  currentStageId: string | null,
  nextStageId: string
) {
  const { data: pipeline, error: pipelineError } = await supabase
    .from("pipelines")
    .select("id")
    .eq("code", "B2C_OPS")
    .maybeSingle();

  if (pipelineError || !pipeline) {
    return { ok: false, error: "pipeline_not_found" };
  }

  const { data: stages, error: stagesError } = await supabase
    .from("pipeline_stages")
    .select("id, position")
    .eq("pipeline_id", pipeline.id)
    .order("position", { ascending: true });

  if (stagesError || !stages) {
    return { ok: false, error: "pipeline_stages_not_found" };
  }

  const stageMap = new Map(stages.map((stage) => [stage.id, stage.position]));
  const nextPosition = stageMap.get(nextStageId);

  if (nextPosition === undefined) {
    return { ok: false, error: "invalid_stage" };
  }

  if (currentStageId) {
    const currentPosition = stageMap.get(currentStageId);
    if (currentPosition === undefined) {
      return { ok: false, error: "invalid_current_stage" };
    }
    if (nextPosition < currentPosition) {
      return { ok: false, error: "invalid_transition" };
    }
  }

  return { ok: true };
}

export async function GET(req: Request, context: { params: { id: string } }) {
  const guard = await requireRole(req, ["admin", "ops", "sales"]);
  if (guard) return guard;

  const supabase = createSupabaseServerClient();
  const eventId = context.params.id;

  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id,event_date,status,address,on_site_contact,schedule_notes,assigned_ops_user_id,ops_stage_id,event_resources(id,inventory_item_id,released_at),event_staff_assignments(user_id,role)"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    return Response.json({ error: "event_not_found" }, { status: 404 });
  }

  return Response.json(
    AdminEventDetailOutputSchema.parse({
      id: event.id,
      event_date: event.event_date,
      status: event.status,
      address: event.address ?? null,
      on_site_contact: event.on_site_contact ?? null,
      schedule_notes: event.schedule_notes ?? null,
      assigned_ops_user_id: event.assigned_ops_user_id ?? null,
      ops_stage_id: event.ops_stage_id ?? null,
      resources: event.event_resources ?? [],
      staff: event.event_staff_assignments ?? []
    })
  );
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const guard = await requireRole(req, ["admin", "ops"]);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = AdminEventUpdateInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const eventId = context.params.id;

  const { data: current, error: currentError } = await supabase
    .from("events")
    .select("id, ops_stage_id")
    .eq("id", eventId)
    .maybeSingle();

  if (currentError || !current) {
    return Response.json({ error: "event_not_found" }, { status: 404 });
  }

  if (parsed.data.ops_stage_id) {
    const validation = await validateStageTransition(supabase, current.ops_stage_id, parsed.data.ops_stage_id);
    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }
  }

  const { error: updateError } = await supabase.from("events").update(parsed.data).eq("id", eventId);

  if (updateError) {
    return Response.json({ error: "event_update_failed" }, { status: 500 });
  }

  return Response.json(AdminEventUpdateOutputSchema.parse({ id: eventId, updated: true }));
}
