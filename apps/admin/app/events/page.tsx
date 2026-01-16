import EventsList from "@/components/EventsList";
import { getAdminSnapshot, type EventRow, type PackRow } from "@/lib/adminData";

export default async function EventsPage() {
  let events: EventRow[] = [];
  let packs: PackRow[] = [];
  let error: string | null = null;

  try {
    const snapshot = await getAdminSnapshot();
    events = snapshot.events;
    packs = snapshot.packs;
    error = snapshot.error;
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les données.";
  }

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Events</h1>
        <p className="admin-muted">Liste des events. Cliquez sur une ligne pour modifier.</p>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>
          📊 Données lues depuis Google Sheets (feuille "Clients")
        </p>
      </header>
      {error && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{error}</p>
        </div>
      )}
      <EventsList events={events} packs={packs} />
    </main>
  );
}
