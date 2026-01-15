import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const eventId = body?.event_id as string | undefined;

    if (!eventId) {
      return NextResponse.json({ error: "event_id required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Build update payload - only include provided fields
    const payload: Record<string, unknown> = {};

    if ("student_hours" in body) {
      payload.student_hours = body.student_hours;
    }
    if ("student_rate_cents" in body) {
      payload.student_rate_cents = body.student_rate_cents;
    }
    if ("student_name" in body) {
      payload.student_name = body.student_name;
    }
    if ("fuel_cost_cents" in body) {
      payload.fuel_cost_cents = body.fuel_cost_cents;
    }
    if ("km_one_way" in body) {
      payload.km_one_way = body.km_one_way;
    }
    if ("km_total" in body) {
      payload.km_total = body.km_total;
    }
    if ("commercial_name" in body) {
      payload.commercial_name = body.commercial_name;
    }
    if ("commercial_commission_cents" in body) {
      payload.commercial_commission_cents = body.commercial_commission_cents;
    }
    if ("gross_margin_cents" in body) {
      payload.gross_margin_cents = body.gross_margin_cents;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Upsert to event_finance table
    const { error } = await supabase
      .from("event_finance")
      .upsert(
        { event_id: eventId, ...payload },
        { onConflict: "event_id" }
      );

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
