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

// Post-event sequence: day offset from event_date → template key
const POST_EVENT_STEPS = [
  { day: 1, key: "B2C_AVIS_GOOGLE" },
  { day: 4, key: "B2C_RELANCE_AVIS" },
  { day: 90, key: "B2C_EVENT_ANNIVERSARY" },   // ~3 mois
  { day: 270, key: "B2C_OFFRE_ANNIVERSAIRE" },  // ~9 mois
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

      // Check unsubscribe before queuing
      if (await isUnsubscribed(supabase, lead.client_email)) {
        console.log(`[nurturing] Skipped ${step.key} for ${lead.client_email} (unsubscribed)`);
        continue;
      }

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
 * Check if an email address has unsubscribed
 * Checks both leads table (legacy) and new email_unsubscribes table
 */
async function isUnsubscribed(supabase: ReturnType<typeof createSupabaseServerClient>, email: string): Promise<boolean> {
  // Check new unsubscribes table first
  const { data: unsubRecord } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email.toLowerCase())
    .in("category", ["marketing", "all"])
    .maybeSingle();

  if (unsubRecord) return true;

  // Fallback: check legacy leads table
  const { data: leadData } = await supabase
    .from("leads")
    .select("status")
    .eq("client_email", email.toLowerCase())
    .eq("status", "unsubscribed")
    .maybeSingle();

  return !!leadData;
}

/**
 * Phase 2: Queue post-event emails based on event_date
 * J+1 → avis Google, J+4 → relance avis, M+3 → anniversaire, M+9 → offre
 */
async function queuePostEventEmails(supabase: ReturnType<typeof createSupabaseServerClient>) {
  let queued = 0;

  // Fetch events that have an event_date in the past (event already happened)
  const { data: events, error } = await supabase
    .from("events")
    .select("event_id, client_name, client_email, language, event_date, pack_id, address")
    .not("event_date", "is", null)
    .lte("event_date", new Date().toISOString().split("T")[0]);

  if (error) {
    console.error("[post-event] Error fetching events:", error.message);
    return 0;
  }

  if (!events || events.length === 0) return 0;

  const now = new Date();

  for (const event of events) {
    const eventDate = new Date(event.event_date + "T00:00:00Z");
    const daysSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);

    for (const step of POST_EVENT_STEPS) {
      // ±0.5 day window for J+1/J+4, ±1 day window for monthly steps (reduced from ±3)
      const tolerance = step.day >= 90 ? 1 : 0.5;
      if (Math.abs(daysSinceEvent - step.day) > tolerance) continue;

      // Check if already queued/sent for this event + template
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("template_key", step.key)
        .eq("to_email", event.client_email)
        .eq("event_id", event.event_id)
        .maybeSingle();

      if (existing) continue;

      // Check unsubscribe
      if (await isUnsubscribed(supabase, event.client_email)) {
        console.log(`[post-event] Skipped ${step.key} for ${event.client_email} (unsubscribed)`);
        continue;
      }

      // Queue the post-event email
      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          event_id: event.event_id,
          template_key: step.key,
          to_email: event.client_email,
          locale: (event.language || "fr").toLowerCase(),
          payload: {
            client_name: event.client_name || "",
            event_date: event.event_date || "",
            address: event.address || "",
            review_link: "https://maps.app.goo.gl/2fRxsTJnuZzjJ92B6",
            vip_reduction: "-50 € sur votre prochaine commande",
          },
          status: "queued",
        });

      if (insertError) {
        console.error(`[post-event] Error queuing ${step.key} for ${event.client_email}:`, insertError.message);
      } else {
        queued++;
        console.log(`[post-event] Queued ${step.key} for ${event.client_email} (day ${step.day}, event ${event.event_id})`);
      }
    }
  }

  return queued;
}

/**
 * Cron job: queue nurturing emails + post-event emails + process queued emails
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
    // Phase 1: Queue nurturing emails for leads in progress
    const nurtureQueued = await queueNurturingEmails(supabase);
    console.log(`[cron/send-emails] Phase 1: queued ${nurtureQueued} nurturing emails`);

    // Phase 2: Queue post-event emails based on event_date
    const postEventQueued = await queuePostEventEmails(supabase);
    console.log(`[cron/send-emails] Phase 2: queued ${postEventQueued} post-event emails`);

    // Phase 3: Send all queued emails (limit 20 per run to avoid timeout)
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
        post_event_queued: postEventQueued,
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
      post_event_queued: postEventQueued,
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
