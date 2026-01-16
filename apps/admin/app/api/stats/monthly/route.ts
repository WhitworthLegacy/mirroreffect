import { NextResponse } from "next/server";
import { writeMonthlyStatsToSheets, readMonthlyStatsFromSheets } from "@/lib/googleSheets";

export async function GET() {
  try {
    const stats = await readMonthlyStatsFromSheets();
    return NextResponse.json({ items: stats });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, ...rest } = body;

    if (!month) {
      return NextResponse.json({ error: "month is required" }, { status: 400 });
    }

    await writeMonthlyStatsToSheets({ month, ...rest });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { month, ...rest } = body;

    if (!month) {
      return NextResponse.json({ error: "month is required" }, { status: 400 });
    }

    await writeMonthlyStatsToSheets({ month, ...rest });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
