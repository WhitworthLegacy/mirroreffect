import EventsSheet from "@/components/EventsSheet";
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
    error = err instanceof Error ? err.message : "Impossible de charger les donnees.";
  }

  return (
    <main className="admin-page">
      <h1>Events</h1>
      <p className="admin-muted">Vue tableur avec edition rapide, filtres et calculs.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}
      <EventsSheet events={events} packs={packs} />
    </main>
  );
}
