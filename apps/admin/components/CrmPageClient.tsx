"use client";

import { useClientsStore } from "@/lib/clientsStore";
import CrmList from "@/components/CrmList";
import type { PackRow } from "@/lib/adminData";

type Props = {
  packs: PackRow[];
};

export default function CrmPageClient({ packs }: Props) {
  const { rows: events, loading, error } = useClientsStore();

  return (
    <>
      {error && <p className="admin-muted">Erreur events: {error}</p>}
      {loading && !events.length && (
        <p className="admin-muted">Chargement des événements...</p>
      )}
      <CrmList events={events} packs={packs} />
    </>
  );
}
