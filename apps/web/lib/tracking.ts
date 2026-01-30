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
