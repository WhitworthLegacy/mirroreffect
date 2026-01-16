import { NextResponse } from "next/server";
import { gasPostAdmin } from "@/lib/gas";
import { readSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await readSheet("Clients");

    return NextResponse.json({
      ok: true,
      message: "GAS connection working",
      test: "readSheet",
      sheetName: "Clients",
      rowCount: Math.max(0, rows.length - 1),
      sampleHeaders: (rows[0] as unknown[] | undefined)?.slice(0, 5) || [],
      env: {
        hasGAS_URL: !!process.env.GAS_WEBAPP_URL,
        hasGAS_KEY: !!process.env.GAS_KEY,
        hasSPREADSHEET_ID: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        gasUrlPreview: process.env.GAS_WEBAPP_URL
          ? process.env.GAS_WEBAPP_URL.substring(0, 50) + "..."
          : "not set",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        test: "readSheet",
        sheetName: "Clients",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let action: unknown = undefined;

  try {
    const body = await request.json();
    action = body?.action;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { ok: false, error: "action required (string)" },
        { status: 400 }
      );
    }

    const result = await gasPostAdmin(action, body?.data);

    return NextResponse.json({
      ok: true,
      action,
      data: result,
      message: "GAS action executed successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        action: typeof action === "string" ? action : undefined,
      },
      { status: 500 }
    );
  }
}