import { createSupabaseServerClient } from "./supabaseServer";

export type EventRow = {
  id: string;
  event_date: string;
  event_type: string | null;
  language: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  zone_id: string | null;
  status: string | null;
  total_cents: number | null;
  transport_fee_cents: number | null;
  deposit_cents: number | null;
  balance_due_cents: number | null;
  balance_status: string | null;
  pack_id: string | null;
  address: string | null;
  on_site_contact: string | null;
  created_at: string | null;
  updated_at: string | null;
  event_finance?: EventFinanceRow[] | EventFinanceRow | null;
};

export type PackRow = {
  id: string;
  code?: string | null;
  name_fr?: string | null;
  name_nl?: string | null;
  price_current_cents?: number | null;
  price_original_cents?: number | null;
  impressions_included?: number | null;
};

export type EventFinanceRow = {
  event_id?: string | null;
  student_name?: string | null;
  student_hours?: number | null;
  student_rate_cents?: number | null;
  km_one_way?: number | null;
  km_total?: number | null;
  fuel_cost_cents?: number | null;
  commercial_name?: string | null;
  commercial_commission_cents?: number | null;
  gross_margin_cents?: number | null;
  invoice_deposit_paid?: boolean | null;
  invoice_balance_paid?: boolean | null;
  [key: string]: unknown;
};

export type AdminSnapshot = {
  events: EventRow[];
  packs: PackRow[];
  error: string | null;
};

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  const supabase = createSupabaseServerClient();
  const { data: eventsData, error: eventsError } = await supabase
    .from("events")
    .select(
      [
        "id",
        "event_date",
        "event_type",
        "language",
        "client_name",
        "client_email",
        "client_phone",
        "zone_id",
        "status",
        "total_cents",
        "transport_fee_cents",
        "deposit_cents",
        "balance_due_cents",
        "balance_status",
        "pack_id",
        "address",
        "on_site_contact",
        "created_at",
        "updated_at",
        "event_finance(*)"
      ].join(", ")
    )
    .order("event_date", { ascending: true })
    .limit(200);

  const { data: packsData, error: packsError } = await supabase
    .from("packs")
    .select("id, code, name_fr, name_nl, price_current_cents, price_original_cents, impressions_included");

  const events = (eventsData ?? []) as unknown as EventRow[];
  const packs = (packsData ?? []) as unknown as PackRow[];

  return {
    events,
    packs,
    error: eventsError?.message ?? packsError?.message ?? null
  };
}
