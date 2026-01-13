import EventsSheet from "@/components/EventsSheet";
import { getAdminSnapshot } from "@/lib/adminData";

export default async function EventsPage() {
  const { events, packs, error } = await getAdminSnapshot();

  return (
    <main className="admin-page">
      <h1>Events</h1>
      <p className="admin-muted">Vue tableur avec edition rapide, filtres et calculs.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}
      <EventsSheet events={events} packs={packs} />
    </main>
  );
}
