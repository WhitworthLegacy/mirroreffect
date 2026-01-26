import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// Finance fields that can be updated
const FINANCE_FIELDS = [
  "student_name",
  "student_hours",
  "student_rate_cents",
  "km_one_way",
  "km_total",
  "fuel_cost_cents",
  "commercial_name",
  "commercial_commission_cents",
  "deposit_invoice_ref",
  "balance_invoice_ref",
  "invoice_deposit_paid",
  "invoice_balance_paid",
  "closing_date",
];

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const eventId = body.event_id as string;
    if (!eventId) {
      return NextResponse.json({ error: "event_id required" }, { status: 400 });
    }

    // Filter only finance fields
    const updateData: Record<string, unknown> = {};
    for (const field of FINANCE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        const value = body[field];
        updateData[field] = value === "" ? null : value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Add updated_at
    updateData.updated_at = new Date().toISOString();

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("event_id", eventId)
      .select()
      .single();

    if (error) {
      console.error("[update-finance] Erreur Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("[update-finance] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
