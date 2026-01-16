import StudentsView from "@/components/StudentsView";
import type { EventRow } from "@/lib/adminData";
import { readEventsFromSheets } from "@/lib/googleSheets";

export default async function StudentsPage() {
  let error: string | null = null;
  let events: EventRow[] = [];

  try {
    // Read from Google Sheets (primary source)
    events = await readEventsFromSheets();
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les données.";
  }

  // Extract student data from events (student fields now directly in events)
  const studentEvents = events
    .filter(event => event.student_name && event.event_date) // Filter out events without date or student
    .map(event => ({
      event_id: event.id,
      event_date: event.event_date!,
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
