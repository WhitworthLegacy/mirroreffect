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

/**
 * Phase 1: Queue nurturing emails for abandoned leads
 * Checks leads with status='progress' and queues the appropriate
 * nurturing email based on how many days since lead creation.
 */
async function queueNurturingEmails(supabase: ReturnType<typeof createSupabaseServerClient>) {
  let queued = 0;

  for (const step of NURTURE_STEPS) {
    // Find leads created exactly N days ago (±12h window to avoid duplicates)
    // e.g. for day=1, find leads created between 12h ago and 36h ago
    const minHours = step.day * 24 - 12;
    const maxHours = step.day * 24 + 12;
    const now = new Date();
    const after = new Date(now.getTime() - maxHours * 60 * 60 * 1000).toISOString();
    const before = new Date(now.getTime() - minHours * 60 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
      .from("leads")
      .select("lead_id, client_name, client_email, language")
      .eq("status", "progress")
      .gte("created_at", after)
      .lte("created_at", before);

    if (error) {
      console.error(`[nurturing] Error fetching leads for ${step.key}:`, error.message);
      continue;
    }

    if (!leads || leads.length === 0) continue;

    for (const lead of leads) {
      // Check if this nurturing email was already queued/sent for this lead
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("template_key", step.key)
        .eq("to_email", lead.client_email)
        .maybeSingle();

      if (existing) continue; // Already queued or sent

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
        console.log(`[nurturing] Queued ${step.key} for ${lead.client_email}`);
      }
    }
  }

  // Mark leads older than 21 days as abandoned (stop nurturing)
  const abandonCutoff = new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("leads")
    .update({ status: "abandoned" })
    .eq("status", "progress")
    .lte("created_at", abandonCutoff);

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
