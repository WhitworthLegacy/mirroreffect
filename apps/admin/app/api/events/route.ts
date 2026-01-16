import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// All event fields including finance (now in same table)
const EVENT_FIELDS = [
  // Core event fields
  "event_date",
  "event_type",
  "language",
  "client_name",
  "client_email",
  "client_phone",
  "zone_id",
  "address",
  "on_site_contact",
  "pack_id",
  "guest_count",
  // Pricing fields
  "transport_fee_cents",
  "total_cents",
  "deposit_cents",
  "balance_due_cents",
  "balance_status",
  "status",
  // Finance fields (formerly in event_finance)
  "student_name",
  "student_hours",
  "student_rate_cents",
  "km_one_way",
  "km_total",
  "fuel_cost_cents",
  "commercial_name",
  "commercial_commission_cents",
  // Invoice references for ZenFacture
  "deposit_invoice_ref",
  "balance_invoice_ref",
  "invoice_deposit_paid",
  "invoice_balance_paid",
  // Closing date
  "closing_date"
];

function sanitizePayload(payload: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};
  EVENT_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      const value = payload[field];
      cleaned[field] = value === "" ? null : value;
    }
  });
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body) {
      return NextResponse.json({ error: "payload missing" }, { status: 400 });
    }

    // Support both old format (event + finance) and new flat format
    const payload = body.event
      ? { ...(body.event as Record<string, unknown>), ...(body.finance as Record<string, unknown> || {}) }
      : body;

    const eventPayload = sanitizePayload(payload);
    if (!eventPayload.event_date) {
      return NextResponse.json({ error: "event_date required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: created, error } = await supabase
      .from("events")
      .insert(eventPayload)
      .select("*")
      .single();

    if (error || !created) {
      return NextResponse.json({ error: error?.message ?? "create failed" }, { status: 500 });
    }

    return NextResponse.json({ item: created });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      updates?: Array<{
        id: string;
        event?: Record<string, unknown>;
        finance?: Record<string, unknown>;
      }>;
    };

    const updates = body?.updates ?? [];
    if (!updates.length) {
      return NextResponse.json({ error: "updates missing" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    for (const update of updates) {
      const { id, event, finance } = update;
      if (!id) continue;

      // Merge event and finance into single payload (all in events table now)
      const merged = { ...(event || {}), ...(finance || {}) };
      if (Object.keys(merged).length > 0) {
        const payload = sanitizePayload(merged);
        const { error } = await supabase.from("events").update(payload).eq("id", id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
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
    const body = (await request.json()) as { id: string };

    if (!body?.id) {
      return NextResponse.json({ error: "id missing" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Delete the event (all data now in single table)
    const { error } = await supabase.from("events").delete().eq("id", body.id);

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
