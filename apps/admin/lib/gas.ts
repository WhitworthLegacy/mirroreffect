/**
 * Google Apps Script WebApp Client
 * 
 * Fonction robuste pour appeler GAS avec gestion des redirects et détection HTML.
 * Utilisée uniquement server-side (API routes / server actions).
 */



type GasPostOptions = {
  action?: string;
  key?: string;
  data?: unknown;
  [key: string]: unknown;
};

type GasResponse = {
  data?: unknown;
  error?: string;
  [key: string]: unknown;
};

export type GasError = {
  type: "HTML_RESPONSE" | "REDIRECT_FAILED" | "JSON_PARSE_ERROR" | "GAS_ERROR" | "NETWORK_ERROR";
  message: string;
  status: number;
  contentType: string;
  location?: string;
  preview?: string;
  url?: string;
};

/**
 * Valide et nettoie l'URL GAS (supprime les espaces, trailing slashes)
 */
function validateAndCleanUrl(url: string | undefined): string {
  if (!url) {
    throw new Error(
      "GAS_WEBAPP_URL is not configured. Please set it in your Vercel environment variables."
    );
  }

  // Trim whitespace et trailing slash
  const cleaned = url.trim().replace(/\/$/, "");
  
  if (!cleaned.startsWith("https://")) {
    throw new Error(`GAS_WEBAPP_URL must start with https://. Got: ${cleaned.substring(0, 50)}...`);
  }

  return cleaned;
}

/**
 * Valide que les variables d'environnement requises sont présentes
 */
function validateEnv(): { url: string; key: string } {
  const url = validateAndCleanUrl(process.env.GAS_WEBAPP_URL);
  const key = process.env.GAS_KEY;

  if (!key) {
    throw new Error(
      "GAS_KEY is not configured. Please set it in your Vercel environment variables."
    );
  }

  return { url, key };
}

/**
 * Appelle Google Apps Script WebApp avec gestion robuste des redirects
 * 
 * @param payload - Payload à envoyer (action, key, data, ou objet personnalisé)
 * @param requestId - Optional request ID for tracing (auto-generated if not provided)
 * @returns JSON parsé depuis la réponse GAS
 * @throws Error avec détails si HTML détecté, redirect échoué, ou erreur GAS
 */
/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function gasPost(
  payload: GasPostOptions,
  requestId?: string
): Promise<{ result: unknown; requestId: string; duration: number }> {
  const startTime = Date.now();
  const reqId = requestId || generateUUID();
  const { url } = validateEnv();

  // Construire le body JSON selon le format requis: { action, key, data }
  const bodyPayload = {
    action: payload.action,
    key: payload.key,
    data: payload.data,
  };
  const body = JSON.stringify(bodyPayload);

  try {
    // POST uniquement avec body JSON, pas de paramètres GET
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });

    // Lire le texte d'abord pour détecter HTML
    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";

    // Détecter HTML (commence par "<" ou content-type text/html) - y compris 405
    if (text.trim().startsWith("<") || contentType.includes("text/html")) {
      const preview = text.substring(0, 500);
      
      const error: GasError = {
        type: "HTML_RESPONSE",
        message: `GAS returned HTML instead of JSON (likely 405 Page Not Found - check GAS deployment and URL)`,
        status: response.status,
        contentType,
        preview,
        url: url,
      };

      console.error(`[GAS] ${reqId} HTML response detected:`, error);

      throw error;
    }

    // Parser le JSON
    let result: GasResponse;
    try {
      result = JSON.parse(text) as GasResponse;
    } catch (parseError) {
      const error: GasError = {
        type: "JSON_PARSE_ERROR",
        message: `GAS returned invalid JSON`,
        status: response.status,
        contentType,
        preview: text.substring(0, 200),
        url: url,
      };
      console.error(`[GAS] ${reqId} JSON parse error:`, error);
      throw error;
    }

    // Vérifier les erreurs dans la réponse GAS
    if (result.error) {
      const error: GasError = {
        type: "GAS_ERROR",
        message: result.error,
        status: response.status,
        contentType,
        url: url,
      };
      console.error(`[GAS] ${reqId} GAS error:`, error);
      throw error;
    }

    if (!response.ok) {
      const error: GasError = {
        type: "GAS_ERROR",
        message: `GAS request failed: ${response.status} ${response.statusText}`,
        status: response.status,
        contentType,
        url: url,
      };
      console.error(`[GAS] ${reqId} Request failed:`, error);
      throw error;
    }

    const duration = Date.now() - startTime;
    console.log(`[GAS] ${reqId} ${payload.action || "custom"} → ${response.status} (${duration}ms) [${url.substring(0, 50)}...]`);

    return { result, requestId: reqId, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Si c'est déjà un GasError, le relancer
    if (error && typeof error === "object" && "type" in error) {
      throw error;
    }

    // Sinon, wrapper dans GasError
    const gasError: GasError = {
      type: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
      status: 0,
      contentType: "",
      url: url,
    };
    console.error(`[GAS] ${reqId} Network error (${duration}ms):`, gasError);
    throw gasError;
  }
}

/**
 * Wrapper pour les appels admin (action + data + key automatique)
 * 
 * @param action - Action GAS (readSheet, appendRow, updateRow, etc.)
 * @param data - Données pour l'action
 * @param requestId - Optional request ID for tracing
 * @returns Données extraites de { data: ... } ou résultat brut
 */
export async function gasPostAdmin(
  action: string,
  data?: unknown,
  requestId?: string
): Promise<unknown> {
  const { key } = validateEnv();
  const { result } = await gasPost(
    {
      action,
      key,
      data,
    },
    requestId
  );
  
  // GAS retourne { data: ... } pour les actions admin
  if (result && typeof result === "object" && "data" in result) {
    return (result as { data: unknown }).data;
  }
  
  return result;
}
