import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { sendEmailViaResend } from "@/lib/email/resend";
import { renderEventPreparation } from "@/lib/notifications/templates/event-preparation";

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
 * TEST ENDPOINT - Send preparation email NOW
 * No auth required, for testing only
 *
 * GET /api/test/send-preparation-now
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const supabase = createSupabaseServerClient();

  try {
    // Calculate date range: next weekend (J+7 to J+9)
    const today = new Date();
    const j7 = new Date(today);
    j7.setDate(today.getDate() + 7);
    const j9 = new Date(today);
    j9.setDate(today.getDate() + 9);

    const startDate = j7.toISOString().split("T")[0];
    const endDate = j9.toISOString().split("T")[0];

    console.log(`[test/send-preparation-now] Looking for events between ${startDate} and ${endDate}`);

    // Fetch events
    const { data: events, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .in("status", ["active", "confirmed"])
      .gte("event_date", startDate)
      .lte("event_date", endDate)
      .order("event_date", { ascending: true });

    if (fetchError) {
      console.error("[test/send-preparation-now] Fetch error:", fetchError);
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return Response.json({
        ok: true,
        processed: 0,
        message: "No events for next weekend",
        dateRange: { start: startDate, end: endDate },
        duration: `${Date.now() - startTime}ms`,
      });
    }

    console.log(`[test/send-preparation-now] Found ${events.length} events`);

    let sent = 0;
    let failed = 0;
    const results: any[] = [];

    for (const event of events) {
      const {
        id: eventUuid,
        event_id,
        client_name,
        client_email,
        event_date,
        address,
        guest_count,
        total_cents,
        deposit_cents,
        balance_due_cents,
      } = event;

      try {
        // Determine pack code
        let packCode: "DISCOVERY" | "ESSENTIAL" | "PREMIUM" = "ESSENTIAL";
        if (total_cents <= 45000) packCode = "DISCOVERY";
        else if (total_cents <= 50000) packCode = "ESSENTIAL";
        else packCode = "PREMIUM";

        const packName = PACK_NAMES[packCode];
        const includedPrints = PACK_PRINTS[packCode];
        const recommendedPrints = Math.ceil((guest_count || 50) * 3.5);

        let upgradePrice: number | undefined;
        if (packCode === "DISCOVERY") {
          upgradePrice = PACK_PRICES.ESSENTIAL - PACK_PRICES.DISCOVERY;
        } else if (packCode === "ESSENTIAL") {
          upgradePrice = PACK_PRICES.PREMIUM - PACK_PRICES.ESSENTIAL;
        }

        const eventDateObj = new Date(event_date + "T00:00:00");
        const eventDateFormatted = eventDateObj.toLocaleDateString("fr-BE", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        const deadlineDate = new Date(eventDateObj);
        deadlineDate.setDate(deadlineDate.getDate() - 2);
        const deadlineDateFormatted = deadlineDate.toLocaleDateString("fr-BE", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

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
            { name: "template", value: "event_preparation_test" },
            { name: "event_id", value: event_id || "test" },
          ],
        });

        if (result.success) {
          sent++;
          results.push({
            event_id: event_id || eventUuid,
            client_email,
            status: "sent",
            message_id: result.messageId,
          });

          // Create notification record
          if (eventUuid) {
            await supabase.from("notifications").insert({
              event_id: eventUuid,
              template_key: "EVENT_PREPARATION",
              to_email: client_email,
              locale: "fr",
              payload: {
                client_name: client_name || "",
                event_date: event_date || "",
                pack_name: packName,
              },
              status: "sent",
            });
          }

          console.log(`[test/send-preparation-now] ✅ Sent to ${client_email}`);
        } else {
          failed++;
          results.push({
            event_id: event_id || eventUuid,
            client_email,
            status: "failed",
            error: result.error,
          });
          console.error(`[test/send-preparation-now] ❌ Failed for ${client_email}:`, result.error);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        failed++;
        results.push({
          event_id,
          client_email,
          status: "failed",
          error: errorMessage,
        });
        console.error(`[test/send-preparation-now] Exception:`, errorMessage);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[test/send-preparation-now] Done: sent=${sent}, failed=${failed}`);

    return Response.json({
      ok: true,
      dateRange: { start: startDate, end: endDate },
      events_found: events.length,
      sent,
      failed,
      results,
      duration: `${duration}ms`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[test/send-preparation-now] Fatal error:", errorMessage);

    return Response.json(
      { error: errorMessage, duration: `${Date.now() - startTime}ms` },
      { status: 500 }
    );
  }
}
