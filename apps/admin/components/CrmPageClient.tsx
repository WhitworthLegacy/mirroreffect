"use client";

import { useSheetsStore } from "@/lib/sheetsStore";
import CrmList from "@/components/CrmList";
import type { PackRow } from "@/lib/adminData";

type Props = {
  packs: PackRow[];
};

export default function CrmPageClient({ packs }: Props) {
  const { events, isLoading, error } = useSheetsStore();

  return (
    <>
      {error && <p className="admin-muted">Erreur events: {error}</p>}
      {isLoading && !events.length && (
        <p className="admin-muted">Chargement des événements...</p>
      )}
      <CrmList events={events} packs={packs} />
    </>
  );
}
