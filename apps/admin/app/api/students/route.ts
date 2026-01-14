import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      month: string;
      student_name: string;
      data: Record<string, unknown>;
    };

    if (!body?.month || !body?.student_name) {
      return NextResponse.json({ error: "month and student_name required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const payload: Record<string, unknown> = {
      month: body.month,
      student_name: body.student_name,
      hours_raw: body.data.hours_raw ?? null,
      hours_adjusted: body.data.hours_adjusted ?? null,
      remuneration_cents: body.data.remuneration_cents ?? null,
    };

    const { error } = await supabase
      .from("student_monthly_stats")
      .upsert(payload, { onConflict: "month,student_name" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { month: string; student_name: string };

    if (!body?.month || !body?.student_name) {
      return NextResponse.json({ error: "month and student_name required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("student_monthly_stats")
      .delete()
      .eq("month", body.month)
      .eq("student_name", body.student_name);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
