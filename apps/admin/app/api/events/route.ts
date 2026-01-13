import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const EVENT_FIELDS = [
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
  "transport_fee_cents",
  "total_cents",
  "deposit_cents",
  "balance_due_cents",
  "balance_status",
  "status"
];

function sanitizeEventPayload(payload: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};
  EVENT_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      const value = payload[field];
      cleaned[field] = value === "" ? null : value;
    }
  });
  return cleaned;
}

function sanitizeFinancePayload(payload: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    cleaned[key] = value === "" ? null : value;
  });
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      event?: Record<string, unknown>;
      finance?: Record<string, unknown>;
    };

    if (!body?.event) {
      return NextResponse.json({ error: "event payload missing" }, { status: 400 });
    }

    const eventPayload = sanitizeEventPayload(body.event);
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

    if (body.finance) {
      const financePayload = sanitizeFinancePayload(body.finance);
      await supabase.from("event_finance").upsert(
        {
          event_id: created.id,
          ...financePayload
        },
        { onConflict: "event_id" }
      );
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

      if (event && Object.keys(event).length > 0) {
        const eventPayload = sanitizeEventPayload(event);
        const { error } = await supabase.from("events").update(eventPayload).eq("id", id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      if (finance && Object.keys(finance).length > 0) {
        const financePayload = sanitizeFinancePayload(finance);
        const { error } = await supabase.from("event_finance").upsert(
          {
            event_id: id,
            ...financePayload
          },
          { onConflict: "event_id" }
        );
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
