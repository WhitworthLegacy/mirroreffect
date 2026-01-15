"use client";

import { useMemo, useState } from "react";
import type { EventRow, PackRow } from "@/lib/adminData";
import { formatDate } from "@/lib/format";
import EventModal from "@/components/EventModal";

type Props = {
  events: EventRow[];
  packs: PackRow[];
};

export default function EventsList({ events, packs }: Props) {
  const [rows, setRows] = useState<EventRow[]>(() => events);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [search, setSearch] = useState("");

  const packMap = useMemo(() => {
    const map = new Map<string, string>();
    packs.forEach((pack) => {
      if (!pack.id) return;
      map.set(pack.id, pack.name_fr || pack.code || "Pack");
    });
    return map;
  }, [packs]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((event) =>
      (event.client_name?.toLowerCase().includes(q)) ||
      (event.address?.toLowerCase().includes(q)) ||
      (event.event_date?.includes(q))
    );
  }, [rows, search]);

  const selectedEvent = isNewEvent
    ? { id: "new", event_date: "", client_name: "", client_email: "", client_phone: "" } as EventRow
    : rows.find((row) => row.id === selectedId) ?? null;

  const handleSaved = (updated: EventRow) => {
    if (isNewEvent) {
      setRows((prev) => [updated, ...prev]);
      setIsNewEvent(false);
    } else {
      setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    setIsNewEvent(false);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Rechercher (nom, adresse, date)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #ddd',
            fontSize: '0.875rem',
          }}
        />
        <button
          type="button"
          className="admin-chip primary"
          onClick={() => setIsNewEvent(true)}
          style={{ padding: '8px 16px' }}
        >
          + Ajouter
        </button>
      </div>

      <div className="admin-list">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date événement</th>
              <th>Nom client</th>
              <th>Pack choisi</th>
              <th>Adresse</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((event) => (
              <tr key={event.id} onClick={() => setSelectedId(event.id)} className="admin-row">
                <td>{event.event_date ? formatDate(event.event_date) : "—"}</td>
                <td>{event.client_name || "—"}</td>
                <td>{event.pack_id ? packMap.get(event.pack_id) || "Pack" : "—"}</td>
                <td>{event.address || "—"}</td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-muted">
                  {search ? "Aucun résultat." : "Aucun événement pour le moment."}
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
          onClose={handleClose}
          onSaved={handleSaved}
          isNew={isNewEvent}
        />
      )}
    </>
  );
}
