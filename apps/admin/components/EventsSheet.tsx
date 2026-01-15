"use client";

import { useMemo, useState } from "react";
import type { EventFinanceRow, EventRow, PackRow } from "@/lib/adminData";
import { formatCurrency, formatDate } from "@/lib/format";

type Props = {
  events: EventRow[];
  packs: PackRow[];
};

type SheetRow = {
  id: string;
  isNew?: boolean;
  event: EventRow;
  finance: EventFinanceRow;
};

type Column = {
  key: string;
  label: string;
  type: "text" | "date" | "select" | "number" | "currency" | "boolean";
  options?: Array<{ value: string; label: string }>;
  scope: "event" | "finance";
};

const EVENT_TYPES = [
  { value: "mariage", label: "Mariage" },
  { value: "anniversaire", label: "Anniversaire" },
  { value: "bapteme", label: "Baptême" },
  { value: "B2B", label: "B2B" }
];

const LANGUAGES = [
  { value: "fr", label: "FR" },
  { value: "nl", label: "NL" }
];

const BALANCE_STATUSES = [
  { value: "due", label: "Dû" },
  { value: "partial", label: "Partiel" },
  { value: "paid", label: "Payé" }
];

const STATUSES = [
  { value: "active", label: "Actif" },
  { value: "hold", label: "Hold" },
  { value: "cancelled", label: "Annulé" }
];

const financeDefaults: EventFinanceRow = {
  student_rate_cents: 1400
};

function getFinanceFromEvent(event: EventRow): EventFinanceRow {
  const financeData = event.event_finance ?? null;
  const finance = Array.isArray(financeData) ? financeData[0] : financeData;
  return { ...financeDefaults, ...(finance ?? {}) };
}

function normalizeRows(events: EventRow[]): SheetRow[] {
  return events.map((event) => ({
    id: event.id,
    event,
    finance: getFinanceFromEvent(event)
  }));
}

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

function numberInput(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return Number.isFinite(value) ? value.toString() : "";
}

function toEventKey(date: string | null) {
  return date ?? "";
}

function getValue(row: SheetRow, column: Column) {
  if (column.scope === "event") {
    return (row.event as Record<string, unknown>)[column.key];
  }
  return (row.finance as Record<string, unknown>)[column.key];
}

function setValue(row: SheetRow, column: Column, value: unknown): SheetRow {
  if (column.scope === "event") {
    return {
      ...row,
      event: {
        ...row.event,
        [column.key]: value
      }
    };
  }
  return {
    ...row,
    finance: {
      ...row.finance,
      [column.key]: value
    }
  };
}

