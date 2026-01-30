import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { sendEmailViaResend } from "@/lib/email/resend";
import { renderEventPreparation } from "@/lib/notifications/templates/event-preparation";

// Vercel Cron protection
const CRON_SECRET = process.env.CRON_SECRET;

// Pack pricing for upsell calculations
const PACK_PRICES = {
  DISCOVERY: 450,
  ESSENTIAL: 500,
  PREMIUM: 550,
};

const PACK_NAMES = {
  DISCOVERY: "Découverte",
  ESSENTIAL: "Essentiel",
  PREMIUM: "Premium",
};

const PACK_PRINTS = {
  DISCOVERY: "150 photos 10×15",
  ESSENTIAL: "Illimité 3h",
  PREMIUM: "Illimité 5h",
};

/**
 * Weekly event preparation cron job
 * Runs every Friday at 10 AM
 * Sends preparation emails for events happening next weekend (J+7 to J+9)
 *
 * GET /api/cron/send-event-preparation
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn("[cron/event-preparation] Unauthorized request");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = createSupabaseServerClient();

  try {
    // Calculate date range: next weekend (Friday, Saturday, Sunday = J+7, J+8, J+9)
    const today = new Date();
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + 7);
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + 9);

    const startDate = nextFriday.toISOString().split("T")[0];
    const endDate = nextSunday.toISOString().split("T")[0];

    console.log(`[cron/event-preparation] Looking for events between ${startDate} and ${endDate}`);

    // Fetch events happening next weekend (active or confirmed status)
    const { data: events, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .in("status", ["active", "confirmed"])
      .gte("event_date", startDate)
      .lte("event_date", endDate)
      .order("event_date", { ascending: true });

    if (fetchError) {
      console.error("[cron/event-preparation] Fetch error:", fetchError);
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return Response.json({
        ok: true,
        processed: 0,
        message: "No events for next weekend",
        duration: `${Date.now() - startTime}ms`,
      });
    }

    console.log(`[cron/event-preparation] Found ${events.length} events for next weekend`);

    let sent = 0;
    let failed = 0;
    const results: { event_id: string; status: string; error?: string }[] = [];

    for (const event of events) {
      const {
        event_id,
        client_name,
        client_email,
        event_date,
        address,
        guest_count,
        pack_id,
        total_cents,
        deposit_cents,
        balance_due_cents,
      } = event;

      try {
        // Determine pack code from pack_id or deduce from pricing
        let packCode: "DISCOVERY" | "ESSENTIAL" | "PREMIUM" = "ESSENTIAL";
        if (pack_id) {
          // You might want to query the packs table to get the exact pack_code
          // For now, we'll deduce from total_cents
          if (total_cents <= 45000) packCode = "DISCOVERY";
          else if (total_cents <= 50000) packCode = "ESSENTIAL";
          else packCode = "PREMIUM";
        }

        const packName = PACK_NAMES[packCode];
        const includedPrints = PACK_PRINTS[packCode];

        // Calculate recommended prints: 3.5 per guest
        const recommendedPrints = Math.ceil((guest_count || 50) * 3.5);

        // Calculate upgrade price
        let upgradePrice: number | undefined;
        if (packCode === "DISCOVERY") {
          upgradePrice = PACK_PRICES.ESSENTIAL - PACK_PRICES.DISCOVERY;
        } else if (packCode === "ESSENTIAL") {
          upgradePrice = PACK_PRICES.PREMIUM - PACK_PRICES.ESSENTIAL;
        }

        // Format event date
        const eventDateObj = new Date(event_date + "T00:00:00");
        const eventDateFormatted = eventDateObj.toLocaleDateString("fr-BE", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Deadline: 2 days before event (Wednesday)
        const deadlineDate = new Date(eventDateObj);
        deadlineDate.setDate(deadlineDate.getDate() - 2);
        const deadlineDateFormatted = deadlineDate.toLocaleDateString("fr-BE", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

        // Calculate balance due in euros
        const balanceDue = balance_due_cents
          ? balance_due_cents / 100
          : total_cents && deposit_cents
            ? (total_cents - deposit_cents) / 100
            : 0;

        // Render email
        const { subject, html } = renderEventPreparation({
          client_name: client_name || "Cher client",
          event_date: eventDateFormatted,
          current_address: address || "À confirmer",
          guest_count: guest_count || 50,
          pack_name: packName,
          pack_code: packCode,
          included_prints: includedPrints,
          balance_due: balanceDue,
          recommended_prints: recommendedPrints,
          deadline_date: deadlineDateFormatted,
          upgrade_price: upgradePrice,
        });

        // Send email
        const result = await sendEmailViaResend({
          to: client_email,
          subject,
          html,
          tags: [
            { name: "template", value: "event_preparation" },
            { name: "event_id", value: event_id },
          ],
        });

        if (result.success) {
          sent++;
          results.push({ event_id, status: "sent" });
          console.log(`[cron/event-preparation] Sent to ${client_email} for event ${event_id}`);

          // Create notification record
          await supabase.from("notifications").insert({
            event_id: event.id, // UUID id
            template_key: "EVENT_PREPARATION",
            to_email: client_email,
            locale: (event.language || "fr").toLowerCase(),
            payload: {
              client_name: client_name || "",
              event_date: event_date || "",
              pack_name: packName,
            },
            status: "sent",
          });
        } else {
          failed++;
          results.push({ event_id, status: "failed", error: result.error });
          console.error(`[cron/event-preparation] Failed for ${client_email}:`, result.error);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        failed++;
        results.push({ event_id, status: "failed", error: errorMessage });
        console.error(`[cron/event-preparation] Exception for ${event_id}:`, errorMessage);
      }

      // Small delay between sends to avoid Resend rate limits
      await new Promise((r) => setTimeout(r, 600));
    }

    const duration = Date.now() - startTime;
    console.log(`[cron/event-preparation] Done: sent=${sent}, failed=${failed}, duration=${duration}ms`);

    return Response.json({
      ok: true,
      date_range: { start: startDate, end: endDate },
      events_found: events.length,
      processed: events.length,
      sent,
      failed,
      results,
      duration: `${duration}ms`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[cron/event-preparation] Fatal error:", errorMessage);

    return Response.json(
      { error: errorMessage, duration: `${Date.now() - startTime}ms` },
      { status: 500 }
    );
  }
}
