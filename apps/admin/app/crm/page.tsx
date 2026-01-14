import CrmList from "@/components/CrmList";
import { getAdminSnapshot, type EventRow, type PackRow } from "@/lib/adminData";

export default async function CrmPage() {
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
      <h1>CRM</h1>
      <p className="admin-muted">Leads, relances et qualification commerciale.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}
      <CrmList events={events} packs={packs} />
    </main>
  );
}
