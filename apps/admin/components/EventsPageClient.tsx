"use client";

import { useSheetsStore } from "@/lib/sheetsStore";
import EventsList from "@/components/EventsList";
import type { PackRow } from "@/lib/adminData";

type Props = {
  packs: PackRow[];
};

export default function EventsPageClient({ packs }: Props) {
  const { events, isLoading, error, loaded } = useSheetsStore();

  return (
    <>
      {error && !loaded && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{error}</p>
        </div>
      )}
      {isLoading && !events.length && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <p className="admin-muted">Chargement des événements...</p>
        </div>
      )}
      <EventsList events={events} packs={packs} />
    </>
  );
}
