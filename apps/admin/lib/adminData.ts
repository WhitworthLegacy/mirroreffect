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

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  let events: EventRow[] = [];
  let eventsError: string | null = null;

  // Read events from Google Sheets (primary source)
  try {
    const { readEventsFromSheets } = await import("./googleSheets");
    events = await readEventsFromSheets();
  } catch (error) {
    eventsError = error instanceof Error ? error.message : "Failed to load events from Google Sheets";
    console.error("Error loading events from Google Sheets:", error);
    
    // Fallback to Supabase if Google Sheets fails
    try {
      const supabase = createSupabaseServerClient();
      const { data: eventsData, error: supabaseError } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true })
        .limit(500);
      
      if (supabaseError) {
        eventsError = eventsError + " | " + supabaseError.message;
      } else {
        events = (eventsData ?? []) as unknown as EventRow[];
      }
    } catch (fallbackError) {
      eventsError = eventsError + " | Fallback failed: " + (fallbackError instanceof Error ? fallbackError.message : "Unknown error");
    }
  }

  // Packs still come from Supabase (or could be moved to Google Sheets later)
  const supabase = createSupabaseServerClient();
  const { data: packsData, error: packsError } = await supabase
    .from("packs")
    .select("id, code, name_fr, name_nl, price_current_cents, price_original_cents, impressions_included");

  const packs = (packsData ?? []) as unknown as PackRow[];

  return {
    events,
    packs,
    error: eventsError ?? packsError?.message ?? null
  };
}
