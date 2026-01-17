"use client";

import { create } from "zustand";
import type { EventRow } from "./adminData";

/**
 * Store unifié pour Clients ET Stats
 * Source unique de vérité pour toutes les données Google Sheets
 */

// Mapping Clients row -> EventRow
function mapClientsRowToEventRow(headers: string[], row: unknown[], rowIndex: number): EventRow | null {
  const getCol = (label: string): unknown => {
    const idx = headers.findIndex((h) => String(h).trim() === label);
    return idx >= 0 ? row[idx] : null;
  };

  const parseCents = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    let num: number;
    if (typeof value === "string") {
      const cleaned = value.trim().replace(/\s/g, "");
      if (cleaned.includes(",")) {
        const normalized = cleaned.replace(/\./g, "").replace(",", ".");
        num = parseFloat(normalized);
      } else {
        num = parseFloat(cleaned);
      }
    } else {
      num = Number(value);
    }
    return Number.isNaN(num) ? null : Math.round(num * 100);
  };

  const parseNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    let num: number;
    if (typeof value === "string") {
      const cleaned = value.replace(",", ".").trim();
      num = parseFloat(cleaned);
    } else {
      num = Number(value);
    }
    return Number.isNaN(num) ? null : num;
  };

  const formatDate = (value: unknown): string | null => {
    if (!value) return null;
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    const str = String(value).trim();
    if (!str) return null;
    // Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    // Format ISO 8601 with timezone (e.g., 2025-01-10T23:00:00.000Z)
    if (str.includes("T")) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
    // Format DD/MM/YYYY or DD-MM-YYYY
    const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${("0" + m[2]).slice(-2)}-${("0" + m[1]).slice(-2)}`;
    return str;
  };

  const eventId = getCol("Event ID");
  // Generate fallback ID if Event ID column is empty
  const id = eventId ? String(eventId) : `row-${rowIndex}`;
  const event_date = formatDate(getCol("Date Event"));
  const event_type = getCol("Type Event") ? String(getCol("Type Event")).trim() : null;
  const language = getCol("Language") ? String(getCol("Language")).trim().toLowerCase() : null;
  const client_name = getCol("Nom") ? String(getCol("Nom")).trim() : null;
  const client_email = getCol("Email") ? String(getCol("Email")).trim() : null;
  const client_phone = getCol("Phone") ? String(getCol("Phone")).trim() : null;
  const address = getCol("Lieu Event") ? String(getCol("Lieu Event")).trim() : null;
  const pack_id = getCol("Pack") ? String(getCol("Pack")).trim() : null;
  const total_cents = parseCents(getCol("Total"));
  const transport_fee_cents = parseCents(getCol("Transport (€)"));
  const deposit_cents = parseCents(getCol("Acompte"));
  const balance_due_cents = parseCents(getCol("Solde Restant"));
  const student_name = getCol("Etudiant") ? String(getCol("Etudiant")).trim() : null;
  const student_hours = parseNumber(getCol("Heures Etudiant"));
  const student_rate_cents = parseCents(getCol("Etudiant €/Event"));
  const km_one_way = parseNumber(getCol("KM (Aller)"));
  const km_total = parseNumber(getCol("KM (Total)"));
  const fuel_cost_cents = parseCents(getCol("Coût Essence"));
  const commercial_name = getCol("Commercial") ? String(getCol("Commercial")).trim() : null;
  const commercial_commission_cents = parseCents(getCol("Comm Commercial"));
  const gross_margin_cents = parseCents(getCol("Marge Brut (Event)"));
  const deposit_invoice_ref = getCol("Acompte Facture") ? String(getCol("Acompte Facture")).trim() : null;
  const balance_invoice_ref = getCol("Solde Facture") ? String(getCol("Solde Facture")).trim() : null;
  const guest_count = parseNumber(getCol("Invités"));

  return {
    id,
    event_date,
    event_type,
    language,
    client_name,
    client_email,
    client_phone,
    zone_id: null,
    status: "active",
    total_cents,
    transport_fee_cents,
    deposit_cents,
    balance_due_cents,
    balance_status: null,
    pack_id,
    address,
    on_site_contact: null,
    guest_count,
    created_at: null,
    updated_at: null,
    student_name,
    student_hours,
    student_rate_cents,
    km_one_way,
    km_total,
    fuel_cost_cents,
    commercial_name,
    commercial_commission_cents,
    gross_margin_cents,
    deposit_invoice_ref,
    balance_invoice_ref,
    invoice_deposit_paid: null,
    invoice_balance_paid: null,
    closing_date: null,
  };
}

type SheetsStore = {
  // Clients state
  clientsRows: unknown[][];
  clientsHeaders: string[];
  events: EventRow[]; // Mapped from clientsRows
  
  // Stats state
  statsRows: unknown[][];
  statsHeaders: string[];
  
  // Students state
  studentsRows: unknown[][];
  studentsHeaders: string[];
  
  // Global state
  isLoading: boolean;
  error: string | null;
  lastSyncAt: number | null;
  loaded: boolean;
  
  // Dirty state for optimistic updates
  dirtyByEventId: Record<string, Record<string, unknown>>;

  // Actions
  loadAll: (options?: { force?: boolean }) => Promise<void>;
  refresh: () => Promise<void>;
  updateLocal: (eventId: string, patch: Record<string, unknown>) => void;
  saveEvent: (eventId: string) => Promise<void>;
  applyEventPatch: (eventId: string, patch: Record<string, unknown>) => void;
  applyEventReplace: (event: EventRow) => void;
  removeEvent: (eventId: string) => void;
  clearDirty: (eventId: string) => void;
  isDirty: (eventId: string) => boolean;
  hasAnyDirty: () => boolean;
  getLocalEvent: (eventId: string) => EventRow | null;
  
  // Helpers
  getCell: (sheet: "clients" | "stats" | "students", rowIndex: number, headerName: string) => unknown;
  findRowByDate: (sheet: "stats", date: string) => unknown[] | null;
};

export const useSheetsStore = create<SheetsStore>((set, get) => ({
  clientsRows: [],
  clientsHeaders: [],
  events: [],
  statsRows: [],
  statsHeaders: [],
  studentsRows: [],
  studentsHeaders: [],
  isLoading: false,
  error: null,
  lastSyncAt: null,
  loaded: false,
  dirtyByEventId: {},

  loadAll: async (options = {}) => {
    // ATOMIC GUARD: Prevent race conditions from concurrent calls
    const state = get();
    if (!options.force && (state.loaded || state.isLoading)) return;

    // Set loading IMMEDIATELY to block concurrent calls
    set({ isLoading: true, error: null });

    // Double-check after setting (belt-and-suspenders for concurrent calls)
    // This catches the rare case where two calls pass the first guard simultaneously
    await Promise.resolve(); // Yield to allow other calls to see isLoading=true
    if (!options.force && get().loaded) {
      set({ isLoading: false });
      return;
    }

    try {
      // Fetch Clients, Stats and Students in parallel
      const [clientsRes, statsRes, studentsRes] = await Promise.all([
        fetch("/api/gas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "readSheet",
            data: { sheetName: "Clients" },
          }),
        }),
        fetch("/api/gas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "readSheet",
            data: { sheetName: "Stats" },
          }),
        }),
        fetch("/api/gas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "readSheet",
            data: { sheetName: "Students" },
          }),
        }),
      ]);

      if (!clientsRes.ok || !statsRes.ok || !studentsRes.ok) {
        const clientsError = !clientsRes.ok ? await clientsRes.json().catch(() => ({})) : null;
        const statsError = !statsRes.ok ? await statsRes.json().catch(() => ({})) : null;
        const studentsError = !studentsRes.ok ? await studentsRes.json().catch(() => ({})) : null;
        throw new Error(
          clientsError?.error?.message || statsError?.error?.message || studentsError?.error?.message || "Erreur de chargement"
        );
      }

      const clientsData = await clientsRes.json();
      const statsData = await statsRes.json();
      const studentsData = await studentsRes.json();

      if (!clientsData.ok || !statsData.ok || !studentsData.ok) {
        throw new Error(
          clientsData.error?.message || statsData.error?.message || studentsData.error?.message || "Erreur de chargement"
        );
      }

      // Parse Clients
      const clientsValues = clientsData.data?.values || clientsData.data;
      if (!Array.isArray(clientsValues) || clientsValues.length === 0) {
        throw new Error("Aucune donnée Clients retournée");
      }

      const clientsHeaders = (clientsValues[0] as string[]).map((h) => String(h).trim());
      const clientsDataRows = clientsValues.slice(1) as unknown[][];

      console.log("[SheetsStore] Clients headers:", clientsHeaders);
      console.log("[SheetsStore] Clients rows count:", clientsDataRows.length);
      if (clientsDataRows.length > 0) {
        console.log("[SheetsStore] First row sample:", clientsDataRows[0]);
      }

      const events = clientsDataRows
        .map((row, idx) => {
          const event = mapClientsRowToEventRow(clientsHeaders, row, idx);
          if (!event && idx < 3) {
            console.log(`[SheetsStore] Row ${idx} skipped:`, row);
          }
          return event;
        })
        .filter((event): event is EventRow => event !== null)
        .sort((a, b) => {
          if (!a.event_date && !b.event_date) return 0;
          if (!a.event_date) return 1;
          if (!b.event_date) return -1;
          return a.event_date.localeCompare(b.event_date);
        });

      console.log("[SheetsStore] Events parsed:", events.length);
      if (events.length > 0) {
        console.log("[SheetsStore] First event:", events[0]);
        console.log("[SheetsStore] First event student_name:", events[0].student_name);
        console.log("[SheetsStore] Events with student_name:", events.filter(e => e.student_name).length);
      }

      // Parse Stats (peut être vide, pas grave)
      const statsValues = statsData.data?.values || statsData.data;
      if (!Array.isArray(statsValues) || statsValues.length === 0) {
        console.warn("[SheetsStore] Aucune donnée Stats retournée");
      }

      const statsHeaders = (statsValues[0] as string[]).map((h) => String(h).trim());
      const statsDataRows = statsValues.slice(1) as unknown[][];

      // Parse Students
      const studentsValues = studentsData.data?.values || studentsData.data;
      if (!Array.isArray(studentsValues) || studentsValues.length === 0) {
        console.warn("[SheetsStore] Aucune donnée Students retournée");
      }

      const studentsHeaders = studentsValues.length > 0 
        ? (studentsValues[0] as string[]).map((h) => String(h).trim())
        : [];
      const studentsDataRows = studentsValues.length > 1 
        ? studentsValues.slice(1) as unknown[][]
        : [];

      set({
        clientsRows: clientsDataRows,
        clientsHeaders,
        events,
        statsRows: statsDataRows,
        statsHeaders,
        studentsRows: studentsDataRows,
        studentsHeaders,
        isLoading: false,
        error: null,
        lastSyncAt: Date.now(),
        loaded: true,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Erreur de chargement",
        loaded: true, // Mark as loaded to prevent infinite retries
      });
    }
  },

  refresh: async () => {
    const state = get();
    if (state.hasAnyDirty()) {
      const confirmed = window.confirm(
        "Vous avez des modifications non sauvegardées. Voulez-vous continuer ? Elles seront perdues."
      );
      if (!confirmed) return;
    }

    await get().loadAll({ force: true });
    set({ dirtyByEventId: {} }); // Clear dirty states after refresh
  },

  updateLocal: (eventId: string, patch: Record<string, unknown>) => {
    const state = get();
    const currentDirty = state.dirtyByEventId[eventId] || {};
    const newDirty = { ...currentDirty, ...patch };

    const updatedEvents = state.events.map((row: EventRow) => {
      if (row.id !== eventId) return row;
      const originalRow = state.events.find((r: EventRow) => r.id === eventId);
      if (!originalRow) return row;
      return { ...originalRow, ...patch };
    });

    set({
      events: updatedEvents,
      dirtyByEventId: {
        ...state.dirtyByEventId,
        [eventId]: newDirty,
      },
    });
  },

  saveEvent: async (eventId: string) => {
    const state = get();
    const dirtyPatch = state.dirtyByEventId[eventId];
    if (!dirtyPatch || Object.keys(dirtyPatch).length === 0) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Convert EventRow fields -> Sheet column names
      const eventRowToSheetValues = (patch: Record<string, unknown>): Record<string, unknown> => {
        const centsToEuro = (cents: number | null | undefined): string => {
          if (cents === null || cents === undefined) return "";
          const euros = cents / 100;
          return euros.toFixed(2).replace(".", ",");
        };

        const formatNumber = (num: number | null | undefined): string => {
          if (num === null || num === undefined) return "";
          return num.toString().replace(".", ",");
        };

        const result: Record<string, unknown> = {};
        const mapping: Record<string, (value: unknown) => Record<string, unknown>> = {
          client_name: (v) => ({ "Nom": v || "" }),
          client_email: (v) => ({ "Email": v || "" }),
          client_phone: (v) => ({ "Phone": v || "" }),
          event_date: (v) => ({ "Date Event": v || "" }),
          event_type: (v) => ({ "Type Event": v || "" }),
          language: (v) => ({ "Language": v || "" }),
          address: (v) => ({ "Lieu Event": v || "" }),
          pack_id: (v) => ({ "Pack": v || "" }),
          total_cents: (v) => ({ "Total": centsToEuro(v as number | null) }),
          transport_fee_cents: (v) => ({ "Transport (€)": centsToEuro(v as number | null) }),
          deposit_cents: (v) => ({ "Acompte": centsToEuro(v as number | null) }),
          balance_due_cents: (v) => ({ "Solde Restant": centsToEuro(v as number | null) }),
          student_name: (v) => ({ "Etudiant": v || "" }),
          student_hours: (v) => ({ "Heures Etudiant": formatNumber(v as number | null) }),
          student_rate_cents: (v) => ({ "Etudiant €/Event": centsToEuro(v as number | null) }),
          km_one_way: (v) => ({ "KM (Aller)": formatNumber(v as number | null) }),
          km_total: (v) => ({ "KM (Total)": formatNumber(v as number | null) }),
          fuel_cost_cents: (v) => ({ "Coût Essence": centsToEuro(v as number | null) }),
          commercial_name: (v) => ({ "Commercial": v || "" }),
          commercial_commission_cents: (v) => ({ "Comm Commercial": centsToEuro(v as number | null) }),
          gross_margin_cents: (v) => ({ "Marge Brut (Event)": centsToEuro(v as number | null) }),
          deposit_invoice_ref: (v) => ({ "Acompte Facture": v || "" }),
          balance_invoice_ref: (v) => ({ "Solde Facture": v || "" }),
          guest_count: (v) => ({ "Invités": formatNumber(v as number | null) }),
        };

        for (const [key, value] of Object.entries(patch)) {
          const mapper = mapping[key];
          if (mapper) {
            Object.assign(result, mapper(value));
          }
        }

        return result;
      };

      const sheetValues = eventRowToSheetValues(dirtyPatch);

      const res = await fetch("/api/gas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateRowByEventId",
          data: {
            eventId,
            values: sheetValues,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Erreur de sauvegarde");
      }

      const response = await res.json();
      if (!response.ok) {
        throw new Error(response.error?.message || "Erreur de sauvegarde");
      }

      const newDirtyByEventId = { ...state.dirtyByEventId };
      delete newDirtyByEventId[eventId];

      set({
        dirtyByEventId: newDirtyByEventId,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Erreur de sauvegarde",
      });
      throw err;
    }
  },

  applyEventPatch: (eventId: string, patch: Record<string, unknown>) => {
    const state = get();
    const updatedEvents = state.events.map((row) => {
      if (row.id !== eventId) return row;
      return { ...row, ...patch };
    });
    set({ events: updatedEvents });
  },

  applyEventReplace: (event: EventRow) => {
    const state = get();
    const updatedEvents = state.events.map((row) => {
      if (row.id === event.id) return event;
      return row;
    });
    if (!updatedEvents.find((r) => r.id === event.id)) {
      updatedEvents.push(event);
      updatedEvents.sort((a, b) => {
        if (!a.event_date && !b.event_date) return 0;
        if (!a.event_date) return 1;
        if (!b.event_date) return -1;
        return a.event_date.localeCompare(b.event_date);
      });
    }
    set({ events: updatedEvents });
  },

  removeEvent: (eventId: string) => {
    const state = get();
    const updatedEvents = state.events.filter((row) => row.id !== eventId);
    const newDirtyByEventId = { ...state.dirtyByEventId };
    delete newDirtyByEventId[eventId];
    set({ events: updatedEvents, dirtyByEventId: newDirtyByEventId });
  },

  clearDirty: (eventId: string) => {
    const state = get();
    const newDirtyByEventId = { ...state.dirtyByEventId };
    delete newDirtyByEventId[eventId];
    set({ dirtyByEventId: newDirtyByEventId });
  },

  isDirty: (eventId: string) => {
    const state = get();
    const dirty = state.dirtyByEventId[eventId];
    return dirty ? Object.keys(dirty).length > 0 : false;
  },

  hasAnyDirty: () => {
    const state = get();
    return Object.keys(state.dirtyByEventId).some(
      (eventId: string) => Object.keys(state.dirtyByEventId[eventId] || {}).length > 0
    );
  },

  getLocalEvent: (eventId: string) => {
    const state = get();
    return state.events.find((r: EventRow) => r.id === eventId) || null;
  },

  getCell: (sheet: "clients" | "stats" | "students", rowIndex: number, headerName: string) => {
    const state = get();
    const headers = sheet === "clients" ? state.clientsHeaders : sheet === "stats" ? state.statsHeaders : state.studentsHeaders;
    const rows = sheet === "clients" ? state.clientsRows : sheet === "stats" ? state.statsRows : state.studentsRows;
    
    const headerIndex = headers.findIndex((h) => String(h).trim() === headerName);
    if (headerIndex < 0 || rowIndex >= rows.length) return null;
    
    return rows[rowIndex]?.[headerIndex] ?? null;
  },

  findRowByDate: (sheet: "stats", date: string) => {
    const state = get();
    if (sheet !== "stats") return null;
    
    const dateIndex = state.statsHeaders.findIndex((h) => String(h).trim() === "Date");
    if (dateIndex < 0) return null;
    
    for (const row of state.statsRows) {
      const rowDate = String(row[dateIndex] || "").trim();
      if (rowDate === date) return row;
    }
    
    return null;
  },
}));
