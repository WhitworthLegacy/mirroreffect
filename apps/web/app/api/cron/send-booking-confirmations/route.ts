import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { sendEmailViaResend, getUnsubscribeUrl } from "@/lib/email/resend";
import { renderTemplate } from "@/lib/notifications/renderTemplate";

// Vercel Cron protection
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Fast cron job: Send booking confirmations immediately after payment
 * Runs every 15 minutes via Vercel Cron
 *
 * This is separate from the daily nurturing cron to ensure customers
 * get their booking confirmation within 15 minutes of payment rather
 * than waiting until 8 AM the next day.
 *
 * GET /api/cron/send-booking-confirmations
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn("[cron/booking-confirmations] Unauthorized request");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = createSupabaseServerClient();

  try {
    // Fetch only booking confirmation notifications that are queued
    const { data: notifications, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("template_key", "B2C_BOOKING_CONFIRMED")
      .eq("status", "queued")
      .or("send_after.is.null,send_after.lte.now()")
      .order("created_at", { ascending: true })
      .limit(10); // Process max 10 confirmations per run

    if (fetchError) {
      console.error("[cron/booking-confirmations] Fetch error:", fetchError);
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      return Response.json({
        ok: true,
        processed: 0,
        message: "No pending booking confirmations",
        duration: `${Date.now() - startTime}ms`
      });
    }

    console.log(`[cron/booking-confirmations] Processing ${notifications.length} confirmation emails`);

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
          console.warn(`[cron/booking-confirmations] Template not found: ${template_key}`);
          await supabase
            .from("notifications")
            .update({
              status: "failed",
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
            .from("notifications")
            .update({
              status: "sent",
              sent_at: new Date().toISOString()
            })
            .eq("id", id);

          sent++;
          results.push({ id, status: "sent" });
          console.log(`[cron/booking-confirmations] Sent: ${template_key} to ${to_email} for event ${event_id}`);
        } else {
          await supabase
            .from("notifications")
            .update({
              status: "failed",
              sent_at: new Date().toISOString()
            })
            .eq("id", id);

          failed++;
          results.push({ id, status: "failed", error: result.error });
          console.error(`[cron/booking-confirmations] Failed: ${template_key} to ${to_email}:`, result.error);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        await supabase
          .from("notifications")
          .update({
            status: "failed",
            sent_at: new Date().toISOString()
          })
          .eq("id", id);

        failed++;
        results.push({ id, status: "failed", error: errorMessage });
        console.error(`[cron/booking-confirmations] Exception for ${id}:`, errorMessage);
      }

      // Small delay between sends to avoid Resend rate limits (2/s)
      await new Promise((r) => setTimeout(r, 600));
    }

    const duration = Date.now() - startTime;
    console.log(`[cron/booking-confirmations] Done: sent=${sent}, failed=${failed}, duration=${duration}ms`);

    return Response.json({
      ok: true,
      processed: notifications.length,
      sent,
      failed,
      duration: `${duration}ms`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[cron/booking-confirmations] Fatal error:", errorMessage);

    return Response.json(
      { error: errorMessage, duration: `${Date.now() - startTime}ms` },
      { status: 500 }
    );
  }
}
