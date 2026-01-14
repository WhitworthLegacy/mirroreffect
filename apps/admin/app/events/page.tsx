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
      <h1>Events</h1>
      <p className="admin-muted">Liste des events. Cliquez sur une ligne pour modifier.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}
      <EventsList events={events} packs={packs} />
    </main>
  );
}
