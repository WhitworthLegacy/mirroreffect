import EventsPageClient from "@/components/EventsPageClient";
import { getAdminSnapshot, type PackRow } from "@/lib/adminData";

export default async function EventsPage() {
  let packs: PackRow[] = [];
  let packsError: string | null = null;

  // Charger uniquement les packs depuis Supabase (events viennent du store client)
  try {
    const snapshot = await getAdminSnapshot();
    packs = snapshot.packs;
    packsError = snapshot.error;
  } catch (err) {
    packsError = err instanceof Error ? err.message : "Impossible de charger les données.";
  }

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 4 }}>Events</h1>
        <p className="admin-muted">Manage all events and bookings</p>
      </header>
      {packsError && (
        <div className="admin-card" style={{ marginBottom: 24, backgroundColor: 'rgba(205, 27, 23, 0.05)', borderColor: 'var(--fire-red)' }}>
          <p style={{ color: 'var(--fire-red)', margin: 0 }}>{packsError}</p>
        </div>
      )}
      <EventsPageClient packs={packs} />
    </main>
  );
}
