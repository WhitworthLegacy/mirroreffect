"use client";

import { useMemo, useState } from "react";
import type { LeadRow } from "@/lib/adminData";

type Props = {
  leads: LeadRow[];
};

type SortConfig = {
  key: keyof LeadRow;
  direction: "asc" | "desc";
} | null;

export default function LeadsList({ leads }: Props) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "created_at", direction: "desc" });

  const filteredAndSortedRows = useMemo(() => {
    let result = [...leads];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((lead) =>
        (lead.client_name?.toLowerCase().includes(q)) ||
        (lead.client_email?.toLowerCase().includes(q)) ||
        (lead.client_phone?.toLowerCase().includes(q)) ||
        (lead.lead_id?.toLowerCase().includes(q)) ||
        (lead.utm_source?.toLowerCase().includes(q))
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
  }, [leads, search, sortConfig]);

  const handleSort = (key: keyof LeadRow) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const getStatusBadge = (status: string | null) => {
    if (status === "converted") return { label: "Converti", color: "var(--success)", bg: "rgba(34, 197, 94, 0.1)" };
    if (status === "abandoned") return { label: "Abandonné", color: "var(--fire-red)", bg: "rgba(205, 27, 23, 0.1)" };
    return { label: "En cours", color: "var(--satin-gold)", bg: "rgba(193, 149, 14, 0.1)" };
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
          <h1 style={{ color: "var(--night)", marginBottom: 4, fontSize: "1.5rem", fontWeight: 500 }}>Leads</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--gray-muted)" }}>{leads.length} leads</p>
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
            placeholder="Rechercher par nom, email, téléphone..."
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
                <th onClick={() => handleSort("client_name")} style={thStyle(true)}>Contact</th>
                <th onClick={() => handleSort("step")} style={thStyle(true)}>Step</th>
                <th style={thStyle()}>Event</th>
                <th style={thStyle()}>UTM</th>
                <th onClick={() => handleSort("status")} style={thStyle(true)}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRows.map((lead, index) => {
                const badge = getStatusBadge(lead.status);
                return (
                  <tr
                    key={lead.id}
                    style={{
                      borderTop: "1px solid var(--gray-light)",
                      background: index % 2 === 1 ? "#FAFAFA" : "white",
                    }}
                  >
                    <td style={tdStyle}>
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div>
                        <div style={{ fontSize: "0.875rem", color: "var(--night)", fontWeight: 500 }}>
                          {lead.client_name || "—"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--gray-muted)" }}>
                          {lead.client_email || ""}
                        </div>
                        {lead.client_phone && (
                          <div style={{ fontSize: "0.75rem", color: "var(--gray-muted)" }}>
                            {lead.client_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 9999,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: "rgba(193, 149, 14, 0.1)",
                        color: "var(--satin-gold)",
                      }}>
                        {lead.step ?? "—"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: "0.875rem" }}>{lead.event_date || "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-muted)" }}>{lead.event_type || ""}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-muted)" }}>
                        {lead.utm_source || "—"}
                        {lead.utm_campaign ? ` / ${lead.utm_campaign}` : ""}
                      </div>
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
                  </tr>
                );
              })}
              {filteredAndSortedRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 48, color: "var(--gray-muted)" }}>
                    Aucun lead trouvé.
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
