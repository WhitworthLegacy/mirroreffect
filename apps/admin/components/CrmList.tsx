"use client";

import { useMemo, useState } from "react";
import type { EventRow, PackRow } from "@/lib/adminData";
import EventModal from "@/components/EventModal";

type Props = {
  events: EventRow[];
  packs: PackRow[];
};

export default function CrmList({ events, packs }: Props) {
  const [rows, setRows] = useState<EventRow[]>(() => events);
  const leads = useMemo(() => rows.filter((event) => !event.pack_id), [rows]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEvent = leads.find((row) => row.id === selectedId) ?? null;

  const handleSaved = (updated: EventRow) => {
    setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  };

  return (
    <>
      <div className="admin-list">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Email</th>
              <th>Tel.</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((event) => (
              <tr key={event.id} onClick={() => setSelectedId(event.id)} className="admin-row">
                <td>{event.client_name || "—"}</td>
                <td>{event.client_email || "—"}</td>
                <td>{event.client_phone || "—"}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-muted">
                  Aucun lead a relancer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          packs={packs}
          onClose={() => setSelectedId(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
