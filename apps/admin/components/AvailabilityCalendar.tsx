"use client";

import { useMemo, useState } from "react";
import type { EventRow } from "@/lib/adminData";
import { formatDate } from "@/lib/format";

type Props = {
  events: EventRow[];
};

const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Nombre total de miroirs disponibles (configurable)
const TOTAL_MIRRORS = 4;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const weekday = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - weekday);
  return Array.from({ length: 42 }).map((_, idx) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + idx);
    return date;
  });
}

export default function AvailabilityCalendar({ events }: Props) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateSearch, setDateSearch] = useState("");

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, EventRow[]>>((acc, event) => {
      if (!event.event_date) return acc;
      const key = event.event_date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
  }, [events]);

  // Calculer disponibilité par date
  const availabilityByDate = useMemo(() => {
    const result: Record<string, { used: number; available: number }> = {};
    for (const [date, dateEvents] of Object.entries(eventsByDate)) {
      result[date] = {
        used: dateEvents.length,
        available: Math.max(0, TOTAL_MIRRORS - dateEvents.length),
      };
    }
    return result;
  }, [eventsByDate]);

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];
  const selectedAvailability = selectedDate ? availabilityByDate[selectedDate] : null;

  // Recherche de date
  const searchResult = useMemo(() => {
    if (!dateSearch.trim()) return null;
    const searchDate = dateSearch.trim();
    // Chercher exact ou format flexible
    const matchingDates = Object.keys(eventsByDate).filter(date => 
      date.includes(searchDate) || date.startsWith(searchDate)
    );
    if (matchingDates.length === 0) return null;
    return matchingDates[0]; // Prendre la première correspondance
  }, [dateSearch, eventsByDate]);

  const monthLabel = viewDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric"
  });

  // Naviguer vers la date recherchée
  const handleSearch = () => {
    if (searchResult) {
      const date = new Date(searchResult);
      setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
      setSelectedDate(searchResult);
      setDateSearch("");
    }
  };

  return (
    <div className="admin-calendar">
      {/* Barre de recherche de date */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <input
          type="date"
          value={dateSearch}
          onChange={(e) => setDateSearch(e.target.value)}
          placeholder="Rechercher une date (YYYY-MM-DD)"
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid var(--border, #ddd)",
            fontSize: "0.875rem",
            flex: 1,
            maxWidth: 200,
          }}
        />
        <button
          type="button"
          className="admin-chip"
          onClick={handleSearch}
          disabled={!searchResult}
        >
          🔍 Rechercher
        </button>
        {searchResult && (
          <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
            {formatDate(searchResult)}: {availabilityByDate[searchResult]?.available ?? TOTAL_MIRRORS} miroir(s) disponible(s)
          </span>
        )}
      </div>

      <div className="admin-calendar-header">
        <button
          type="button"
          className="admin-chip"
          onClick={() =>
            setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
          }
        >
          ←
        </button>
        <div className="admin-calendar-title">{monthLabel}</div>
        <button
          type="button"
          className="admin-chip"
          onClick={() =>
            setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
          }
        >
          →
        </button>
      </div>

      <div className="admin-calendar-grid">
        {dayLabels.map((label) => (
          <div key={label} className="admin-calendar-label">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const key = toDateKey(day);
          const isCurrentMonth = day.getMonth() === viewDate.getMonth();
          const isSelected = selectedDate === key;
          const dayEvents = eventsByDate[key] ?? [];
          const availability = availabilityByDate[key];
          const available = availability ? availability.available : TOTAL_MIRRORS;
          const used = availability ? availability.used : 0;
          
          // Couleur selon disponibilité
          const availabilityClass = available === 0 ? " is-full" : available < TOTAL_MIRRORS ? " is-partial" : "";
          
          return (
            <button
              key={key}
              type="button"
              className={`admin-calendar-day${isCurrentMonth ? "" : " is-outside"}${
                isSelected ? " is-selected" : ""
              }${availabilityClass}`}
              onClick={() => setSelectedDate(key)}
              title={`${used} événement(s), ${available} miroir(s) disponible(s)`}
            >
              <span className="admin-calendar-date">{day.getDate()}</span>
              {used > 0 && (
                <span className="admin-calendar-count">{used}/{TOTAL_MIRRORS}</span>
              )}
              {available > 0 && used === 0 && (
                <span style={{ fontSize: "0.6rem", opacity: 0.6 }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="admin-card" style={{ marginTop: 20 }}>
        <h2>
          {selectedDate 
            ? `Détails du ${formatDate(selectedDate)}` 
            : "Sélectionnez une date"}
        </h2>
        {selectedDate && selectedAvailability && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: "var(--bg-secondary, #f5f5f5)", borderRadius: 6 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>
              📊 Disponibilité: <span style={{ color: selectedAvailability.available > 0 ? "var(--success, #22c55e)" : "var(--danger, #ef4444)" }}>
                {selectedAvailability.available} miroir(s) disponible(s)
              </span> sur {TOTAL_MIRRORS}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "var(--muted)" }}>
              {selectedAvailability.used} événement(s) planifié(s) sur cette date
            </p>
          </div>
        )}
        {selectedDate && selectedEvents.length === 0 && (
          <p className="admin-muted">Aucun événement sur cette date. {TOTAL_MIRRORS} miroir(s) disponible(s).</p>
        )}
        {selectedDate && selectedEvents.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Lieu</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {selectedEvents.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.event_date)}</td>
                  <td>{event.client_name || "—"}</td>
                  <td>{event.address || "—"}</td>
                  <td>{event.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
