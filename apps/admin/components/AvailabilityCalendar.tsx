"use client";

import { useMemo, useState } from "react";
import type { EventRow } from "@/lib/adminData";

type Props = {
  events: EventRow[];
};

// Week starts on Monday (European format)
const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Nombre total de miroirs disponibles (HARD-CODED per requirements)
const TOTAL_MIRRORS = 4;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  // Get day of week (0 = Sunday, 1 = Monday, ...)
  // Convert to Monday-first: Monday=0, Tuesday=1, ..., Sunday=6
  const dayOfWeek = firstDay.getDay();
  const startingDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Return array with empty slots for days before month starts
  const days: (Date | null)[] = [];

  // Add empty slots for days before month starts (Monday-first)
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add actual days of month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
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

  const monthLabel = viewDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric"
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ color: "var(--night)", marginBottom: 4, fontSize: "1.5rem", fontWeight: 500 }}>Availability Calendar</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--gray-muted)" }}>View event availability and mirror capacity</p>
      </div>

      {/* Calendar Card */}
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: 24, boxShadow: "var(--shadow-sm)" }}>
        {/* Month Navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.25rem", color: "var(--night)", textTransform: "capitalize", margin: 0 }}>{monthLabel}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              style={{
                padding: 8,
                borderRadius: "var(--radius-md)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "var(--seasalt)"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--night)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              style={{
                padding: 8,
                borderRadius: "var(--radius-md)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "var(--seasalt)"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--night)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {/* Day headers */}
          {dayLabels.map((label) => (
            <div key={label} style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--gray-muted)", padding: 8 }}>
              {label}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, idx) => {
            if (!day) {
              // Empty cell for days before month starts
              return <div key={`empty-${idx}`} style={{ aspectRatio: "1" }} />;
            }

            const key = toDateKey(day);
            const isSelected = selectedDate === key;
            const dayEvents = eventsByDate[key] ?? [];
            const availability = availabilityByDate[key];
            const available = availability ? availability.available : TOTAL_MIRRORS;
            const used = availability ? availability.used : 0;

            // Figma color coding
            const getCellStyle = () => {
              const base = {
                aspectRatio: "1",
                border: "2px solid",
                borderRadius: "var(--radius-lg)",
                padding: 8,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column" as const,
                justifyContent: "space-between" as const,
                height: "100%",
              };

              if (used === 0) {
                return { ...base, background: "white", borderColor: "var(--gray-light)" };
              } else if (used <= 1) {
                return { ...base, background: "#f0fdf4", borderColor: "#bbf7d0" }; // green-50, green-200
              } else if (used <= 3) {
                return { ...base, background: "#fef9c3", borderColor: "var(--satin-gold)" }; // yellow-50, gold
              } else {
                return { ...base, background: "#fef2f2", borderColor: "var(--fire-red)" }; // red-50, red
              }
            };

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                style={{
                  ...getCellStyle(),
                  outline: isSelected ? "2px solid var(--satin-gold)" : "none",
                  outlineOffset: 2,
                  boxShadow: isSelected ? "0 0 0 2px var(--satin-gold)" : undefined,
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "var(--night)" }}>{day.getDate()}</span>
                <div style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: 2 }}>
                  {used > 0 && (
                    <>
                      <div style={{ color: "var(--night)" }}>{used} event{used > 1 ? "s" : ""}</div>
                      <div style={{ color: available === 0 ? "var(--fire-red)" : "var(--gray-muted)" }}>
                        {available}/{TOTAL_MIRRORS} mirrors
                      </div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--gray-light)" }}>
          <h4 style={{ fontSize: "0.875rem", color: "var(--night)", marginBottom: 12 }}>Legend</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 16, height: 16, background: "#f0fdf4", border: "2px solid #bbf7d0", borderRadius: 4 }} />
              <span style={{ color: "var(--gray-muted)" }}>0-1 events (Available)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 16, height: 16, background: "#fef9c3", border: "2px solid var(--satin-gold)", borderRadius: 4 }} />
              <span style={{ color: "var(--gray-muted)" }}>2-3 events (Warning)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 16, height: 16, background: "#fef2f2", border: "2px solid var(--fire-red)", borderRadius: 4 }} />
              <span style={{ color: "var(--gray-muted)" }}>4 events (Blocked)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Events */}
      {selectedDate && selectedEvents.length > 0 && (
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: 24, boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ color: "var(--night)", marginBottom: 16 }}>
            Events on {new Date(selectedDate).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  border: "1px solid var(--gray-light)",
                  borderRadius: "var(--radius-lg)",
                  transition: "background 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "var(--seasalt)"}
                onMouseOut={(e) => e.currentTarget.style.background = "white"}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "0.875rem", color: "var(--night)", marginBottom: 4 }}>{event.client_name || "—"}</h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--gray-muted)", margin: 0 }}>{event.address || "—"}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 12px",
                    borderRadius: 9999,
                    fontSize: "0.75rem",
                    background: event.pack_id === "Premium" || event.pack_id?.includes("premium")
                      ? "var(--satin-gold)"
                      : event.pack_id === "Essentiel" || event.pack_id?.includes("essentiel")
                        ? "#4A4A4A"
                        : "var(--silver)",
                    color: event.pack_id === "Premium" || event.pack_id?.includes("premium") || event.pack_id === "Essentiel" || event.pack_id?.includes("essentiel")
                      ? "white"
                      : "var(--night)"
                  }}>
                    {event.pack_id || "No Pack"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
