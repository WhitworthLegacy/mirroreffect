"use client";

import { useMemo, useState } from "react";
import type { EventRow, PackRow } from "@/lib/adminData";
import { formatDate, formatCurrency } from "@/lib/format";
import EventModal from "@/components/EventModal";
import { useSheetsStore } from "@/lib/sheetsStore";

type Props = {
  events: EventRow[];
  packs: PackRow[];
};

type SortConfig = {
  key: keyof EventRow;
  direction: "asc" | "desc";
} | null;

export default function EventsList({ events, packs }: Props) {
  const { events: storeEvents, refresh } = useSheetsStore();
  // Utiliser le store si disponible, sinon fallback sur props
  const rows = storeEvents.length > 0 ? storeEvents : events;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const packMap = useMemo(() => {
    const map = new Map<string, string>();
    packs.forEach((pack) => {
      if (!pack.id) return;
      map.set(pack.id, pack.name_fr || pack.code || "Pack");
    });
    return map;
  }, [packs]);

  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((event: EventRow) =>
        (event.client_name?.toLowerCase().includes(q)) ||
        (event.client_email?.toLowerCase().includes(q)) ||
        (event.address?.toLowerCase().includes(q)) ||
        (event.id?.toLowerCase().includes(q)) ||
        (event.event_date?.includes(q))
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [rows, search, sortConfig]);

  const handleSort = (key: keyof EventRow) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  const selectedEvent = isNewEvent
    ? { id: "new", event_date: "", client_name: "", client_email: "", client_phone: "" } as EventRow
    : rows.find((row: EventRow) => row.id === selectedId) ?? null;

  const handleSaved = async () => {
    if (isNewEvent) {
      setIsNewEvent(false);
      await refresh();
    } else {
      setIsNewEvent(false);
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    setIsNewEvent(false);
  };

  // Get pack badge style based on pack name/id
  const getPackBadgeStyle = (packId: string | null) => {
    const packName = packId ? (packMap.get(packId) || packId) : "";
    const lowerName = packName.toLowerCase();

    if (lowerName.includes("premium")) {
      return { background: "var(--satin-gold)", color: "white" };
    } else if (lowerName.includes("essentiel")) {
      return { background: "#4A4A4A", color: "white" };
    } else {
      return { background: "var(--silver)", color: "var(--night)" };
    }
  };

  // Get acompte status
  const getAcompteStatus = (event: EventRow) => {
    if (event.deposit_cents && event.deposit_cents > 0) {
      return { label: "Payé", isPaid: true };
    }
    return { label: "Attention", isPaid: false };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ color: "var(--night)", marginBottom: 4, fontSize: "1.5rem", fontWeight: 500 }}>Events</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--gray-muted)" }}>Manage all events and bookings</p>
      </div>

      {/* Search Bar */}
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: 16, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ position: "relative" }}>
          <svg
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 20, height: 20 }}
            viewBox="0 0 24 24" fill="none" stroke="var(--gray-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or event ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: 40,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              border: "1px solid var(--silver)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              outline: "none",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--satin-gold)";
              e.target.style.boxShadow = "0 0 0 2px rgba(193, 149, 14, 0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--silver)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--seasalt)", position: "sticky", top: 0 }}>
              <tr>
                <th
                  onClick={() => handleSort("event_date")}
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    fontSize: "0.875rem",
                    color: "var(--night)",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--gray-light)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  Date Event
                </th>
                <th
                  onClick={() => handleSort("client_name")}
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    fontSize: "0.875rem",
                    color: "var(--night)",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--gray-light)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  Nom
                </th>
                <th
                  onClick={() => handleSort("pack_id")}
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    fontSize: "0.875rem",
                    color: "var(--night)",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--gray-light)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  Pack
                </th>
                <th style={{ textAlign: "left", padding: "16px 24px", fontSize: "0.875rem", color: "var(--night)" }}>
                  Lieu
                </th>
                <th style={{ textAlign: "left", padding: "16px 24px", fontSize: "0.875rem", color: "var(--night)" }}>
                  Commercial
                </th>
                <th
                  onClick={() => handleSort("closing_date")}
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    fontSize: "0.875rem",
                    color: "var(--night)",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--gray-light)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  Date Closing
                </th>
                <th
                  onClick={() => handleSort("gross_margin_cents")}
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    fontSize: "0.875rem",
                    color: "var(--night)",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "var(--gray-light)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  Marge Brute
                </th>
                <th style={{ textAlign: "left", padding: "16px 24px", fontSize: "0.875rem", color: "var(--night)" }}>
                  Acompte
                </th>
                <th style={{ textAlign: "left", padding: "16px 24px", fontSize: "0.875rem", color: "var(--night)" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRows.map((event: EventRow, index) => {
                const acompteStatus = getAcompteStatus(event);
                return (
                  <tr
                    key={event.id}
                    onClick={() => setSelectedId(event.id)}
                    style={{
                      borderTop: "1px solid var(--gray-light)",
                      background: index % 2 === 1 ? "#FAFAFA" : "white",
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "var(--seasalt)"}
                    onMouseOut={(e) => e.currentTarget.style.background = index % 2 === 1 ? "#FAFAFA" : "white"}
                  >
                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "var(--night)" }}>
                      {event.event_date ? new Date(event.event_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "var(--night)" }}>
                      {event.client_name || "—"}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 12px",
                        borderRadius: 9999,
                        fontSize: "0.75rem",
                        ...getPackBadgeStyle(event.pack_id)
                      }}>
                        {event.pack_id ? (packMap.get(event.pack_id) || event.pack_id) : "—"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "var(--night)" }}>
                      {event.address || "—"}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "var(--night)" }}>
                      {event.commercial_name || "—"}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "var(--night)" }}>
                      {event.closing_date ? new Date(event.closing_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "var(--night)" }}>
                      {event.gross_margin_cents ? formatCurrency(event.gross_margin_cents) : "—"}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 12px",
                        borderRadius: 9999,
                        fontSize: "0.75rem",
                        border: `1px solid ${acompteStatus.isPaid ? "var(--satin-gold)" : "var(--fire-red)"}`,
                        color: acompteStatus.isPaid ? "var(--satin-gold)" : "var(--fire-red)",
                        background: "transparent"
                      }}>
                        {acompteStatus.label}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(event.id);
                        }}
                        style={{
                          padding: 8,
                          borderRadius: "var(--radius-md)",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "var(--gray-light)"}
                        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredAndSortedRows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 48, color: "var(--gray-muted)" }}>
                    No events found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}
