"use client";

import { useSheetsStore } from "@/lib/sheetsStore";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

export default function AvailabilityPageClient() {
  const { events, isLoading, error, loaded } = useSheetsStore();

  if (error && !loaded) {
    return (
      <div className="admin-card">
        <h2>Erreur de chargement</h2>
        <p className="admin-muted">{error}</p>
        <button
          type="button"
          className="admin-chip"
          onClick={() => window.location.reload()}
          style={{ marginTop: 12 }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (isLoading && !events.length) {
    return (
      <div className="admin-card">
        <p className="admin-muted">Chargement des événements...</p>
      </div>
    );
  }

  return (
    <>
      {error && loaded && (
        <div className="admin-card" style={{ marginBottom: 16, backgroundColor: 'var(--warning-bg, #fff3cd)' }}>
          <p style={{ color: 'var(--warning, #856404)' }}>⚠️ {error}</p>
        </div>
      )}
      <AvailabilityCalendar events={events} />
    </>
  );
}
