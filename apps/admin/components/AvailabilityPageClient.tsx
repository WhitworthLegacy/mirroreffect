"use client";

import { useClientsStore } from "@/lib/clientsStore";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

export default function AvailabilityPageClient() {
  const { rows: events, loading, error } = useClientsStore();

  return (
    <>
      {error && <p className="admin-muted">Erreur: {error}</p>}
      {loading && !events.length && (
        <p className="admin-muted">Chargement des événements...</p>
      )}
      <AvailabilityCalendar events={events} />
    </>
  );
}
