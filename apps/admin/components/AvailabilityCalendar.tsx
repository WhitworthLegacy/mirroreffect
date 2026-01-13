"use client";

import { useMemo, useState } from "react";
import type { EventRow } from "@/lib/adminData";
import { formatDate } from "@/lib/format";

type Props = {
  events: EventRow[];
};

const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, EventRow[]>>((acc, event) => {
      if (!event.event_date) return acc;
      const key = event.event_date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
  }, [events]);

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];

  const monthLabel = viewDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric"
  });

  return (
    <div className="admin-calendar">
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
          return (
            <button
              key={key}
              type="button"
              className={`admin-calendar-day${isCurrentMonth ? "" : " is-outside"}${
                isSelected ? " is-selected" : ""
              }`}
              onClick={() => setSelectedDate(key)}
            >
              <span className="admin-calendar-date">{day.getDate()}</span>
              {dayEvents.length > 0 && (
                <span className="admin-calendar-count">{dayEvents.length}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="admin-card" style={{ marginTop: 20 }}>
        <h2>{selectedDate ? `Détails du ${formatDate(selectedDate)}` : "Sélectionnez une date"}</h2>
        {selectedDate && selectedEvents.length === 0 && (
          <p className="admin-muted">Aucun événement sur cette date.</p>
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
