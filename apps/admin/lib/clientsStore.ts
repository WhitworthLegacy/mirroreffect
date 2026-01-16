"use client";

import { create } from "zustand";
import type { EventRow } from "./adminData";

/**
 * Mapping des colonnes Sheets vers EventRow
 * Basé sur mapClientsRowToEventRow de googleSheets.ts
 */
function mapClientsRowToEventRow(headers: string[], row: unknown[]): EventRow | null {
  const getCol = (label: string): unknown => {
    const idx = headers.findIndex((h) => String(h).trim() === label);
    return idx >= 0 ? row[idx] : null;
  };

  // Helper to convert string to number (cents) - les valeurs dans Clients sont en euros avec virgule
  // Format supporté: "1.234,56" ou "1234,56" (format européen)
  const parseCents = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    let num: number;
    if (typeof value === "string") {
      // Gérer le format européen: points comme séparateurs de milliers, virgule comme décimale
      const cleaned = value.trim().replace(/\s/g, "");
      if (cleaned.includes(",")) {
        // Enlever les points (séparateurs de milliers) et remplacer la virgule par un point
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

  // Helper to convert string to number
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

  // Helper to format date
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${("0" + m[2]).slice(-2)}-${("0" + m[1]).slice(-2)}`;
    return str;
  };

  const eventId = getCol("Event ID");
  if (!eventId) return null;

  const id = String(eventId);
  const event_date = formatDate(getCol("Date Event"));
  const event_type = getCol("Type Event") ? String(getCol("Type Event")).trim() : null;
  const language = getCol("Language") ? String(getCol("Language")).trim().toLowerCase() : null;
  const client_name = getCol("Nom") ? String(getCol("Nom")).trim() : null;
  const client_email = getCol("Email") ? String(getCol("Email")).trim() : null;
  const client_phone = getCol("Phone") ? String(getCol("Phone")).trim() : null;
  const address = getCol("Lieu Event") ? String(getCol("Lieu Event")).trim() : null;
  const pack_id = getCol("Pack") ? String(getCol("Pack")).trim() : null;
  const total_cents = parseCents(getCol("Pack (€)"));
  const transport_fee_cents = parseCents(getCol("Transport (€)"));
  const deposit_cents = parseCents(getCol("Acompte"));
  const balance_due_cents = parseCents(getCol("Solde Restant"));
  const student_name = getCol("Etudiant") ? String(getCol("Etudiant")).trim() : null;
  const student_hours = parseNumber(getCol("Heures Etudiant"));
  const student_rate_cents = 1400; // Taux par défaut
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

/**
 * Mapping EventRow -> colonnes Sheets (pour updateRowByEventId)
 * Convertit les valeurs en format Sheets (euros avec virgule, etc.)
 */
function eventRowToSheetValues(patch: Record<string, unknown>): Record<string, unknown> {
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

  // Mapping des champs EventRow vers noms de colonnes Sheets
  const mapping: Record<string, (value: unknown) => unknown> = {
    client_name: (v) => ({ "Nom": v || "" }),
    client_email: (v) => ({ "Email": v || "" }),
    client_phone: (v) => ({ "Phone": v || "" }),
    event_date: (v) => ({ "Date Event": v || "" }),
    event_type: (v) => ({ "Type Event": v || "" }),
    language: (v) => ({ "Language": v || "" }),
    address: (v) => ({ "Lieu Event": v || "" }),
    pack_id: (v) => ({ "Pack": v || "" }),
    total_cents: (v) => ({ 
      "Pack (€)": centsToEuro(v as number | null), // Gardé pour compatibilité
      "Total": centsToEuro(v as number | null) // ✅ Header exact
    }),
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
}

type ClientsStore = {
  // State
  rows: EventRow[];
  headers: string[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  lastLoadedAt: number | null; // timestamp de dernière sync
  dirtyByEventId: Record<string, Record<string, unknown>>; // patch cumulatif par eventId

  // Actions
  loadClients: () => Promise<void>;
  loadOnce: () => Promise<void>; // charge uniquement si pas déjà chargé
  refreshClients: () => Promise<boolean>; // retourne true si refresh effectué, false si annulé
  updateLocal: (eventId: string, patch: Record<string, unknown>) => void;
  saveEvent: (eventId: string) => Promise<void>;
  applyEventPatch: (eventId: string, patch: Record<string, unknown>) => void; // optimistic update après save
  applyEventReplace: (event: EventRow) => void; // remplace un event complet
  removeEvent: (eventId: string) => void; // supprime un event
  clearDirty: (eventId: string) => void;
  isDirty: (eventId: string) => boolean;
  hasAnyDirty: () => boolean;
  getLocalEvent: (eventId: string) => EventRow | null;
};

export const useClientsStore = create<ClientsStore>((set, get) => ({
  rows: [],
  headers: [],
  loading: false,
  error: null,
  loaded: false,
  lastLoadedAt: null,
  dirtyByEventId: {},

  loadOnce: async () => {
    const state = get();
    // Ne charger qu'une seule fois si déjà chargé
    if (state.loaded || state.loading) return;
    // Sinon appeler loadClients
    await get().loadClients();
  },

  loadClients: async () => {
    const state = get();
    // Ne pas recharger si déjà en cours
    if (state.loading) return;

    set({ loading: true, error: null });

    try {
      const res = await fetch("/api/gas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "readSheet",
          data: { sheetName: "Clients" },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Erreur de chargement");
      }

      const response = await res.json();
      if (!response.ok) {
        throw new Error(response.error?.message || "Erreur de chargement");
      }

      // GAS retourne { values: [...] } où la première ligne est headers
      const values = response.data?.values || response.data;
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error("Aucune donnée retournée");
      }

      const headers = (values[0] as string[]).map((h) => String(h).trim());
      const dataRows = values.slice(1) as unknown[][];

      const rows = dataRows
        .map((row) => mapClientsRowToEventRow(headers, row))
        .filter((event): event is EventRow => event !== null)
        .sort((a, b) => {
          if (!a.event_date && !b.event_date) return 0;
          if (!a.event_date) return 1;
          if (!b.event_date) return -1;
          return a.event_date.localeCompare(b.event_date);
        });

      set({
        rows,
        headers,
        loading: false,
        error: null,
        loaded: true,
        lastLoadedAt: Date.now(),
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Erreur de chargement",
        loaded: true, // Marquer comme chargé même en cas d'erreur pour éviter de retenter
      });
    }
  },

  refreshClients: async () => {
    const state = get();

    // Vérifier s'il y a des changements non sauvegardés
    if (state.hasAnyDirty()) {
      const confirmed = window.confirm(
        "Vous avez des modifications non sauvegardées. Voulez-vous continuer ? Elles seront perdues."
      );
      if (!confirmed) {
        return false;
      }
    }

    set({ loading: true, error: null });

    try {
      const res = await fetch("/api/gas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "readSheet",
          data: { sheetName: "Clients" },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Erreur de rechargement");
      }

      const response = await res.json();
      if (!response.ok) {
        throw new Error(response.error?.message || "Erreur de rechargement");
      }

      const values = response.data?.values || response.data;
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error("Aucune donnée retournée");
      }

      const headers = (values[0] as string[]).map((h) => String(h).trim());
      const dataRows = values.slice(1) as unknown[][];

      const rows = dataRows
        .map((row) => mapClientsRowToEventRow(headers, row))
        .filter((event): event is EventRow => event !== null)
        .sort((a, b) => {
          if (!a.event_date && !b.event_date) return 0;
          if (!a.event_date) return 1;
          if (!b.event_date) return -1;
          return a.event_date.localeCompare(b.event_date);
        });

      set({
        rows,
        headers,
        loading: false,
        error: null,
        lastLoadedAt: Date.now(),
        dirtyByEventId: {}, // Nettoyer les dirty states
      });

      return true;
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Erreur de rechargement",
      });
      return false;
    }
  },

  updateLocal: (eventId: string, patch: Record<string, unknown>) => {
    const state = get();
    const currentDirty = state.dirtyByEventId[eventId] || {};
    const newDirty = { ...currentDirty, ...patch };

    // Mettre à jour le row local avec le patch cumulatif
    const updatedRows = state.rows.map((row: EventRow) => {
      if (row.id !== eventId) return row;
      // Appliquer le patch sur la row originale (sans tenir compte des dirty précédents)
      // On reconstruit depuis l'original + le nouveau patch
      const originalRow = state.rows.find((r: EventRow) => r.id === eventId);
      if (!originalRow) return row;
      // On applique le patch sur l'original
      const patched = { ...originalRow, ...patch };
      return patched;
    });

    set({
      rows: updatedRows,
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
      return; // Rien à sauvegarder
    }

    set({ loading: true, error: null });

    try {
      // Convertir le patch EventRow -> colonnes Sheets
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

      // Nettoyer le dirty state pour cet eventId
      const newDirtyByEventId = { ...state.dirtyByEventId };
      delete newDirtyByEventId[eventId];

      // Mettre à jour les rows localement (les valeurs sont maintenant persistées)
      // Le row local est déjà à jour via updateLocal, on nettoie juste le dirty
      set({
        dirtyByEventId: newDirtyByEventId,
        loading: false,
        error: null,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Erreur de sauvegarde",
      });
      throw err;
    }
  },

  applyEventPatch: (eventId: string, patch: Record<string, unknown>) => {
    const state = get();
    const updatedRows = state.rows.map((row) => {
      if (row.id !== eventId) return row;
      return { ...row, ...patch };
    });
    set({ rows: updatedRows });
  },

  applyEventReplace: (event: EventRow) => {
    const state = get();
    const updatedRows = state.rows.map((row) => {
      if (row.id !== event.id) return row;
      return event;
    });
    // Si l'event n'existe pas, l'ajouter
    if (!updatedRows.find((r) => r.id === event.id)) {
      updatedRows.push(event);
      updatedRows.sort((a, b) => {
        if (!a.event_date && !b.event_date) return 0;
        if (!a.event_date) return 1;
        if (!b.event_date) return -1;
        return a.event_date.localeCompare(b.event_date);
      });
    }
    set({ rows: updatedRows });
  },

  removeEvent: (eventId: string) => {
    const state = get();
    const updatedRows = state.rows.filter((row) => row.id !== eventId);
    const newDirtyByEventId = { ...state.dirtyByEventId };
    delete newDirtyByEventId[eventId];
    set({ rows: updatedRows, dirtyByEventId: newDirtyByEventId });
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
    return state.rows.find((r: EventRow) => r.id === eventId) || null;
  },
}));
