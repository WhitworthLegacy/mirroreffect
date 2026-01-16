"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/format";

export type CommercialMonthlyStats = {
  month: string;
  commercial_name: string;
  total_calls?: number | null;
  calls_under_30s?: number | null;
  calls_over_30s?: number | null;
  calls_over_1min?: number | null;
  calls_over_2min?: number | null;
  calls_over_5min?: number | null;
  calls_over_5min_pct?: number | null;
  bonus_calls_cents?: number | null;
  calls_answered?: number | null;
  closed_deals?: number | null;
  conversion_pct?: number | null;
  commissions_cents?: number | null;
  bonus_conversion_cents?: number | null;
  callbacks_scheduled?: number | null;
  callbacks_completed?: number | null;
  callbacks_completion_pct?: number | null;
  bonus_callbacks_cents?: number | null;
  total_bonus_cents?: number | null;
  total_tvac_cents?: number | null;
  total_htva_cents?: number | null;
  [key: string]: unknown;
};

type Props = {
  stat: CommercialMonthlyStats | null;
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

export default function CommercialModal({ stat, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<CommercialMonthlyStats | null>(stat);
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
      const response = await fetch("/api/stats/commercial", {
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
            <h2>{stat.commercial_name}</h2>
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
              <span>Commercial</span>
              <input
                type="text"
                value={draft.commercial_name || ""}
                onChange={(e) => updateField("commercial_name", e.target.value)}
              />
            </div>
            <div className="admin-field">
              <span>Appels totaux</span>
              <input
                type="number"
                value={draft.total_calls ?? ""}
                onChange={(e) => updateField("total_calls", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            </div>
            <div className="admin-field">
              <span>Appels &gt; 5 min</span>
              <input
                type="number"
                value={draft.calls_over_5min ?? ""}
                onChange={(e) => updateField("calls_over_5min", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            </div>
            <div className="admin-field">
              <span>% Appels &gt; 5 min</span>
              <input
                type="number"
                step="0.01"
                value={draft.calls_over_5min_pct ?? ""}
                onChange={(e) => updateField("calls_over_5min_pct", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0"
              />
            </div>
            <div className="admin-field">
              <span>Deals fermés</span>
              <input
                type="number"
                value={draft.closed_deals ?? ""}
                onChange={(e) => updateField("closed_deals", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
              />
            </div>
            <div className="admin-field">
              <span>% Conversion</span>
              <input
                type="number"
                step="0.01"
                value={draft.conversion_pct ?? ""}
                onChange={(e) => updateField("conversion_pct", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0"
              />
            </div>
            <div className="admin-field">
              <span>Commissions (€)</span>
              <input
                type="text"
                value={formatEuro(draft.commissions_cents)}
                onChange={(e) => updateField("commissions_cents", parseEuro(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <div className="admin-field">
              <span>Bonus total (€)</span>
              <input
                type="text"
                value={formatEuro(draft.total_bonus_cents)}
                onChange={(e) => updateField("total_bonus_cents", parseEuro(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <div className="admin-field">
              <span>Total TVAC (€)</span>
              <input
                type="text"
                value={formatEuro(draft.total_tvac_cents)}
                onChange={(e) => updateField("total_tvac_cents", parseEuro(e.target.value))}
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
