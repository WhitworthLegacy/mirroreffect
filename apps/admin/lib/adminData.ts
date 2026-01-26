import { createSupabaseServerClient } from "./supabaseServer";

export type EventRow = {
  id: string;
  event_date: string | null;
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
  guest_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  // Finance fields (formerly in event_finance)
  student_name: string | null;
  student_hours: number | null;
  student_rate_cents: number | null;
  km_one_way: number | null;
  km_total: number | null;
  fuel_cost_cents: number | null;
  commercial_name: string | null;
  commercial_commission_cents: number | null;
  gross_margin_cents: number | null;
  // Invoice references for ZenFacture
  deposit_invoice_ref: string | null;
  balance_invoice_ref: string | null;
  invoice_deposit_paid: boolean | null;
  invoice_balance_paid: boolean | null;
  // Closing date for monthly calculations
  closing_date: string | null;
};

export type EventFinanceRow = {
  student_name: string | null;
  student_hours: number | null;
  student_rate_cents: number | null;
  km_one_way: number | null;
  km_total: number | null;
  fuel_cost_cents: number | null;
  commercial_name: string | null;
  commercial_commission_cents: number | null;
  gross_margin_cents: number | null;
  invoice_deposit_paid: boolean | null;
  invoice_balance_paid: boolean | null;
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

export type AdminSnapshot = {
  events: EventRow[];
  packs: PackRow[];
  error: string | null;
};

// Mapping Supabase row -> EventRow (identique à sheetsStore.ts)
function mapSupabaseEventToEventRow(row: Record<string, unknown>): EventRow {
  const toInt = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : Math.round(num);
  };

  const toNum = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  return {
    id: String(row.event_id || row.id || ""),
    event_date: row.event_date ? String(row.event_date) : null,
    event_type: row.event_type ? String(row.event_type) : null,
    language: row.language ? String(row.language).toLowerCase() : null,
    client_name: row.client_name ? String(row.client_name) : null,
    client_email: row.client_email ? String(row.client_email) : null,
    client_phone: row.client_phone ? String(row.client_phone) : null,
    zone_id: row.zone_id ? String(row.zone_id) : null,
    status: row.status ? String(row.status) : "active",
    total_cents: toInt(row.total_cents),
    transport_fee_cents: toInt(row.transport_fee_cents),
    deposit_cents: toInt(row.deposit_cents),
    balance_due_cents: toInt(row.balance_due_cents),
    balance_status: row.balance_status ? String(row.balance_status) : null,
    pack_id: row.pack_id ? String(row.pack_id) : null,
    address: row.address ? String(row.address) : null,
    on_site_contact: row.on_site_contact ? String(row.on_site_contact) : null,
    guest_count: toInt(row.guest_count),
    created_at: row.created_at ? String(row.created_at) : null,
    updated_at: row.updated_at ? String(row.updated_at) : null,
    student_name: row.student_name ? String(row.student_name) : null,
    student_hours: toNum(row.student_hours),
    student_rate_cents: toInt(row.student_rate_cents),
    km_one_way: toNum(row.km_one_way),
    km_total: toNum(row.km_total),
    fuel_cost_cents: toInt(row.fuel_cost_cents),
    commercial_name: row.commercial_name ? String(row.commercial_name) : null,
    commercial_commission_cents: toInt(row.commercial_commission_cents),
    gross_margin_cents: null, // Calculé dans les views, pas stocké
    deposit_invoice_ref: row.deposit_invoice_ref ? String(row.deposit_invoice_ref) : null,
    balance_invoice_ref: row.balance_invoice_ref ? String(row.balance_invoice_ref) : null,
    invoice_deposit_paid: row.invoice_deposit_paid === true,
    invoice_balance_paid: row.invoice_balance_paid === true,
    closing_date: row.closing_date ? String(row.closing_date) : null,
  };
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  const supabase = createSupabaseServerClient();
  let events: EventRow[] = [];
  let eventsError: string | null = null;

  // Charger les events depuis Supabase
  try {
    console.log("[getAdminSnapshot] Chargement des events depuis Supabase");
    const { data: eventsData, error: supabaseError } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (supabaseError) {
      eventsError = supabaseError.message;
      console.error("[getAdminSnapshot] Erreur Supabase events:", supabaseError);
    } else if (eventsData) {
      events = (eventsData as Record<string, unknown>[]).map(mapSupabaseEventToEventRow);
      console.log(`[getAdminSnapshot] ${events.length} events chargés depuis Supabase`);
    }
  } catch (error) {
    eventsError = error instanceof Error ? error.message : "Erreur chargement events Supabase";
    console.error("[getAdminSnapshot] Erreur:", error);
  }

  // Packs depuis Supabase
  let packs: PackRow[] = [];
  let packsError: string | null = null;
  try {
    const { data: packsData, error: supabaseError } = await supabase
      .from("packs")
      .select("id, code, name_fr, name_nl, price_current_cents, price_original_cents, impressions_included");

    if (supabaseError) {
      packsError = supabaseError.message;
    } else {
      packs = (packsData ?? []) as unknown as PackRow[];
    }
  } catch (error) {
    packsError = error instanceof Error ? error.message : "Erreur chargement packs Supabase";
    console.error("[getAdminSnapshot] Erreur packs:", error);
  }

  return {
    events,
    packs,
    error: eventsError ?? packsError ?? null
  };
}
