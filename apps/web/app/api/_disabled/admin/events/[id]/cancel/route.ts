import { AdminCancelEventOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request, context: { params: { id: string } }) {
  const guard = await requireRole(req, ["admin", "ops"]);
  if (guard) return guard;

  const supabase = createSupabaseServerClient();
  const eventId = context.params.id;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,status")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    return Response.json({ error: "event_not_found" }, { status: 404 });
  }

  if (event.status === "cancelled") {
    return Response.json(AdminCancelEventOutputSchema.parse({ cancelled: true }));
  }

  const { error: updateError } = await supabase.from("events").update({ status: "cancelled" }).eq("id", eventId);

  if (updateError) {
    return Response.json({ error: "event_cancel_failed" }, { status: 500 });
  }

  const { error: releaseError } = await supabase
    .from("event_resources")
    .update({ released_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .is("released_at", null);

  if (releaseError) {
    return Response.json({ error: "resource_release_failed" }, { status: 500 });
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "event_cancelled",
    entity_id: eventId,
    metadata: {
      reason: "ops_cancel"
    }
  });

  if (auditError) {
    return Response.json({ error: "audit_log_failed" }, { status: 500 });
  }

  return Response.json(AdminCancelEventOutputSchema.parse({ cancelled: true }));
}
