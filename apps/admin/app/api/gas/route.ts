import { NextResponse } from "next/server";
import { gasPostAdmin, type GasError } from "@/lib/gas";

// Force dynamic rendering, no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Gateway unique pour tous les appels Google Apps Script
 * 
 * Input: { action: string, data?: object }
 * - Server injecte key: GAS_KEY automatiquement
 * - Retourne JSON avec erreurs structurées
 * 
 * Actions supportées:
 * - readSheet: { sheetName: "Clients" | "Stats" | "Students" | "Commercial" }
 * - appendRow: { sheetName, values: [...] }
 * - updateRow: { sheetName, id, values: [...] }
 * - updateRowByEventId: { eventId, values: { column: value } }
 * - updateRowByCompositeKey: { sheetName, key1, key1Value, key2, key2Value, values: {...} }
 * - deleteRow: { sheetName, id }
 */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Validation
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: {
            type: "VALIDATION_ERROR",
            message: "Invalid payload: must be an object",
            status: 400,
            contentType: "application/json",
          },
        },
        { status: 400 }
      );
    }

    const { action, data } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: {
            type: "VALIDATION_ERROR",
            message: "Missing or invalid 'action' field (must be string)",
            status: 400,
            contentType: "application/json",
          },
        },
        { status: 400 }
      );
    }

    // Appeler GAS via gasPostAdmin (injecte key automatiquement)
    try {
      const result = await gasPostAdmin(action, data, requestId);
      const duration = Date.now() - startTime;

      return NextResponse.json({
        ok: true,
        requestId,
        data: result,
        duration,
      });
    } catch (error) {
      // Si c'est un GasError, le formater proprement
      if (error && typeof error === "object" && "type" in error) {
        const gasError = error as GasError;
        return NextResponse.json(
          {
            ok: false,
            requestId,
            error: {
              type: gasError.type,
              message: gasError.message,
              status: gasError.status,
              contentType: gasError.contentType,
              location: gasError.location,
              preview: gasError.preview,
              url: gasError.url,
            },
            duration: Date.now() - startTime,
          },
          { status: gasError.status > 0 ? gasError.status : 500 }
        );
      }

      // Erreur inattendue
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: {
            type: "UNKNOWN_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
            status: 500,
            contentType: "application/json",
          },
          duration: Date.now() - startTime,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Erreur de parsing JSON ou autre
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: {
          type: "PARSE_ERROR",
          message: error instanceof Error ? error.message : "Failed to parse request body",
          status: 400,
          contentType: "application/json",
        },
        duration: Date.now() - startTime,
      },
      { status: 400 }
    );
  }
}

// Reject non-POST methods
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
