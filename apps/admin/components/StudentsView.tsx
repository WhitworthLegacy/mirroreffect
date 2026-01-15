"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/format";

type StudentEvent = {
  event_id: string;
  event_date: string;
  client_name: string | null;
  student_name: string;
  student_hours: number | null;
  student_rate_cents: number | null;
  total_cents: number | null;
};

type MonthlyTotal = {
  month: string;
  student_name: string;
  total_hours: number;
  total_remuneration_cents: number;
  event_count: number;
};

type Props = {
  studentEvents: StudentEvent[];
  monthlyTotals: MonthlyTotal[];
};

type EditingCell = {
  eventId: string;
  field: "student_hours" | "student_rate_cents";
} | null;

export default function StudentsView({ studentEvents, monthlyTotals }: Props) {
  const [activeTab, setActiveTab] = useState<"events" | "monthly">("events");
  const [events, setEvents] = useState(studentEvents);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Get unique months and students for filters
  const months = useMemo(() => {
    const m = [...new Set(events.map(e => e.event_date.substring(0, 7)))];
    return m.sort((a, b) => b.localeCompare(a));
  }, [events]);

  const students = useMemo(() => {
    return [...new Set(events.map(e => e.student_name))].sort();
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedMonth && !e.event_date.startsWith(selectedMonth)) return false;
      if (selectedStudent && e.student_name !== selectedStudent) return false;
      return true;
    });
  }, [events, selectedMonth, selectedStudent]);

  // Filtered monthly totals
  const filteredMonthlyTotals = useMemo(() => {
    return monthlyTotals.filter(m => {
      if (selectedMonth && m.month !== selectedMonth) return false;
      if (selectedStudent && m.student_name !== selectedStudent) return false;
      return true;
    });
  }, [monthlyTotals, selectedMonth, selectedStudent]);

  const startEdit = (eventId: string, field: "student_hours" | "student_rate_cents", currentValue: number | null) => {
    setEditingCell({ eventId, field });
    if (field === "student_rate_cents") {
      setEditValue(currentValue ? (currentValue / 100).toFixed(2).replace(".", ",") : "");
    } else {
      setEditValue(currentValue?.toString() ?? "");
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    setSaving(true);
    try {
      let value: number | null = null;
      if (editValue.trim()) {
        const parsed = parseFloat(editValue.replace(",", "."));
        if (!isNaN(parsed)) {
          value = editingCell.field === "student_rate_cents" ? Math.round(parsed * 100) : parsed;
        }
      }

      const res = await fetch("/api/events/update-finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: editingCell.eventId,
          [editingCell.field]: value,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur lors de la sauvegarde");
      }

      // Update local state
      setEvents(prev =>
        prev.map(e =>
          e.event_id === editingCell.eventId
            ? { ...e, [editingCell.field]: value }
            : e
        )
      );

      setEditingCell(null);
      setEditValue("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    const date = new Date(parseInt(year), parseInt(m) - 1, 1);
    return date.toLocaleDateString("fr-BE", { month: "long", year: "numeric" });
  };

  const formatRate = (cents: number | null) => {
    if (cents === null) return "—";
    return (cents / 100).toFixed(2).replace(".", ",") + " €/h";
  };

  return (
    <>
      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          Par événement
        </button>
        <button
          className={`admin-tab ${activeTab === "monthly" ? "active" : ""}`}
          onClick={() => setActiveTab("monthly")}
        >
          Totaux mensuels
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select
          className="admin-chip"
          value={selectedMonth || ""}
          onChange={(e) => setSelectedMonth(e.target.value || null)}
          style={{ minWidth: 160 }}
        >
          <option value="">Tous les mois</option>
          {months.map(m => (
            <option key={m} value={m}>{formatMonth(m)}</option>
          ))}
        </select>
        <select
          className="admin-chip"
          value={selectedStudent || ""}
          onChange={(e) => setSelectedStudent(e.target.value || null)}
          style={{ minWidth: 160 }}
        >
          <option value="">Tous les étudiants</option>
          {students.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(selectedMonth || selectedStudent) && (
          <button
            className="admin-chip"
            onClick={() => { setSelectedMonth(null); setSelectedStudent(null); }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Events Table */}
      {activeTab === "events" && (
        <div className="admin-card">
          <h2>Détail par événement</h2>
          <p className="admin-muted" style={{ marginBottom: 16 }}>
            Cliquez sur une cellule pour modifier les heures ou le taux horaire.
          </p>
          <div className="admin-list" style={{ border: "none", marginTop: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Étudiant</th>
                  <th>Client</th>
                  <th style={{ textAlign: "right" }}>Heures</th>
                  <th style={{ textAlign: "right" }}>Taux horaire</th>
                  <th style={{ textAlign: "right" }}>Rémunération</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const remuneration = (event.student_hours ?? 0) * (event.student_rate_cents ?? 0);
                  const isEditingHours = editingCell?.eventId === event.event_id && editingCell?.field === "student_hours";
                  const isEditingRate = editingCell?.eventId === event.event_id && editingCell?.field === "student_rate_cents";

                  return (
                    <tr key={event.event_id} className="admin-row">
                      <td>
                        {new Date(event.event_date).toLocaleDateString("fr-BE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td style={{ fontWeight: 600 }}>{event.student_name}</td>
                      <td className="admin-muted">{event.client_name || "—"}</td>
                      <td
                        style={{ textAlign: "right", cursor: "pointer" }}
                        onClick={() => !isEditingHours && startEdit(event.event_id, "student_hours", event.student_hours)}
                      >
                        {isEditingHours ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={saveEdit}
                            autoFocus
                            disabled={saving}
                            style={{
                              width: 60,
                              textAlign: "right",
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid var(--accent)",
                              background: "var(--bg-tertiary)",
                              color: "var(--text-primary)",
                            }}
                          />
                        ) : (
                          <span style={{ padding: "4px 8px", borderRadius: 6, background: "var(--bg-tertiary)" }}>
                            {event.student_hours ? `${event.student_hours}h` : "—"}
                          </span>
                        )}
                      </td>
                      <td
                        style={{ textAlign: "right", cursor: "pointer" }}
                        onClick={() => !isEditingRate && startEdit(event.event_id, "student_rate_cents", event.student_rate_cents)}
                      >
                        {isEditingRate ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={saveEdit}
                            autoFocus
                            disabled={saving}
                            style={{
                              width: 80,
                              textAlign: "right",
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid var(--accent)",
                              background: "var(--bg-tertiary)",
                              color: "var(--text-primary)",
                            }}
                          />
                        ) : (
                          <span style={{ padding: "4px 8px", borderRadius: 6, background: "var(--bg-tertiary)" }}>
                            {formatRate(event.student_rate_cents)}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatCurrency(remuneration)}
                      </td>
                    </tr>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-muted" style={{ textAlign: "center" }}>
                      Aucun événement trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredEvents.length > 0 && (
                <tfoot>
                  <tr style={{ background: "var(--bg-tertiary)", fontWeight: 700 }}>
                    <td colSpan={3}>Total</td>
                    <td style={{ textAlign: "right" }}>
                      {filteredEvents.reduce((sum, e) => sum + (e.student_hours ?? 0), 0).toFixed(1)}h
                    </td>
                    <td></td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        filteredEvents.reduce((sum, e) => sum + (e.student_hours ?? 0) * (e.student_rate_cents ?? 0), 0)
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Monthly Totals Table */}
      {activeTab === "monthly" && (
        <div className="admin-card">
          <h2>Totaux mensuels par étudiant</h2>
          <div className="admin-list" style={{ border: "none", marginTop: 16 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Étudiant</th>
                  <th style={{ textAlign: "right" }}>Événements</th>
                  <th style={{ textAlign: "right" }}>Heures totales</th>
                  <th style={{ textAlign: "right" }}>Rémunération</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonthlyTotals.map((total, idx) => (
                  <tr key={`${total.month}-${total.student_name}-${idx}`} className="admin-row">
                    <td>{formatMonth(total.month)}</td>
                    <td style={{ fontWeight: 600 }}>{total.student_name}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className="admin-badge success">{total.event_count}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>{total.total_hours.toFixed(1)}h</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatCurrency(total.total_remuneration_cents)}
                    </td>
                  </tr>
                ))}
                {filteredMonthlyTotals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="admin-muted" style={{ textAlign: "center" }}>
                      Aucune donnée trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredMonthlyTotals.length > 0 && (
                <tfoot>
                  <tr style={{ background: "var(--bg-tertiary)", fontWeight: 700 }}>
                    <td colSpan={2}>Total</td>
                    <td style={{ textAlign: "right" }}>
                      {filteredMonthlyTotals.reduce((sum, t) => sum + t.event_count, 0)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {filteredMonthlyTotals.reduce((sum, t) => sum + t.total_hours, 0).toFixed(1)}h
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(
                        filteredMonthlyTotals.reduce((sum, t) => sum + t.total_remuneration_cents, 0)
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </>
  );
}
