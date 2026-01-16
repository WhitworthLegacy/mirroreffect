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
      <header style={{ marginBottom: 24 }}>
        <h1>Events</h1>
        <p className="admin-muted">Liste des events. Cliquez sur une ligne pour modifier.</p>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>
          📊 Données lues depuis Google Sheets (feuille "Clients") - chargement unique côté client
        </p>
      </header>
      {packsError && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement packs</h2>
          <p className="admin-muted">{packsError}</p>
        </div>
      )}
      <EventsPageClient packs={packs} />
    </main>
  );
}
