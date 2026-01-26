import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { sendEmailViaResend, getUnsubscribeUrl } from "@/lib/email/resend";
import { renderTemplate } from "@/lib/notifications/renderTemplate";

// Vercel Cron protection
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cron job to process queued emails
 * Runs every 5 minutes via Vercel Cron
 *
 * GET /api/cron/send-emails
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn("[cron/send-emails] Unauthorized request");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = createSupabaseServerClient();

  try {
    // Fetch queued notifications (limit 20 per run to avoid timeout)
    const { data: notifications, error: fetchError } = await supabase
      .from("notifications_log")
      .select("*")
      .eq("status", "queued")
      .or("send_after.is.null,send_after.lte.now()")
      .order("created_at", { ascending: true })
      .limit(20);

    if (fetchError) {
      console.error("[cron/send-emails] Fetch error:", fetchError);
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      return Response.json({
        ok: true,
        processed: 0,
        message: "No queued emails",
        duration: `${Date.now() - startTime}ms`
      });
    }

    console.log(`[cron/send-emails] Processing ${notifications.length} emails`);

    let sent = 0;
    let failed = 0;
    const results: { id: string; status: string; error?: string }[] = [];

    for (const notification of notifications) {
      const { id, template_key, to_email, locale, payload, event_id } = notification;

      try {
        // Render the template
        const rendered = await renderTemplate({
          key: template_key,
          locale: locale || "fr",
          payload: {
            ...((payload as Record<string, unknown>) || {}),
            unsubscribe_url: getUnsubscribeUrl(to_email),
          },
        });

        if (!rendered) {
          console.warn(`[cron/send-emails] Template not found: ${template_key}`);
          await supabase
            .from("notifications_log")
            .update({
              status: "failed",
              error: `Template not found: ${template_key}`,
              sent_at: new Date().toISOString()
            })
            .eq("id", id);

          failed++;
          results.push({ id, status: "failed", error: "Template not found" });
          continue;
        }

        // Send via Resend
        const result = await sendEmailViaResend({
          to: to_email,
          subject: rendered.subject,
          html: rendered.html,
          tags: [
            { name: "template", value: template_key },
            { name: "event_id", value: event_id || "none" },
          ],
        });

        if (result.success) {
          await supabase
            .from("notifications_log")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              resend_message_id: result.messageId,
              error: null
            })
            .eq("id", id);

          sent++;
          results.push({ id, status: "sent" });
          console.log(`[cron/send-emails] Sent: ${template_key} to ${to_email}`);
        } else {
          await supabase
            .from("notifications_log")
            .update({
              status: "failed",
              error: result.error,
              sent_at: new Date().toISOString()
            })
            .eq("id", id);

          failed++;
          results.push({ id, status: "failed", error: result.error });
          console.error(`[cron/send-emails] Failed: ${template_key} to ${to_email}:`, result.error);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        await supabase
          .from("notifications_log")
          .update({
            status: "failed",
            error: errorMessage,
            sent_at: new Date().toISOString()
          })
          .eq("id", id);

        failed++;
        results.push({ id, status: "failed", error: errorMessage });
        console.error(`[cron/send-emails] Exception for ${id}:`, errorMessage);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[cron/send-emails] Done: sent=${sent}, failed=${failed}, duration=${duration}ms`);

    return Response.json({
      ok: true,
      processed: notifications.length,
      sent,
      failed,
      duration: `${duration}ms`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[cron/send-emails] Fatal error:", errorMessage);

    return Response.json(
      { error: errorMessage, duration: `${Date.now() - startTime}ms` },
      { status: 500 }
    );
  }
}