export default function EventsSheet({ events, packs }: Props) {
  const packOptions = useMemo(
    () =>
      packs.map((pack) => ({
        value: pack.id,
        label: pack.name_fr || pack.code || "Pack"
      })),
    [packs]
  );

  const [rows, setRows] = useState<SheetRow[]>(() => normalizeRows(events));
  const [dirtyRows, setDirtyRows] = useState<Record<string, Set<string>>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPack, setFilterPack] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [bulkField, setBulkField] = useState<string>("status");
  const [bulkValue, setBulkValue] = useState<string>("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const columns: Column[] = [
    { key: "event_date", label: "Date", type: "date", scope: "event" },
    { key: "event_type", label: "Type", type: "select", scope: "event", options: EVENT_TYPES },
    { key: "language", label: "Langue", type: "select", scope: "event", options: LANGUAGES },
    { key: "client_name", label: "Nom client", type: "text", scope: "event" },
    { key: "client_email", label: "Email", type: "text", scope: "event" },
    { key: "client_phone", label: "Téléphone", type: "text", scope: "event" },
    { key: "address", label: "Adresse", type: "text", scope: "event" },
    { key: "on_site_contact", label: "Contact sur place", type: "text", scope: "event" },
    { key: "pack_id", label: "Pack", type: "select", scope: "event", options: packOptions },
    { key: "transport_fee_cents", label: "Transport (€)", type: "currency", scope: "event" },
    { key: "total_cents", label: "Total (€)", type: "currency", scope: "event" },
    { key: "deposit_cents", label: "Acompte (€)", type: "currency", scope: "event" },
    { key: "balance_due_cents", label: "Solde (€)", type: "currency", scope: "event" },
    { key: "balance_status", label: "Statut solde", type: "select", scope: "event", options: BALANCE_STATUSES },
    { key: "status", label: "Statut", type: "select", scope: "event", options: STATUSES },
    { key: "student_name", label: "Étudiant", type: "text", scope: "finance" },
    { key: "student_hours", label: "Heures étudiant", type: "number", scope: "finance" },
    { key: "student_rate_cents", label: "Taux étudiant €/h", type: "currency", scope: "finance" },
    { key: "km_one_way", label: "KM (aller)", type: "number", scope: "finance" },
    { key: "km_total", label: "KM (total)", type: "number", scope: "finance" },
    { key: "fuel_cost_cents", label: "Coût essence (€)", type: "currency", scope: "finance" },
    { key: "commercial_name", label: "Commercial", type: "text", scope: "finance" },
    { key: "commercial_commission_cents", label: "Comm. commerciale (€)", type: "currency", scope: "finance" },
    { key: "gross_margin_cents", label: "Marge brute (€)", type: "currency", scope: "finance" },
    { key: "invoice_deposit_paid", label: "Acompte facture", type: "boolean", scope: "finance" },
    { key: "invoice_balance_paid", label: "Solde facture", type: "boolean", scope: "finance" }
  ];

  const months = useMemo(() => {
    const uniq = new Set<string>();
    rows.forEach((row) => {
      if (row.event.event_date) {
        uniq.add(row.event.event_date.slice(0, 7));
      }
    });
    return Array.from(uniq).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const haystack = [
        row.event.client_name,
        row.event.client_email,
        row.event.client_phone,
        row.event.address
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filterStatus && row.event.status !== filterStatus) return false;
      if (filterPack && row.event.pack_id !== filterPack) return false;
      if (filterType && row.event.event_type !== filterType) return false;
      if (filterMonth && row.event.event_date?.slice(0, 7) !== filterMonth) return false;
      return true;
    });
  }, [rows, search, filterStatus, filterPack, filterType, filterMonth]);

  const updateRow = (id: string, column: Column, value: unknown) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = setValue(row, column, value);
        return updated;
      })
    );
    setDirtyRows((prev) => {
      const next = { ...prev };
      const current = new Set(next[id] ?? []);
      current.add(column.key);
      next[id] = current;
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addRow = () => {
    const tempId = `new-${Date.now()}`;
    setRows((prev) => [
      {
        id: tempId,
        isNew: true,
        event: {
          id: tempId,
          event_date: "",
          event_type: null,
          language: "fr",
          client_name: null,
          client_email: null,
          client_phone: null,
          zone_id: null,
          status: "active",
          total_cents: null,
          transport_fee_cents: null,
          deposit_cents: null,
          balance_due_cents: null,
          balance_status: "due",
          pack_id: null,
          address: null,
          on_site_contact: null,
          guest_count: null,
          created_at: null,
          updated_at: null
        },
        finance: { ...financeDefaults }
      },
      ...prev
    ]);
    setDirtyRows((prev) => ({ ...prev, [tempId]: new Set(["event_date"]) }));
  };

  const saveRows = async (targetIds?: string[]) => {
    const ids = targetIds ?? Object.keys(dirtyRows);
    if (!ids.length) return;
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const updates: Array<{ id: string; event: Record<string, unknown>; finance: Record<string, unknown> }> = [];
      for (const id of ids) {
        const row = rows.find((item) => item.id === id);
        if (!row) continue;
        const eventPayload: Record<string, unknown> = {
          event_date: row.event.event_date || null,
          event_type: row.event.event_type,
          language: row.event.language,
          client_name: row.event.client_name,
          client_email: row.event.client_email,
          client_phone: row.event.client_phone,
          zone_id: row.event.zone_id,
          status: row.event.status,
          total_cents: row.event.total_cents,
          transport_fee_cents: row.event.transport_fee_cents,
          deposit_cents: row.event.deposit_cents,
          balance_due_cents: row.event.balance_due_cents,
          balance_status: row.event.balance_status,
          pack_id: row.event.pack_id,
          address: row.event.address,
          on_site_contact: row.event.on_site_contact
        };
        updates.push({
          id,
          event: eventPayload,
          finance: row.finance
        });
      }

      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur sauvegarde");
      }

      setDirtyRows((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      setSaveState("saved");
      setSaveMessage("Modifications enregistrées.");
      setTimeout(() => setSaveState("idle"), 1200);
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Erreur sauvegarde");
    }
  };

  const saveNewRow = async (id: string) => {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    setSaveState("saving");
    setSaveMessage(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            ...row.event,
            event_date: row.event.event_date
          },
          finance: row.finance
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erreur création");
      }
      const created = data.item as EventRow;
      setRows((prev) =>
        prev.map((item) =>
          item.id === id
            ? { id: created.id, event: created, finance: row.finance }
            : item
        )
      );
      setDirtyRows((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSaveState("saved");
      setSaveMessage("Event créé.");
      setTimeout(() => setSaveState("idle"), 1200);
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Erreur création");
    }
  };

  const handleBulkApply = () => {
    if (!selectedIds.length || !bulkField) return;
    const column = columns.find((col) => col.key === bulkField);
    if (!column) return;
    selectedIds.forEach((id) => {
      const value =
        column.type === "currency" ? inputToCents(bulkValue) : bulkValue || null;
      updateRow(id, column, value);
    });
  };

  const handleRecalculate = async (id: string) => {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    const address = row.event.address ?? "";
    if (!address) return;
    const res = await fetch("/api/events/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: id, address })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveState("error");
      setSaveMessage(data?.error || "Erreur recalcul");
    }
  };

  const renderCellInput = (row: SheetRow, column: Column) => {
    const value = getValue(row, column);
    const isDirty = dirtyRows[row.id]?.has(column.key);
    const commonProps = {
      className: isDirty ? "is-dirty" : "",
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (column.type === "boolean") {
          const checked = (event.target as HTMLInputElement).checked;
          updateRow(row.id, column, checked);
          return;
        }
        updateRow(row.id, column, event.target.value);
      }
    };

    if (column.type === "select") {
      return (
        <select
          {...commonProps}
          value={(value as string | null | undefined) ?? ""}
        >
          <option value="">—</option>
          {column.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (column.type === "boolean") {
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={commonProps.onChange}
        />
      );
    }

    if (column.type === "currency") {
      return (
        <input
          type="text"
          value={centsToInput(value as number | null | undefined)}
          className={commonProps.className}
          onChange={(event) =>
            updateRow(row.id, column, inputToCents(event.target.value))
          }
        />
      );
    }

    if (column.type === "number") {
      return (
        <input
          type="text"
          value={numberInput(value as number | null | undefined)}
          className={commonProps.className}
          onChange={(event) =>
            updateRow(row.id, column, event.target.value ? Number(event.target.value) : null)
          }
        />
      );
    }

    return (
      <input
        type={column.type === "date" ? "date" : "text"}
        value={column.type === "date" ? toEventKey(value as string | null) : (value as string | null | undefined) ?? ""}
        className={commonProps.className}
        onChange={commonProps.onChange}
      />
    );
  };

  return (
    <section>
      <div className="admin-sheet-actions">
        <button type="button" className="admin-chip primary" onClick={addRow}>
          + Ajouter un event
        </button>
        <button type="button" className="admin-chip" onClick={() => saveRows()}>
          Enregistrer tout
        </button>
        {saveMessage && <span className="admin-muted">{saveMessage}</span>}
      </div>

      <div className="admin-sheet-actions">
        <input
          placeholder="Rechercher..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
          <option value="">Statut</option>
          {STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
          <option value="">Type</option>
          {EVENT_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select value={filterPack} onChange={(event) => setFilterPack(event.target.value)}>
          <option value="">Pack</option>
          {packOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)}>
          <option value="">Mois</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-sheet-actions">
        <select value={bulkField} onChange={(event) => setBulkField(event.target.value)}>
          {columns.map((column) => (
            <option key={column.key} value={column.key}>
              {column.label}
            </option>
          ))}
        </select>
        <input
          placeholder="Valeur"
          value={bulkValue}
          onChange={(event) => setBulkValue(event.target.value)}
        />
        <button type="button" className="admin-chip" onClick={handleBulkApply}>
          Appliquer aux sélectionnés
        </button>
        {selectedIds.length > 0 && (
          <span className="admin-muted">{selectedIds.length} sélectionné(s)</span>
        )}
      </div>

      <div className="admin-sheet">
        <table>
          <thead>
            <tr>
              <th>Sel.</th>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelect(row.id)}
                  />
                </td>
                {columns.map((column) => (
                  <td key={`${row.id}-${column.key}`}>{renderCellInput(row, column)}</td>
                ))}
                <td>
                  <div className="admin-sheet-row-actions">
                    {row.isNew ? (
                      <button type="button" onClick={() => saveNewRow(row.id)}>
                        Créer
                      </button>
                    ) : (
                      <button type="button" onClick={() => saveRows([row.id])}>
                        Sauver
                      </button>
                    )}
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleRecalculate(row.id)}
                    >
                      Recalc
                    </button>
                  </div>
                  <div className="admin-muted">
                    {row.event.event_date ? formatDate(row.event.event_date) : "Date manquante"}
                  </div>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="admin-muted">
                  Aucun résultat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="admin-muted" style={{ marginTop: 12 }}>
        Total affiché : {filteredRows.length} events.
      </div>
    </section>
  );
}
