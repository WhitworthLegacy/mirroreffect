"use client";

import { useMemo } from "react";
import { useSheetsStore } from "@/lib/sheetsStore";
import StudentsView from "@/components/StudentsView";

export default function StudentsPageClient() {
  const { events, isLoading, error } = useSheetsStore();

  // Extract student data from events (student fields now directly in events)
  const studentEvents = useMemo(() => {
    return events
      .filter(event => event.student_name && event.event_date) // Filter out events without date or student
      .map(event => ({
        event_id: event.id,
        event_date: event.event_date!,
        client_name: event.client_name,
        student_name: event.student_name!,
        student_hours: event.student_hours,
        student_rate_cents: event.student_rate_cents,
        total_cents: event.total_cents,
      }));
  }, [events]);

  return (
    <>
      {error && (
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
      <StudentsView studentEvents={studentEvents} />
    </>
  );
}
