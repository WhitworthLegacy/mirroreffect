import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// Hard data fields only - calculations are done in Google Sheets
const EVENT_FIELDS = [
  // Core event fields
  "event_date",
  "event_type",
  "language",
  "client_name",
  "client_email",
  "client_phone",
  "address",
  "pack_id",
  "guest_count",
  // Pricing fields
  "transport_fee_cents",
  "total_cents",
  "deposit_cents",
  "balance_due_cents",
  "balance_status",
  "status",
  // Assignations (reference only)
  "student_name",
  "commercial_name",
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

// Générer un event_id unique
function generateEventId(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("[events GET] Erreur Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
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

    // Generate event_id if not provided
    const eventId = (payload.event_id as string) || generateEventId();

    // Create event object for Supabase - hard data only
    const event = {
      event_id: eventId,
      event_date: (eventPayload.event_date as string) || null,
      event_type: (eventPayload.event_type as string) || null,
      language: (eventPayload.language as string) || null,
      client_name: (eventPayload.client_name as string) || null,
      client_email: (eventPayload.client_email as string) || null,
      client_phone: (eventPayload.client_phone as string) || null,
      address: (eventPayload.address as string) || null,
      pack_id: (eventPayload.pack_id as string) || null,
      total_cents: (eventPayload.total_cents as number) || null,
      transport_fee_cents: (eventPayload.transport_fee_cents as number) || null,
      deposit_cents: (eventPayload.deposit_cents as number) || null,
      balance_due_cents: (eventPayload.balance_due_cents as number) || null,
      balance_status: (eventPayload.balance_status as string) || null,
      status: (eventPayload.status as string) || "active",
      guest_count: (eventPayload.guest_count as number) || null,
      student_name: (eventPayload.student_name as string) || null,
      commercial_name: (eventPayload.commercial_name as string) || null,
      closing_date: (eventPayload.closing_date as string) || null,
    };

    // Write to Supabase
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .insert(event)
      .select()
      .single();

    if (error) {
      console.error("[events POST] Erreur Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
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

      // Merge updates
      const merged = { ...(event || {}), ...(finance || {}) };
      const payload = sanitizePayload(merged);

      // Add updated_at
      const updateData = {
        ...payload,
        updated_at: new Date().toISOString(),
      };

      // Update in Supabase
      const { error } = await supabase
        .from("events")
        .update(updateData)
        .eq("event_id", id);

      if (error) {
        console.error(`[events PATCH] Erreur Supabase pour ${id}:`, error);
        // Continue with other updates
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
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("event_id", body.id);

    if (error) {
      console.error("[events DELETE] Erreur Supabase:", error);
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
