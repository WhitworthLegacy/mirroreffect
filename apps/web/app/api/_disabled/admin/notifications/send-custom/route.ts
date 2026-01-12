import { NotificationSendCustomInputSchema, NotificationSendCustomOutputSchema } from "@mirroreffect/core";
import { requireRole } from "@/lib/roleGuard";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/email/smtp";

export async function POST(req: Request) {
  const guard = await requireRole(req, ["admin", "ops"]);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = NotificationSendCustomInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_input", issues: parsed.error.format() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  try {
    const providerMessageId = await sendEmail({
      to: parsed.data.to_email,
      subject: parsed.data.subject,
      html: parsed.data.html
    });

    const { data: log, error } = await supabase
      .from("notification_logs")
      .insert({
        to_email: parsed.data.to_email,
        subject: parsed.data.subject,
        html: parsed.data.html,
        status: "sent",
        provider_message_id: providerMessageId,
        sent_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error || !log) {
      return Response.json({ error: "log_write_failed" }, { status: 500 });
    }

    return Response.json(NotificationSendCustomOutputSchema.parse({ log_id: log.id }));
  } catch (error) {
    await supabase.from("notification_logs").insert({
      to_email: parsed.data.to_email,
      subject: parsed.data.subject,
      html: parsed.data.html,
      status: "failed",
      error: error instanceof Error ? error.message : "send_failed"
    });
    return Response.json({ error: "send_failed" }, { status: 500 });
  }
}
