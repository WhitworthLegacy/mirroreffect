import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { sendEmail } from "@/lib/email/smtp";
import { renderTemplate } from "@/lib/notifications/renderTemplate";

const MAX_PER_DAY = 5;
const BATCH_LIMIT = 50;

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function POST(req: Request) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const nowIso = new Date().toISOString();

  const { data: queue, error: queueError } = await supabase
    .from("notification_queue")
    .select("id, template_key, to_email, locale, payload, send_after")
    .eq("status", "queued")
    .lte("send_after", nowIso)
    .order("send_after", { ascending: true })
    .limit(BATCH_LIMIT);

  if (queueError) {
    return Response.json({ error: "queue_fetch_failed" }, { status: 500 });
  }

  for (const item of queue ?? []) {
    const dayStartIso = startOfTodayUTC().toISOString();
    const { count: sentToday } = await supabase
      .from("notification_logs")
      .select("id", { count: "exact", head: true })
      .eq("to_email", item.to_email)
      .gte("sent_at", dayStartIso);

    if ((sentToday ?? 0) >= MAX_PER_DAY) {
      await supabase.from("notification_queue").update({ status: "failed" }).eq("id", item.id);
      await supabase.from("notification_logs").insert({
        queue_id: item.id,
        to_email: item.to_email,
        status: "failed",
        error: "rate_limited"
      });
      continue;
    }

    const rendered = await renderTemplate({
      key: item.template_key,
      locale: item.locale ?? undefined,
      payload: item.payload ?? undefined
    });

    if (!rendered) {
      await supabase.from("notification_queue").update({ status: "failed" }).eq("id", item.id);
      await supabase.from("notification_logs").insert({
        queue_id: item.id,
        to_email: item.to_email,
        status: "failed",
        error: "template_not_found"
      });
      continue;
    }

    try {
      const providerMessageId = await sendEmail({
        to: item.to_email,
        subject: rendered.subject,
        html: rendered.html
      });

      await supabase.from("notification_queue").update({ status: "sent" }).eq("id", item.id);
      await supabase.from("notification_logs").insert({
        queue_id: item.id,
        to_email: item.to_email,
        subject: rendered.subject,
        html: rendered.html,
        status: "sent",
        provider_message_id: providerMessageId,
        sent_at: new Date().toISOString()
      });
    } catch (error) {
      await supabase.from("notification_queue").update({ status: "failed" }).eq("id", item.id);
      await supabase.from("notification_logs").insert({
        queue_id: item.id,
        to_email: item.to_email,
        subject: rendered.subject,
        html: rendered.html,
        status: "failed",
        error: error instanceof Error ? error.message : "send_failed"
      });
    }
  }

  return Response.json({ dispatched: queue?.length ?? 0 });
}
