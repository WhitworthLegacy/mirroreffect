import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// Finance fields that can be updated (now directly in events table)
const FINANCE_FIELDS = [
  "student_hours",
  "student_rate_cents",
  "student_name",
  "fuel_cost_cents",
  "km_one_way",
  "km_total",
  "commercial_name",
  "commercial_commission_cents",
  "deposit_invoice_ref",
  "balance_invoice_ref",
  "invoice_deposit_paid",
  "invoice_balance_paid",
  "closing_date"
];

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
    for (const field of FINANCE_FIELDS) {
      if (field in body) {
        payload[field] = body[field];
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Update events table directly (finance fields now in same table)
    const { error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", eventId);

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
