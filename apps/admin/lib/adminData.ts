import { createSupabaseServerClient } from "./supabaseServer";

export type EventRow = {
  id: string;
  event_date: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  status: string | null;
  total_cents: number | null;
  balance_due_cents: number | null;
  pack_id: string | null;
  address: string | null;
};

export type PackRow = {
  id: string;
  name?: string | null;
  code?: string | null;
};

export async function getAdminSnapshot() {
  const supabase = createSupabaseServerClient();
  const { data: eventsData, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, event_date, client_name, client_email, client_phone, status, total_cents, balance_due_cents, pack_id, address"
    )
    .order("event_date", { ascending: true })
    .limit(200);

  const { data: packsData, error: packsError } = await supabase
    .from("packs")
    .select("id, name, code");

  return {
    events: (eventsData ?? []) as EventRow[],
    packs: (packsData ?? []) as PackRow[],
    error: eventsError?.message ?? packsError?.message ?? null
  };
}
