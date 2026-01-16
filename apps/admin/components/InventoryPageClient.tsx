"use client";

import { useMemo } from "react";
import { useClientsStore } from "@/lib/clientsStore";
import type { PackRow } from "@/lib/adminData";

type Props = {
  packs: PackRow[];
};

export default function InventoryPageClient({ packs }: Props) {
  const { rows: events, loading, error } = useClientsStore();

  const packMap = useMemo(() => {
    return new Map(
      packs.map((pack) => [pack.id, pack.name_fr || pack.code || "Pack"])
    );
  }, [packs]);

  const packStats = useMemo(() => {
    return events.reduce<Record<string, number>>((acc, event) => {
      const key = event.pack_id ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [events]);

  return (
    <>
      {error && <p className="admin-muted">Erreur: {error}</p>}
      {loading && !events.length && (
        <p className="admin-muted">Chargement des événements...</p>
      )}

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
    </>
  );
}
