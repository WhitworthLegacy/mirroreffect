import { getAdminSnapshot } from "@/lib/adminData";

export default async function InventoryPage() {
  const { events, packs, error } = await getAdminSnapshot();
  const packMap = new Map(
    packs.map((pack) => [pack.id, pack.name_fr || pack.code || "Pack"])
  );
  const packStats = events.reduce<Record<string, number>>((acc, event) => {
    const key = event.pack_id ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="admin-page">
      <h1>Inventaire</h1>
      <p className="admin-muted">Etat des packs, materiels et rotations.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}

      <div className="admin-card" style={{ marginTop: 20 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pack</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(packStats).map(([packId, count]) => (
              <tr key={packId}>
                <td>{packId === "unknown" ? "Non choisi" : packMap.get(packId) || "Pack"}</td>
                <td>{count}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={2} className="admin-muted">
                  Aucun historique disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
