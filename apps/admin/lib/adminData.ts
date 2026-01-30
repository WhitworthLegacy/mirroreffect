import { createSupabaseServerClient } from "./supabaseServer";

// Simplified EventRow - hard data only (calculations in Google Sheets)
export type EventRow = {
  id: string;
  event_date: string | null;
  event_type: string | null;
  language: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  status: string | null;
  total_cents: number | null;
  transport_fee_cents: number | null;
  deposit_cents: number | null;
  balance_due_cents: number | null;
  balance_status: string | null;
  pack_id: string | null;
  address: string | null;
  guest_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  commercial_name: string | null;
  // Closing date for sync
  closing_date: string | null;
};

export type LeadRow = {
  id: string;
  lead_id: string;
  created_at: string | null;
  updated_at: string | null;
  step: number | null;
  status: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  language: string | null;
  event_date: string | null;
  event_location: string | null;
  pack_id: string | null;
  guest_count: number | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  event_type: string | null;
  zone: string | null;
  vibe: string | null;
  theme: string | null;
  priority: string | null;
};

export type PaymentRow = {
  id: string;
  payment_id: string;
  event_id: string;
  created_at: string | null;
  updated_at: string | null;
  provider: string | null;
  provider_payment_id: string | null;
  amount_cents: number | null;
  status: string | null;
  paid_at: string | null;
  description: string | null;
};

export type PackRow = {
  id: string;
  code?: string | null;
  name_fr?: string | null;
  name_nl?: string | null;
  price_current_cents?: number | null;
};

export type AdminSnapshot = {
  events: EventRow[];
  packs: PackRow[];
  error: string | null;
};

// Mapping Supabase row -> EventRow
function mapSupabaseEventToEventRow(row: Record<string, unknown>): EventRow {
  const toInt = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : Math.round(num);
  };

  return {
    id: String(row.event_id || row.id || ""),
    event_date: row.event_date ? String(row.event_date) : null,
    event_type: row.event_type ? String(row.event_type) : null,
    language: row.language ? String(row.language).toLowerCase() : null,
    client_name: row.client_name ? String(row.client_name) : null,
    client_email: row.client_email ? String(row.client_email) : null,
    client_phone: row.client_phone ? String(row.client_phone) : null,
    status: row.status ? String(row.status) : "active",
    total_cents: toInt(row.total_cents),
    transport_fee_cents: toInt(row.transport_fee_cents),
    deposit_cents: toInt(row.deposit_cents),
    balance_due_cents: toInt(row.balance_due_cents),
    balance_status: row.balance_status ? String(row.balance_status) : null,
    pack_id: row.pack_id ? String(row.pack_id) : null,
    address: row.address ? String(row.address) : null,
    guest_count: toInt(row.guest_count),
    created_at: row.created_at ? String(row.created_at) : null,
    updated_at: row.updated_at ? String(row.updated_at) : null,
    commercial_name: row.commercial_name ? String(row.commercial_name) : null,
    closing_date: row.closing_date ? String(row.closing_date) : null,
  };
}

export async function getLeads(): Promise<{ leads: LeadRow[]; error: string | null }> {
  const supabase = createSupabaseServerClient();
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { leads: [], error: error.message };
    return { leads: (data ?? []) as unknown as LeadRow[], error: null };
  } catch (err) {
    return { leads: [], error: err instanceof Error ? err.message : "Erreur chargement leads" };
  }
}

export async function getPayments(): Promise<{ payments: PaymentRow[]; error: string | null }> {
  const supabase = createSupabaseServerClient();
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { payments: [], error: error.message };
    return { payments: (data ?? []) as unknown as PaymentRow[], error: null };
  } catch (err) {
    return { payments: [], error: err instanceof Error ? err.message : "Erreur chargement payments" };
  }
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
      .select("id, code, name_fr, name_nl, price_current_cents");

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
