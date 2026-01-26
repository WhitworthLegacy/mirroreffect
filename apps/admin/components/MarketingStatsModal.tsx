"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/format";

type MarketingStat = {
  month: string;
  leads_meta: number;
  spent_meta_cents: number;
  leads_total: number;
  notes?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  selectedMonth?: string; // Format YYYY-MM
  existingData?: MarketingStat | null;
};

export default function MarketingStatsModal({
  isOpen,
  onClose,
  onSaved,
  selectedMonth,
  existingData,
}: Props) {
  const [month, setMonth] = useState(selectedMonth || getCurrentMonth());
  const [leadsMeta, setLeadsMeta] = useState(0);
  const [spentMeta, setSpentMeta] = useState(0); // In euros for display
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing data when modal opens
  useEffect(() => {
    if (existingData) {
      setMonth(existingData.month);
      setLeadsMeta(existingData.leads_meta || 0);
      setSpentMeta((existingData.spent_meta_cents || 0) / 100);
      setLeadsTotal(existingData.leads_total || 0);
      setNotes(existingData.notes || "");
    } else if (selectedMonth) {
      setMonth(selectedMonth);
      setLeadsMeta(0);
      setSpentMeta(0);
      setLeadsTotal(0);
      setNotes("");
    }
  }, [existingData, selectedMonth, isOpen]);

  function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/marketing-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          leads_meta: leadsMeta,
          spent_meta_cents: Math.round(spentMeta * 100),
          leads_total: leadsTotal,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsSaving(false);
    }
  }

  // Calculate derived values
  const cplMeta = leadsMeta > 0 ? spentMeta / leadsMeta : 0;
  const cplTotal = leadsTotal > 0 ? spentMeta / leadsTotal : 0;

  if (!isOpen) return null;

  return (
    <div
      className="admin-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="admin-modal"
        style={{
          background: "white",
          borderRadius: "var(--radius-xl)",
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "var(--shadow-xl)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid var(--border)",
            background: "var(--gradient-gold)",
            borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          }}
        >
          <h2 style={{ margin: 0, color: "white", fontSize: "1.25rem" }}>
            Stats Marketing
          </h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>
            Saisie manuelle des leads et dépenses META
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "24px 28px" }}>
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(205, 27, 23, 0.1)",
                border: "1px solid var(--fire-red)",
                borderRadius: "var(--radius-md)",
                color: "var(--fire-red)",
                marginBottom: 20,
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Month selector */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: "0.875rem",
                color: "var(--text-primary)",
              }}
            >
              Mois
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
              }}
            />
          </div>

          {/* Leads META */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: "0.875rem",
                color: "var(--text-primary)",
              }}
            >
              # Leads META
            </label>
            <input
              type="number"
              min={0}
              value={leadsMeta}
              onChange={(e) => setLeadsMeta(parseInt(e.target.value) || 0)}
              placeholder="0"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Nombre de leads générés via Facebook/Instagram Ads
            </span>
          </div>

          {/* Spent META */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: "0.875rem",
                color: "var(--text-primary)",
              }}
            >
              Spent META (€)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={spentMeta}
              onChange={(e) => setSpentMeta(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Budget dépensé sur META Ads ce mois
            </span>
          </div>

          {/* CPL META (calculated) */}
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              CPL META (calculé)
            </span>
            <p style={{ margin: "4px 0 0", fontSize: "1.125rem", fontWeight: 600 }}>
              {formatCurrency(Math.round(cplMeta * 100))}
            </p>
          </div>

          {/* Leads Total */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: "0.875rem",
                color: "var(--text-primary)",
              }}
            >
              # Leads Total
            </label>
            <input
              type="number"
              min={0}
              value={leadsTotal}
              onChange={(e) => setLeadsTotal(parseInt(e.target.value) || 0)}
              placeholder="0"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Tous canaux confondus (META + autres sources)
            </span>
          </div>

          {/* CPL Total (calculated) */}
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              CPL Total (calculé)
            </span>
            <p style={{ margin: "4px 0 0", fontSize: "1.125rem", fontWeight: 600 }}>
              {formatCurrency(Math.round(cplTotal * 100))}
            </p>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 500,
                fontSize: "0.875rem",
                color: "var(--text-primary)",
              }}
            >
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarques sur ce mois..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            className="admin-chip"
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="admin-chip primary"
            disabled={isSaving}
          >
            {isSaving ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
