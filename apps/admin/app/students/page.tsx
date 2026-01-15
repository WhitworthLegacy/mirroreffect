import { createSupabaseServerClient } from "@/lib/supabaseServer";
import StudentsView from "@/components/StudentsView";
import type { EventRow, EventFinanceRow } from "@/lib/adminData";

export default async function StudentsPage() {
  let error: string | null = null;
  let events: (EventRow & { event_finance: EventFinanceRow | EventFinanceRow[] | null })[] = [];

  try {
    const supabase = createSupabaseServerClient();
    const { data, error: fetchError } = await supabase
      .from("events")
      .select(`
        id,
        event_date,
        event_type,
        client_name,
        address,
        pack_id,
        total_cents,
        event_finance(*)
      `)
      .order("event_date", { ascending: false })
      .limit(500);

    if (fetchError) {
      error = fetchError.message;
    } else {
      events = (data || []) as typeof events;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les données.";
  }

  // Extract student data from events
  const studentEvents: {
    event_id: string;
    event_date: string;
    client_name: string | null;
    student_name: string;
    student_hours: number | null;
    student_rate_cents: number | null;
    total_cents: number | null;
  }[] = [];

  for (const event of events) {
    const finance = Array.isArray(event.event_finance)
      ? event.event_finance[0]
      : event.event_finance;

    if (finance?.student_name) {
      studentEvents.push({
        event_id: event.id,
        event_date: event.event_date,
        client_name: event.client_name,
        student_name: finance.student_name,
        student_hours: finance.student_hours ?? null,
        student_rate_cents: finance.student_rate_cents ?? null,
        total_cents: event.total_cents,
      });
    }
  }

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Étudiants</h1>
        <p className="admin-muted">
          Performance et rémunération des étudiants par événement.
        </p>
      </header>

      {error && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{error}</p>
        </div>
      )}

      <StudentsView studentEvents={studentEvents} />
    </main>
  );
}
