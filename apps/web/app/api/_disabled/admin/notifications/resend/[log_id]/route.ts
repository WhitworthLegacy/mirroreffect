import { NotificationResendOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/email/smtp";

export async function POST(_req: Request, context: { params: { log_id: string } }) {
  const guard = await requireRole(_req, ["admin", "ops"]);
  if (guard) return guard;

  const supabase = createSupabaseServerClient();
  const logId = context.params.log_id;

  const { data: log, error } = await supabase
    .from("notification_logs")
    .select("to_email, subject, html")
    .eq("id", logId)
    .maybeSingle();

  if (error || !log) {
    return Response.json({ error: "log_not_found" }, { status: 404 });
  }

  try {
    const providerMessageId = await sendEmail({
      to: log.to_email,
      subject: log.subject,
      html: log.html
    });

    await supabase.from("notification_logs").insert({
      to_email: log.to_email,
      subject: log.subject,
      html: log.html,
      status: "sent",
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString(),
      resent_from_log_id: logId
    });

    return Response.json(NotificationResendOutputSchema.parse({ resent: true }));
  } catch (error) {
    await supabase.from("notification_logs").insert({
      to_email: log.to_email,
      subject: log.subject,
      html: log.html,
      status: "failed",
      error: error instanceof Error ? error.message : "send_failed",
      resent_from_log_id: logId
    });
    return Response.json({ error: "send_failed" }, { status: 500 });
  }
}
