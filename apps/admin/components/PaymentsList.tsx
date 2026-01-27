"use client";

import { useMemo, useState } from "react";
import type { PaymentRow } from "@/lib/adminData";

type Props = {
  payments: PaymentRow[];
};

type SortConfig = {
  key: keyof PaymentRow;
  direction: "asc" | "desc";
} | null;

export default function PaymentsList({ payments }: Props) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "created_at", direction: "desc" });

  const filteredAndSortedRows = useMemo(() => {
    let result = [...payments];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        (p.payment_id?.toLowerCase().includes(q)) ||
        (p.event_id?.toLowerCase().includes(q)) ||
        (p.status?.toLowerCase().includes(q))
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [payments, search, sortConfig]);

  const handleSort = (key: keyof PaymentRow) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const getStatusBadge = (status: string | null) => {
    if (status === "paid") return { label: "Payé", color: "var(--success)", bg: "rgba(34, 197, 94, 0.1)" };
    if (status === "failed") return { label: "Échoué", color: "var(--fire-red)", bg: "rgba(205, 27, 23, 0.1)" };
    if (status === "expired") return { label: "Expiré", color: "var(--gray-muted)", bg: "rgba(128, 128, 128, 0.1)" };
    if (status === "canceled") return { label: "Annulé", color: "var(--fire-red)", bg: "rgba(205, 27, 23, 0.1)" };
    return { label: "En cours", color: "var(--satin-gold)", bg: "rgba(193, 149, 14, 0.1)" };
  };

  const formatEuro = (cents: number | null | undefined): string => {
    if (cents === null || cents === undefined) return "—";
    return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  };

  const thStyle = (sortable = false): React.CSSProperties => ({
    textAlign: "left",
    padding: "16px 24px",
    fontSize: "0.875rem",
    color: "var(--night)",
    cursor: sortable ? "pointer" : "default",
  });

  const tdStyle: React.CSSProperties = {
    padding: "16px 24px",
    fontSize: "0.875rem",
    color: "var(--night)",
  };

  return (
    <div className="space-y-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ color: "var(--night)", marginBottom: 4, fontSize: "1.5rem", fontWeight: 500 }}>Payments</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--gray-muted)" }}>{payments.length} paiements</p>
        </div>
      </div>

      {/* Search */}
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
            placeholder="Rechercher par payment ID, event ID..."
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
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--seasalt)", position: "sticky", top: 0 }}>
              <tr>
                <th onClick={() => handleSort("created_at")} style={thStyle(true)}>Date</th>
                <th style={thStyle()}>Payment ID</th>
                <th style={thStyle()}>Event ID</th>
                <th onClick={() => handleSort("amount_cents")} style={thStyle(true)}>Montant</th>
                <th onClick={() => handleSort("status")} style={thStyle(true)}>Status</th>
                <th onClick={() => handleSort("paid_at")} style={thStyle(true)}>Payé le</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRows.map((payment, index) => {
                const badge = getStatusBadge(payment.status);
                return (
                  <tr
                    key={payment.id}
                    style={{
                      borderTop: "1px solid var(--gray-light)",
                      background: index % 2 === 1 ? "#FAFAFA" : "white",
                    }}
                  >
                    <td style={tdStyle}>
                      {payment.created_at ? new Date(payment.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {payment.payment_id || "—"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {payment.event_id || "—"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {formatEuro(payment.amount_cents)}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 12px",
                        borderRadius: 9999,
                        fontSize: "0.75rem",
                        color: badge.color,
                        background: badge.bg,
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                );
              })}
              {filteredAndSortedRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 48, color: "var(--gray-muted)" }}>
                    Aucun paiement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
