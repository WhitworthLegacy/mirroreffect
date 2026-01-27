"use client";

import { useMemo } from "react";
import { useSheetsStore } from "@/lib/sheetsStore";
import StudentsView from "@/components/StudentsView";

export default function StudentsPageClient() {
  // Use events from Clients sheet (contains Etudiant, Heures Etudiant, etc.)
  const { events, isLoading, error } = useSheetsStore();

  // Map events to student format - filter only events with student data
  const studentEvents = useMemo(() => {
    console.log("[Students] Total events:", events.length);
    console.log("[Students] Events with student_name:", events.filter(e => e.student_name).length);
    if (events.length > 0) {
      console.log("[Students] First event sample:", {
        id: events[0].id,
        student_name: events[0].student_name,
      });
    }

    return events
      .filter((event) => event.student_name && event.event_date)
      .map((event) => ({
        event_id: event.id,
        event_date: event.event_date!,
        client_name: event.client_name,
        student_name: event.student_name!,
        student_hours: null, // Removed from DB, now managed in Google Sheets
        student_total_cents: null, // Removed from DB, now managed in Google Sheets
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
      {isLoading && !studentEvents.length && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <p className="admin-muted">Chargement des événements...</p>
        </div>
      )}
      <StudentsView studentEvents={studentEvents} />
    </>
  );
}
