"use client";

import { useEffect } from "react";
import { useClientsStore } from "@/lib/clientsStore";
import EventsList from "@/components/EventsList";
import type { PackRow } from "@/lib/adminData";

type Props = {
  packs: PackRow[];
};

export default function EventsPageClient({ packs }: Props) {
  const { rows: events, loading, error, loadClients, loaded } = useClientsStore();

  // Charger les clients une seule fois au mount
  useEffect(() => {
    if (!loaded && !loading) {
      loadClients();
    }
  }, [loaded, loading, loadClients]);

  return (
    <>
      {error && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{error}</p>
        </div>
      )}
      {loading && !loaded && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <p className="admin-muted">Chargement des événements...</p>
        </div>
      )}
      <EventsList events={events} packs={packs} />
    </>
  );
}
