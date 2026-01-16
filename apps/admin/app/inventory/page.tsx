import InventoryPageClient from "@/components/InventoryPageClient";
import { getAdminSnapshot, type PackRow } from "@/lib/adminData";

export default async function InventoryPage() {
  let packs: PackRow[] = [];
  let packsError: string | null = null;

  // Charger uniquement les packs depuis Supabase (events viennent du store client)
  try {
    const snapshot = await getAdminSnapshot();
    packs = snapshot.packs;
    packsError = snapshot.error;
  } catch (err) {
    packsError = err instanceof Error ? err.message : "Impossible de charger les packs.";
  }

  return (
    <main className="admin-page">
      <h1>Inventaire</h1>
      <p className="admin-muted">Etat des packs, materiels et rotations.</p>
      {packsError && <p className="admin-muted">Erreur packs: {packsError}</p>}
      <InventoryPageClient packs={packs} />
    </main>
  );
}
