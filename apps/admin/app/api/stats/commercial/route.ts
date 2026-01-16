import { NextResponse } from "next/server";
import { writeCommercialStatsToSheets, readCommercialStatsFromSheets } from "@/lib/googleSheets";

export async function GET() {
  try {
    const stats = await readCommercialStatsFromSheets();
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
    const { month, commercial_name, ...rest } = body;

    if (!month || !commercial_name) {
      return NextResponse.json({ error: "month and commercial_name are required" }, { status: 400 });
    }

    await writeCommercialStatsToSheets({ month, commercial_name, ...rest });
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
    const { month, commercial_name, ...rest } = body;

    if (!month || !commercial_name) {
      return NextResponse.json({ error: "month and commercial_name are required" }, { status: 400 });
    }

    await writeCommercialStatsToSheets({ month, commercial_name, ...rest });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
