"use client";

import { create } from "zustand";
import type { EventRow } from "./adminData";
import { createSupabaseBrowserClient } from "./supabaseBrowser";

/**
 * Store unifié pour Events (Supabase)
 * Source unique de vérité pour les données admin
 * Stats gérées dans Google Sheets
 */

// Mapping Supabase event row -> EventRow format (simplified)
function mapSupabaseEventToEventRow(row: Record<string, unknown>): EventRow {
  const toInt = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : Math.round(num);
  };

  return {
    id: String(row.event_id || row.id || ""),
    event_date: row.event_date ? String(row.event_date) : null,
    event_type: row.event_type ? String(row.event_type) : null,
    language: row.language ? String(row.language).toLowerCase() : null,
    client_name: row.client_name ? String(row.client_name) : null,
    client_email: row.client_email ? String(row.client_email) : null,
    client_phone: row.client_phone ? String(row.client_phone) : null,
    status: row.status ? String(row.status) : "active",
    total_cents: toInt(row.total_cents),
    transport_fee_cents: toInt(row.transport_fee_cents),
    deposit_cents: toInt(row.deposit_cents),
    balance_due_cents: toInt(row.balance_due_cents),
    balance_status: row.balance_status ? String(row.balance_status) : null,
    pack_id: row.pack_id ? String(row.pack_id) : null,
    address: row.address ? String(row.address) : null,
    guest_count: toInt(row.guest_count),
    created_at: row.created_at ? String(row.created_at) : null,
    updated_at: row.updated_at ? String(row.updated_at) : null,
    student_name: row.student_name ? String(row.student_name) : null,
    commercial_name: row.commercial_name ? String(row.commercial_name) : null,
    closing_date: row.closing_date ? String(row.closing_date) : null,
  };
}

type SheetsStore = {
  // Events state (from Supabase)
  events: EventRow[];

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
};

export const useSheetsStore = create<SheetsStore>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  lastSyncAt: null,
  loaded: false,
  dirtyByEventId: {},

  loadAll: async (options = {}) => {
    // ATOMIC GUARD: Empêcher les appels concurrents
    const state = get();
    if (!options.force && (state.loaded || state.isLoading)) return;

    set({ isLoading: true, error: null });

    // Double-vérification après le set
    await Promise.resolve();
    if (!options.force && get().loaded) {
      set({ isLoading: false });
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        throw new Error("Supabase non configuré");
      }

      // Charger les events depuis Supabase
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (eventsError) {
        throw new Error(eventsError.message);
      }

      const events = (eventsData as Record<string, unknown>[]).map(mapSupabaseEventToEventRow);
      console.log("[SheetsStore] Events chargés depuis Supabase:", events.length);

      set({
        events,
        isLoading: false,
        error: null,
        lastSyncAt: Date.now(),
        loaded: true,
      });
    } catch (err) {
      console.error("[SheetsStore] Erreur:", err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Erreur de chargement",
        loaded: true,
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
    set({ dirtyByEventId: {} });
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
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase non configuré");
      }

      // Simplified fields for Supabase update
      const eventRowToSupabase = (patch: Record<string, unknown>): Record<string, unknown> => {
        const result: Record<string, unknown> = {};

        const allowedFields = [
          "client_name",
          "client_email",
          "client_phone",
          "event_date",
          "event_type",
          "language",
          "address",
          "pack_id",
          "guest_count",
          "student_name",
          "commercial_name",
          "status",
          "balance_status",
          "closing_date",
          "total_cents",
          "transport_fee_cents",
          "deposit_cents",
          "balance_due_cents",
        ];

        for (const [key, value] of Object.entries(patch)) {
          if (allowedFields.includes(key)) {
            result[key] = value;
          }
        }

        result.updated_at = new Date().toISOString();
        return result;
      };

      const supabaseValues = eventRowToSupabase(dirtyPatch);

      const { error } = await supabase
        .from("events")
        .update(supabaseValues)
        .eq("event_id", eventId);

      if (error) throw error;

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
}));
