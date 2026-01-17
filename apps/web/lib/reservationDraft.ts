/**
 * Helper pour persister le draft de réservation dans localStorage
 * Clé: me_reservation_draft_v1
 */

const DRAFT_KEY = "me_reservation_draft";
const LEGACY_DRAFT_KEY = "me_reservation_draft_v1";

export type ReservationDraft = {
  leadId?: string;
  step: number;
  customer: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    language?: "fr" | "nl";
  };
  event: {
    eventType?: string;
    dateEvent?: string;
    lieuEvent?: string;
    address?: string; // Alias pour lieuEvent (pour compatibilité)
    pack?: string;
    invites?: string;
    transport?: number;
    total?: number;
    acompte?: number;
    zone?: "BE" | "FR_NORD";
  };
  selections: {
    vibe?: string;
    theme?: string;
    priority?: string;
    options?: string[];
    stanchionsEnabled?: boolean;
    stanchionsColor?: "GOLD" | "SILVER";
  };
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
};

type PartialDraft = Partial<ReservationDraft> & {
  step?: number;
  timestamps?: {
    createdAt?: string;
    updatedAt?: string;
  };
};

/**
 * Récupère le draft depuis localStorage
 */
export function getDraft(): ReservationDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const primary = localStorage.getItem(DRAFT_KEY);
    const fallback = localStorage.getItem(LEGACY_DRAFT_KEY);
    const stored = primary || fallback;
    if (!stored) {
      return null;
    }

    if (!primary && fallback) {
      localStorage.setItem(DRAFT_KEY, fallback);
    }

    const parsed = JSON.parse(stored) as ReservationDraft;
    
    // Valider la structure de base
    if (typeof parsed.step !== "number" || !parsed.timestamps) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Sauvegarde un draft complet dans localStorage
 */
export function setDraft(draft: ReservationDraft): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const now = new Date().toISOString();
    const draftWithTimestamps: ReservationDraft = {
      ...draft,
      timestamps: {
        createdAt: draft.timestamps?.createdAt || now,
        updatedAt: now
      }
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftWithTimestamps));
    localStorage.removeItem(LEGACY_DRAFT_KEY);

    if (process.env.NODE_ENV !== "production") {
      console.warn("[reservationDraft] Draft saved:", { step: draft.step, updatedAt: now });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[reservationDraft] Failed to save draft:", error);
    }
  }
}

/**
 * Merge un partial draft avec le draft existant
 */
export function persistDraft(partialUpdate: PartialDraft): void {
  if (typeof window === "undefined") {
    return;
  }

  const existing = getDraft();
  const now = new Date().toISOString();

  const merged: ReservationDraft = {
    leadId: partialUpdate.leadId ?? existing?.leadId,
    step: partialUpdate.step ?? existing?.step ?? 1,
    customer: {
      ...existing?.customer,
      ...partialUpdate.customer
    },
    event: {
      ...existing?.event,
      ...partialUpdate.event
    },
    selections: {
      ...existing?.selections,
      ...partialUpdate.selections
    },
    utm: {
      ...existing?.utm,
      ...partialUpdate.utm
    },
    timestamps: {
      createdAt: existing?.timestamps?.createdAt || now,
      updatedAt: now
    }
  };

  setDraft(merged);
}

/**
 * Supprime le draft (après paiement réussi)
 */
export function clearDraft(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(LEGACY_DRAFT_KEY);
    if (process.env.NODE_ENV !== "production") {
      console.warn("[reservationDraft] Draft cleared");
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[reservationDraft] Failed to clear draft:", error);
    }
  }
}

/**
 * Construit un objet draft depuis les valeurs du state ReservationFlow
 */
export function buildDraftFromState(state: {
  leadId?: string;
  step: number;
  eventType?: string;
  eventDate?: string;
  location?: string;
  zone?: "BE" | "FR_NORD";
  vibe?: string;
  theme?: string;
  guests?: string;
  priority?: string;
  firstName?: string;
  lastName?: string;
  leadEmail?: string;
  contactPhone?: string;
  packCode?: string;
  options?: string[];
  stanchionsEnabled?: boolean;
  stanchionsColor?: "GOLD" | "SILVER";
  transportFee?: number;
  totalPrice?: number | null;
  depositAmount?: number;
  language?: "fr" | "nl";
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}): ReservationDraft {
  const now = new Date().toISOString();
  
  return {
    leadId: state.leadId,
    step: state.step,
    customer: {
      firstName: state.firstName,
      lastName: state.lastName,
      email: state.leadEmail,
      phone: state.contactPhone,
      language: state.language || "fr"
    },
    event: {
      eventType: state.eventType,
      dateEvent: state.eventDate,
      lieuEvent: state.location,
      address: state.location,
      pack: state.packCode || undefined,
      invites: state.guests,
      transport: state.transportFee,
      total: state.totalPrice || undefined,
      acompte: state.depositAmount,
      zone: state.zone
    },
    selections: {
      vibe: state.vibe,
      theme: state.theme,
      priority: state.priority,
      options: state.options,
      stanchionsEnabled: state.stanchionsEnabled,
      stanchionsColor: state.stanchionsColor
    },
    utm: state.utm || {},
    timestamps: {
      createdAt: now,
      updatedAt: now
    }
  };
}
