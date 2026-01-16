"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/format";

export type MonthlyStats = {
  month: string;
  closing_total?: number | null;
  closing_decouverte?: number | null;
  closing_essentiel?: number | null;
  closing_premium?: number | null;
  deposits_signed_cents?: number | null;
  events_count?: number | null;
  events_decouverte?: number | null;
  events_essentiel?: number | null;
  events_premium?: number | null;
  total_event_cents?: number | null;
  deposits_event_cents?: number | null;
  remaining_event_cents?: number | null;
  transport_cents?: number | null;
  ca_total_cents?: number | null;
  student_hours?: number | null;
  student_cost_cents?: number | null;
  fuel_cost_cents?: number | null;
  commercial_commission_cents?: number | null;
  pack_cost_cents?: number | null;
  gross_margin_cents?: number | null;
  cashflow_gross_cents?: number | null;
  leads_meta?: number | null;
  spent_meta_cents?: number | null;
  [key: string]: unknown;
};

type Props = {
  stat: MonthlyStats | null;
  onClose: () => void;
  onSaved?: () => void;
};

function formatEuro(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  const euros = cents / 100;
  return euros.toFixed(2).replace(".", ",");
}

function parseEuro(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (Number.isNaN(parsed)) return null;
  return Math.round(parsed * 100);
}

export default function StatsModal({ stat, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<MonthlyStats | null>(stat);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(stat);
    setError(null);
  }, [stat]);

  if (!stat || !draft) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const monthLabel = new Date(stat.month).toLocaleDateString('fr-BE', { year: 'numeric', month: 'long' });

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/stats/monthly", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (key: string, value: unknown) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="admin-modal" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>Statistiques mensuelles</h2>
            <p className="admin-muted">{monthLabel}</p>
          </div>
          <button type="button" className="admin-chip" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="admin-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {error && (
            <div style={{ padding: 12, background: "var(--error-bg)", color: "var(--error)", borderRadius: "var(--radius-sm)", marginBottom: 16 }}>
              {error}
            </div>
          )}
          <div className="admin-form-grid">
            <div className="admin-field">
              <span>Mois</span>
              <input
                type="month"
                value={draft.month ? draft.month.substring(0, 7) : ""}
                onChange={(e) => updateField("month", e.target.value ? `${e.target.value}-01` : "")}
              />
            </div>
            <div className="admin-field">
              <span>Closings totaux</span>
              <input
                type="number"
                value={draft.closing_total ?? ""}
                onChange={(e) => updateField("closing_total", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            </div>
            <div className="admin-field">
              <span>Événements totaux</span>
              <input
                type="number"
                value={draft.events_count ?? ""}
                onChange={(e) => updateField("events_count", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            </div>
            <div className="admin-field">
              <span>CA Total (€)</span>
              <input
                type="text"
                value={formatEuro(draft.ca_total_cents)}
                onChange={(e) => updateField("ca_total_cents", parseEuro(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <div className="admin-field">
              <span>Marge brute (€)</span>
              <input
                type="text"
                value={formatEuro(draft.gross_margin_cents)}
                onChange={(e) => updateField("gross_margin_cents", parseEuro(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <div className="admin-field">
              <span>Cashflow brut (€)</span>
              <input
                type="text"
                value={formatEuro(draft.cashflow_gross_cents)}
                onChange={(e) => updateField("cashflow_gross_cents", parseEuro(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <div className="admin-field">
              <span>Leads Meta</span>
              <input
                type="number"
                value={draft.leads_meta ?? ""}
                onChange={(e) => updateField("leads_meta", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            </div>
            <div className="admin-field">
              <span>Dépenses Pub Meta (€)</span>
              <input
                type="text"
                value={formatEuro(draft.spent_meta_cents)}
                onChange={(e) => updateField("spent_meta_cents", parseEuro(e.target.value))}
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button type="button" className="admin-chip" onClick={onClose} disabled={isSaving}>
            Annuler
          </button>
          <button type="button" className="admin-chip primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
