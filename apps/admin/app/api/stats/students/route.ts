import { NextResponse } from "next/server";
import { writeStudentStatsToSheets, readStudentStatsFromSheets } from "@/lib/googleSheets";

export async function GET() {
  try {
    const stats = await readStudentStatsFromSheets();
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
    const { month, student_name, ...rest } = body;

    if (!month || !student_name) {
      return NextResponse.json({ error: "month and student_name are required" }, { status: 400 });
    }

    await writeStudentStatsToSheets({ month, student_name, ...rest });
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
    const { month, student_name, ...rest } = body;

    if (!month || !student_name) {
      return NextResponse.json({ error: "month and student_name are required" }, { status: 400 });
    }

    await writeStudentStatsToSheets({ month, student_name, ...rest });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
