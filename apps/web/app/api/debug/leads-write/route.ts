/**
 * Endpoint debug temporaire pour tester l'écriture dans Leads
 * À supprimer une fois le problème résolu
 */

import { gasPost } from "@/lib/gas";
import { toDDMMYYYY, toDDMMYYYYHHmm } from "@/lib/date";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Debug endpoint disabled in production" }, { status: 403 });
  }

  const requestId = crypto.randomUUID();
  const hasGAS_URL = !!process.env.GAS_WEBAPP_URL;
  const hasGAS_KEY = !!process.env.GAS_KEY;

  // Payload hardcodé safe pour test
  const testPayload = {
    "Lead ID": `TEST-${Date.now()}`,
    "Created At": toDDMMYYYYHHmm(new Date()) || new Date().toISOString(),
    Step: "5",
    Status: "step_5_completed",
    Nom: "Test User",
    Email: "test@example.com",
    Phone: "+32123456789",
    Language: "fr",
    "Date Event": toDDMMYYYY("2026-06-15") || "15/06/2026",
    "Lieu Event": "Test Location",
    Pack: "DISCOVERY",
    "Invités": "100",
    "Transport (€)": "90,00",
    Total: "480,00",
    Acompte: "180,00",
    "UTM Source": "test",
    "UTM Campaign": "debug",
    "UTM Medium": "api"
  };

  try {
    const result = await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Leads",
        values: testPayload
      }
    });

    return Response.json({
      ok: true,
      requestId,
      message: "Test write successful",
      env: {
        hasGAS_URL,
        hasGAS_KEY
      },
      payload: testPayload,
      gasResponse: result
    });
  } catch (error) {
    const gasError = error as Error & { type?: string; status?: number; preview?: string; url?: string; message?: string };
    const errorType = gasError.type || "UNKNOWN_ERROR";
    const errorStatus = gasError.status || 500;
    const errorPreview = gasError.preview || String(error).substring(0, 300);
    const errorLocation = gasError.url || "unknown";
    const errorMessage = gasError.message || String(error);

    console.error(`[debug/leads-write] Error (${requestId}):`, {
      type: errorType,
      status: errorStatus,
      message: errorMessage,
      preview: errorPreview,
      location: errorLocation,
      hasGAS_URL,
      hasGAS_KEY
    });

    return Response.json(
      {
        ok: false,
        requestId,
        error: {
          type: errorType,
          message: errorMessage,
          status: errorStatus,
          location: errorLocation,
          preview: errorPreview
        },
        env: {
          hasGAS_URL,
          hasGAS_KEY
        },
        payload: testPayload
      },
      { status: errorStatus >= 400 && errorStatus < 600 ? errorStatus : 500 }
    );
  }
}
