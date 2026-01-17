/**
 * Tracking helpers pour Leads et CTAs
 * - Captures UTM parameters au chargement
 * - Gère lead_id dans sessionStorage
 * - Track les étapes et CTAs dans Google Sheets "Leads"
 */

const LEAD_ID_KEY = "mirroreffect_lead_id";
const UTM_KEY = "me_utms"; // localStorage key

type UTMParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

/**
 * Capture et stocke les UTM parameters depuis l'URL dans localStorage
 * À appeler au premier chargement de la page
 */
export function captureUTMParams(): UTMParams {
  if (typeof window === "undefined") {
    return {};
  }

  // Vérifier si déjà enregistrés dans localStorage
  const existing = localStorage.getItem(UTM_KEY);
  if (existing) {
    try {
      return JSON.parse(existing) as UTMParams;
    } catch {
      // Si invalide, continuer pour récupérer depuis URL
    }
  }

  // Parser window.location.search
  const params = new URLSearchParams(window.location.search);
  const utm: UTMParams = {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined
  };

  // Stocker seulement si au moins un paramètre existe
  if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
    if (process.env.NODE_ENV !== "production") {
      console.warn("[tracking] UTM captured and stored in localStorage:", utm);
    }
  }

  return utm;
}

/**
 * Récupère les UTM parameters stockés depuis localStorage
 */
export function getUTMParams(): UTMParams {
  if (typeof window === "undefined") {
    return {};
  }

  const stored = localStorage.getItem(UTM_KEY);
  if (!stored) {
    return {};
  }

  try {
    return JSON.parse(stored) as UTMParams;
  } catch {
    return {};
  }
}

/**
 * Récupère le lead_id depuis localStorage
 */
export function getLeadId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(LEAD_ID_KEY);
}

/**
 * Stocke le lead_id dans localStorage
 */
export function setLeadId(leadId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(LEAD_ID_KEY, leadId);
  if (process.env.NODE_ENV !== "production") {
    console.warn("[tracking] Lead ID stored in localStorage:", leadId);
  }
}

/**
 * Normalise une date DD/MM/YYYY vers YYYY-MM-DD
 * Accepte aussi YYYY-MM-DD (retourne tel quel)
 */
export function normalizeDateToISO(dateStr: string | undefined | null): string | null {
  if (!dateStr) {
    return null;
  }

  const trimmed = dateStr.trim();

  // Si déjà au format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Si format DD/MM/YYYY
  const ddmm = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(trimmed);
  if (ddmm) {
    const day = ddmm[1].padStart(2, "0");
    const month = ddmm[2].padStart(2, "0");
    const year = ddmm[3];
    return `${year}-${month}-${day}`;
  }

  // Si format date HTML (input type="date")
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("[tracking] Date format not recognized:", dateStr);
  }

  return null;
}

/**
 * Track une étape dans Leads
 * - Si lead_id existe, met à jour la ligne existante
 * - Sinon, crée une nouvelle ligne
 */
export async function trackLeadStep(
  stepNumber: number,
  status: string,
  partialPayload: {
    language: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    event_date: string;
    address: string;
    pack_code?: string;
    guests?: string;
    transport_euros?: string;
    total_euros?: string;
    deposit_euros?: string;
  }
): Promise<string | null> {
  const leadId = getLeadId();
  const utm = getUTMParams();

  // Normaliser la date
  const eventDateIso = normalizeDateToISO(partialPayload.event_date);
  if (!eventDateIso) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[tracking] Invalid date format, skipping lead tracking:", partialPayload.event_date);
    }
    return null;
  }

  const payload = {
    lead_id: leadId || undefined,
    language: partialPayload.language,
    client_name: partialPayload.client_name,
    client_email: partialPayload.client_email,
    client_phone: partialPayload.client_phone,
    event_date: eventDateIso,
    address: partialPayload.address,
    pack_code: partialPayload.pack_code || "",
    guests: partialPayload.guests || "",
    transport_euros: partialPayload.transport_euros || "",
    total_euros: partialPayload.total_euros || "",
    deposit_euros: partialPayload.deposit_euros || "",
    utm_source: utm.utm_source || "",
    utm_campaign: utm.utm_campaign || "",
    utm_medium: utm.utm_medium || "",
    step: stepNumber.toString(),
    status
  };

  try {
    const res = await fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "unknown" }));
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[tracking] Lead tracking failed (${res.status}):`, error);
      }
      return null;
    }

    const data = (await res.json()) as { lead_id?: string };
    const returnedLeadId = data.lead_id || leadId;

    if (returnedLeadId && !leadId) {
      setLeadId(returnedLeadId);
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn(`[tracking] Lead step ${stepNumber} tracked:`, returnedLeadId);
    }

    return returnedLeadId || null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[tracking] Lead tracking error:", error);
    }
    return null;
  }
}

/**
 * Track un CTA (Call To Action) - fire-and-forget, ne bloque jamais l'UX
 * Envoie event: "button_click" ou "cta_update" selon si on a un lead_id
 */
export async function trackCTA(
  ctaId: string,
  label: string,
  step: number,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const leadId = getLeadId();
  const utm = getUTMParams();

  // Si pas de lead_id, envoyer button_click qui sera loggé seulement
  const event = leadId ? "cta_update" : "button_click";

  const payload = {
    event,
    step: step.toString(),
    buttonLabel: label,
    leadId: leadId || undefined,
    utm: utm.utm_source || utm.utm_medium || utm.utm_campaign ? {
      source: utm.utm_source,
      medium: utm.utm_medium,
      campaign: utm.utm_campaign
    } : undefined,
    // Champs pour cta_update si leadId existe
    lead_id: leadId || undefined,
    cta_id: ctaId,
    cta_label: label,
    cta_value: JSON.stringify(extra),
    updated_at: new Date().toISOString()
  };

  try {
    // Fire-and-forget: ne pas attendre la réponse, ne jamais throw
    void fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Ignorer silencieusement les erreurs réseau (fire-and-forget)
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[tracking] CTA tracking network error (ignored):`, ctaId);
      }
    });

    if (process.env.NODE_ENV !== "production") {
      console.warn(`[tracking] CTA tracked (fire-and-forget):`, { ctaId, label, step, event });
    }
  } catch (error) {
    // Ne jamais throw - ignorer silencieusement
    if (process.env.NODE_ENV !== "production") {
      console.warn("[tracking] CTA tracking error (ignored):", error);
    }
  }
}
