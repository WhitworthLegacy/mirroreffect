import { NextRequest } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email/resend";
import { createSupabaseServerClient } from "@/lib/supabase";

/**
 * Unsubscribe endpoint (RGPD compliant)
 *
 * GET /api/unsubscribe?email=xxx&token=xxx
 *
 * Marks the lead as unsubscribed and returns a confirmation page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  // Validate params
  if (!email || !token) {
    return new Response(renderHtml("error", "fr", "Lien invalide"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Verify token
  if (!verifyUnsubscribeToken(email, token)) {
    return new Response(renderHtml("error", "fr", "Lien expiré ou invalide"), {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Mark as unsubscribed in Supabase
  const supabase = createSupabaseServerClient();

  try {
    // Update lead status if exists
    const { error: leadError } = await supabase
      .from("leads")
      .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
      .eq("email", email.toLowerCase());

    if (leadError) {
      console.error("[unsubscribe] Lead update error:", leadError);
    }

    // Cancel any pending notifications for this email
    const { error: notifError } = await supabase
      .from("notifications_log")
      .update({ status: "cancelled", error: "User unsubscribed" })
      .eq("to_email", email.toLowerCase())
      .eq("status", "queued");

    if (notifError) {
      console.error("[unsubscribe] Notification cancel error:", notifError);
    }

    console.log(`[unsubscribe] User unsubscribed: ${email}`);

    return new Response(renderHtml("success", "fr"), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[unsubscribe] Error:", err);
    return new Response(renderHtml("error", "fr", "Une erreur est survenue"), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

function renderHtml(type: "success" | "error", locale: string, errorMessage?: string): string {
  const isSuccess = type === "success";

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSuccess ? "Désabonnement confirmé" : "Erreur"} - Mirror Effect</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f8f8;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      max-width: 480px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: #12130F;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #C1950E;
      font-size: 24px;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 40px 32px;
      text-align: center;
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    .icon.success { background: #dcfce7; }
    .icon.error { background: #fee2e2; }
    h2 {
      color: #12130F;
      font-size: 20px;
      margin-bottom: 16px;
    }
    p {
      color: #717182;
      font-size: 15px;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 24px;
      background: #12130F;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }
    .btn:hover { background: #333; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>MIRROR EFFECT</h1>
    </div>
    <div class="content">
      ${isSuccess ? `
        <div class="icon success">✓</div>
        <h2>Désabonnement confirmé</h2>
        <p>Vous ne recevrez plus d'emails marketing de notre part.</p>
        <p style="margin-top: 12px;">Si vous avez changé d'avis, vous pouvez vous réabonner en nous contactant.</p>
      ` : `
        <div class="icon error">✕</div>
        <h2>Erreur</h2>
        <p>${errorMessage || "Une erreur est survenue."}</p>
      `}
      <a href="https://mirroreffect.co" class="btn">Retour au site</a>
    </div>
  </div>
</body>
</html>
`;
}
