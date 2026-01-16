import { NextResponse } from "next/server";
import { writeEventToSheets, readEventsFromSheets, deleteRowFromSheet } from "@/lib/googleSheets";

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

export async function GET() {
  try {
    const events = await readEventsFromSheets();
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

    // Generate ID if not provided
    const id = (eventPayload.id as string) || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create event object for Google Sheets
    const event = {
      id,
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
      status: (eventPayload.status as string) || null,
      student_name: (eventPayload.student_name as string) || null,
      student_hours: (eventPayload.student_hours as number) || null,
      student_rate_cents: (eventPayload.student_rate_cents as number) || null,
      km_one_way: (eventPayload.km_one_way as number) || null,
      km_total: (eventPayload.km_total as number) || null,
      fuel_cost_cents: (eventPayload.fuel_cost_cents as number) || null,
      commercial_name: (eventPayload.commercial_name as string) || null,
      commercial_commission_cents: (eventPayload.commercial_commission_cents as number) || null,
      gross_margin_cents: (eventPayload.gross_margin_cents as number) || null,
      deposit_invoice_ref: (eventPayload.deposit_invoice_ref as string) || null,
      balance_invoice_ref: (eventPayload.balance_invoice_ref as string) || null,
      invoice_deposit_paid: (eventPayload.invoice_deposit_paid as boolean) || null,
      invoice_balance_paid: (eventPayload.invoice_balance_paid as boolean) || null,
      closing_date: (eventPayload.closing_date as string) || null,
    };

    // Write to Google Sheets (primary source)
    await writeEventToSheets(event);

    return NextResponse.json({ item: event });
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

    // Read current events from Google Sheets
    const currentEvents = await readEventsFromSheets();
    const eventsMap = new Map(currentEvents.map(e => [e.id, e]));

    for (const update of updates) {
      const { id, event, finance } = update;
      if (!id) continue;

      // Get current event or create new one
      const currentEvent = eventsMap.get(id) || {
        id,
        event_date: null,
        event_type: null,
        language: null,
        client_name: null,
        client_email: null,
        client_phone: null,
        zone_id: null,
        status: null,
        total_cents: null,
        transport_fee_cents: null,
        deposit_cents: null,
        balance_due_cents: null,
        balance_status: null,
        pack_id: null,
        address: null,
        on_site_contact: null,
        guest_count: null,
        created_at: null,
        updated_at: null,
        student_name: null,
        student_hours: null,
        student_rate_cents: null,
        km_one_way: null,
        km_total: null,
        fuel_cost_cents: null,
        commercial_name: null,
        commercial_commission_cents: null,
        gross_margin_cents: null,
        deposit_invoice_ref: null,
        balance_invoice_ref: null,
        invoice_deposit_paid: null,
        invoice_balance_paid: null,
        closing_date: null,
      };

      // Merge updates
      const merged = { ...(event || {}), ...(finance || {}) };
      const payload = sanitizePayload(merged);
      
      const updatedEvent = {
        ...currentEvent,
        ...payload,
        id, // Ensure ID is preserved
      };

      // Write to Google Sheets
      await writeEventToSheets(updatedEvent);
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

    // Delete the row from Google Sheets (feuille "Clients")
    try {
      await deleteRowFromSheet("Clients", body.id);
    } catch (error) {
      // If row not found, that's okay - it might already be deleted
      if (error instanceof Error && !error.message.includes("not found")) {
        throw error;
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
