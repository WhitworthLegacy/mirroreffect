import { NextRequest } from "next/server";
import { sendEmailViaResend } from "@/lib/email/resend";
import { renderEventPreparation } from "@/lib/notifications/templates/event-preparation";

/**
 * TEST ENDPOINT - Send event preparation email to verify inbox delivery and branding
 * No auth required, for testing only
 *
 * GET /api/test/send-test-emails
 */
export async function GET(request: NextRequest) {
  const TEST_EMAIL = "ajsrl.amz@gmail.com";
  const requestId = crypto.randomUUID();

  console.log(`[test-emails][${requestId}] Sending event preparation test email to ${TEST_EMAIL}`);

  const results: any[] = [];

  // Event Preparation Email Test
  try {
    const eventDateObj = new Date("2026-02-14T00:00:00");
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

    const { subject, html } = renderEventPreparation({
      client_name: "Test Client",
      event_date: eventDateFormatted,
      current_address: "Château de Beloeil, Rue du Château 11, 7970 Beloeil",
      guest_count: 80,
      pack_name: "Essentiel",
      pack_code: "ESSENTIAL",
      included_prints: "Illimité 3h",
      balance_due: 300,
      recommended_prints: Math.ceil(80 * 3.5),
      deadline_date: deadlineDateFormatted,
      upgrade_price: 50,
    });

    const preparationResult = await sendEmailViaResend({
      to: TEST_EMAIL,
      subject: `🎉 Test - ${subject}`,
      html,
      tags: [
        { name: "template", value: "event_preparation_test" },
        { name: "test", value: "true" },
      ],
    });

    results.push({
      email_type: "event_preparation",
      status: preparationResult.success ? "sent" : "failed",
      message_id: preparationResult.messageId,
      error: preparationResult.error,
    });

    console.log(
      `[test-emails][${requestId}] Event preparation: ${preparationResult.success ? "sent" : "failed"}`
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({
      email_type: "event_preparation",
      status: "error",
      error: errorMsg,
    });
    console.error(`[test-emails][${requestId}] Event preparation error:`, errorMsg);
  }

  // Summary
  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status !== "sent").length;

  console.log(`[test-emails][${requestId}] Done: sent=${sent}, failed=${failed}`);

  return Response.json({
    ok: true,
    requestId,
    recipient: TEST_EMAIL,
    sent,
    failed,
    results,
    message: `Event preparation test email sent to ${TEST_EMAIL}. Check inbox and promotions tab.`,
  });
}
