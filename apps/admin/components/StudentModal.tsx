"use client";

import { useEffect, useState } from "react";

export type StudentMonthlyStats = {
  month: string;
  student_name: string;
  hours_raw: number | null;
  hours_adjusted: number | null;
  remuneration_cents: number | null;
};

type Props = {
  stat: StudentMonthlyStats | null;
  onClose: () => void;
  onSaved: (stat: StudentMonthlyStats) => void;
  onDeleted: (month: string, student_name: string) => void;
};

function centsToInput(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  const euros = value / 100;
  return Number.isFinite(euros) ? euros.toString() : "";
}

function inputToCents(value: string) {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (Number.isNaN(parsed)) return null;
  return Math.round(parsed * 100);
}

export default function StudentModal({ stat, onClose, onSaved, onDeleted }: Props) {
  const [draft, setDraft] = useState<StudentMonthlyStats | null>(stat);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(stat);
    setError(null);
  }, [stat]);

  if (!stat || !draft) return null;

  const updateField = <K extends keyof StudentMonthlyStats>(key: K, value: StudentMonthlyStats[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette entrée ?")) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: draft.month, student_name: draft.student_name })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur suppression");
      }
      onDeleted(draft.month, draft.student_name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur suppression");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: draft.month,
          student_name: draft.student_name,
          data: {
            hours_raw: draft.hours_raw,
            hours_adjusted: draft.hours_adjusted,
            remuneration_cents: draft.remuneration_cents
          }
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur sauvegarde");
      }

      onSaved(draft);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const monthLabel = new Date(draft.month).toLocaleDateString('fr-BE', { year: 'numeric', month: 'long' });

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>{draft.student_name}</h2>
            <p className="admin-muted">{monthLabel}</p>
          </div>
          <button type="button" className="admin-chip" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="admin-modal-body">
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Mois</span>
              <input
                type="month"
                value={draft.month.substring(0, 7)}
                onChange={(e) => updateField("month", e.target.value + "-01")}
              />
            </label>
            <label className="admin-field">
              <span>Nom</span>
              <input
                type="text"
                value={draft.student_name}
                onChange={(e) => updateField("student_name", e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Heures brutes</span>
              <input
                type="number"
                step="0.5"
                value={draft.hours_raw ?? ""}
                onChange={(e) => updateField("hours_raw", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </label>
            <label className="admin-field">
              <span>Heures corrigées</span>
              <input
                type="number"
                step="0.5"
                value={draft.hours_adjusted ?? ""}
                onChange={(e) => updateField("hours_adjusted", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </label>
            <label className="admin-field">
              <span>Rémunération (€)</span>
              <input
                type="text"
                value={centsToInput(draft.remuneration_cents)}
                onChange={(e) => updateField("remuneration_cents", inputToCents(e.target.value))}
              />
            </label>
          </div>
          {error && <p style={{ color: 'var(--danger)', marginTop: 16 }}>{error}</p>}
        </div>
        <div className="admin-modal-footer">
          <button
            type="button"
            className="admin-chip danger"
            onClick={handleDelete}
            disabled={isSaving}
            style={{ marginRight: 'auto' }}
          >
            Supprimer
          </button>
          <button type="button" className="admin-chip" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="admin-chip primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}
