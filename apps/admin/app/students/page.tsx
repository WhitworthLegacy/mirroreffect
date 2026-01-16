import { createSupabaseServerClient } from "@/lib/supabaseServer";
import StudentsView from "@/components/StudentsView";
import type { EventRow } from "@/lib/adminData";

export default async function StudentsPage() {
  let error: string | null = null;
  let events: EventRow[] = [];

  try {
    const supabase = createSupabaseServerClient();
    const { data, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false })
      .limit(500);

    if (fetchError) {
      error = fetchError.message;
    } else {
      events = (data || []) as EventRow[];
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les données.";
  }

  // Extract student data from events (student fields now directly in events)
  const studentEvents = events
    .filter(event => event.student_name)
    .map(event => ({
      event_id: event.id,
      event_date: event.event_date,
      client_name: event.client_name,
      student_name: event.student_name!,
      student_hours: event.student_hours,
      student_rate_cents: event.student_rate_cents,
      total_cents: event.total_cents,
    }));

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
