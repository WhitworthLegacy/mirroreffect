import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { sendEmailViaResend, getUnsubscribeUrl } from "@/lib/email/resend";
import { renderTemplate } from "@/lib/notifications/renderTemplate";

// Vercel Cron protection
const CRON_SECRET = process.env.CRON_SECRET;

// Nurturing sequence: day offset → template key
const NURTURE_STEPS = [
  { day: 1, key: "NURTURE_J1_VALUE" },
  { day: 3, key: "NURTURE_J3_FAQ" },
  { day: 7, key: "NURTURE_J7_PROOF" },
  { day: 14, key: "NURTURE_J14_PROMO" },
  { day: 21, key: "NURTURE_J21_GOODBYE" },
] as const;

// Launch date: all leads created before this start nurturing from this date.
// New leads created after use their own created_at.
const NURTURE_LAUNCH_DATE = new Date("2026-01-27T00:00:00Z");

function getNurtureStartDate(createdAt: string): Date {
  const created = new Date(createdAt);
  return created < NURTURE_LAUNCH_DATE ? NURTURE_LAUNCH_DATE : created;
}

/**
 * Phase 1: Queue nurturing emails for leads with status='progress'
 * Computes nurture day from effective start date, queues the right template.
 */
async function queueNurturingEmails(supabase: ReturnType<typeof createSupabaseServerClient>) {
  let queued = 0;

  // Fetch all leads still in nurturing
  const { data: leads, error } = await supabase
    .from("leads")
    .select("lead_id, client_name, client_email, language, created_at")
    .eq("status", "progress");

  if (error) {
    console.error("[nurturing] Error fetching leads:", error.message);
    return 0;
  }

  if (!leads || leads.length === 0) return 0;

  const now = new Date();

  for (const lead of leads) {
    const startDate = getNurtureStartDate(lead.created_at);
    const daysSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    // Find which step matches today (±0.5 day window = ±12h)
    for (const step of NURTURE_STEPS) {
      if (Math.abs(daysSinceStart - step.day) > 0.5) continue;

      // Check if already queued/sent
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("template_key", step.key)
        .eq("to_email", lead.client_email)
        .maybeSingle();

      if (existing) continue;

      // Queue the nurturing email
      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          template_key: step.key,
          to_email: lead.client_email,
          locale: (lead.language || "fr").toLowerCase(),
          payload: {
            client_name: lead.client_name || "",
          },
          status: "queued",
        });

      if (insertError) {
        console.error(`[nurturing] Error queuing ${step.key} for ${lead.client_email}:`, insertError.message);
      } else {
        queued++;
        console.log(`[nurturing] Queued ${step.key} for ${lead.client_email} (day ${step.day})`);
      }
    }

    // Mark as abandoned if past day 22
    if (daysSinceStart > 22) {
      await supabase
        .from("leads")
        .update({ status: "abandoned" })
        .eq("lead_id", lead.lead_id);
      console.log(`[nurturing] Marked ${lead.client_email} as abandoned`);
    }
  }

  return queued;
}

/**
 * Cron job: queue nurturing emails + process queued emails
 * Runs daily at 8am via Vercel Cron
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
    // Phase 1: Queue nurturing emails for abandoned leads
    const nurtureQueued = await queueNurturingEmails(supabase);
    console.log(`[cron/send-emails] Phase 1: queued ${nurtureQueued} nurturing emails`);

    // Phase 2: Send all queued emails (limit 20 per run to avoid timeout)
    const { data: notifications, error: fetchError } = await supabase
      .from("notifications")
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
        nurture_queued: nurtureQueued,
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
          console.log(`[cron/send-emails] Sent: ${template_key} to ${to_email}`);
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
          console.error(`[cron/send-emails] Failed: ${template_key} to ${to_email}:`, result.error);
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
        console.error(`[cron/send-emails] Exception for ${id}:`, errorMessage);
      }

      // Small delay between sends to avoid Resend rate limits (2/s)
      await new Promise((r) => setTimeout(r, 600));
    }

    const duration = Date.now() - startTime;
    console.log(`[cron/send-emails] Done: sent=${sent}, failed=${failed}, duration=${duration}ms`);

    return Response.json({
      ok: true,
      nurture_queued: nurtureQueued,
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
