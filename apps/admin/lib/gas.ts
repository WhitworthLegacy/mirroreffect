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

/**
 * Valide que les variables d'environnement requises sont présentes
 */
function validateEnv(): { url: string; key: string } {
  const url = process.env.GAS_WEBAPP_URL;
  const key = process.env.GAS_KEY;

  if (!url) {
    throw new Error(
      "GAS_WEBAPP_URL is not configured. Please set it in your Vercel environment variables."
    );
  }

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
 * @returns JSON parsé depuis la réponse GAS
 * @throws Error avec détails si HTML détecté, redirect échoué, ou erreur GAS
 */
export async function gasPost(payload: GasPostOptions): Promise<unknown> {
  const { url, key } = validateEnv();

  // Construire le body JSON
  const body = JSON.stringify(payload);

  // Première tentative avec redirect: "manual"
  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    redirect: "manual" as const,
    cache: "no-store",
  });

  // Gérer les redirects 302/303
  if (response.status === 302 || response.status === 303) {
    const location = response.headers.get("location");
    if (!location) {
      throw new Error(
        `GAS returned ${response.status} redirect but no Location header. Status: ${response.status}, Content-Type: ${response.headers.get("content-type")}`
      );
    }

    console.log(`[GAS] Redirect detected: ${response.status} → ${location.substring(0, 100)}...`);

    // Re-POST vers l'URL de redirect
    response = await fetch(location, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      redirect: "manual" as const,
      cache: "no-store",
    });
  }

  // Lire le texte d'abord pour détecter HTML
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  // Détecter HTML (commence par "<" ou content-type text/html)
  if (text.trim().startsWith("<") || contentType.includes("text/html")) {
    const preview = text.substring(0, 500);
    const location = response.headers.get("location");
    
    console.error(`[GAS] HTML response detected:`, {
      status: response.status,
      contentType,
      location: location || "none",
      preview,
    });

    throw new Error(
      `GAS returned HTML instead of JSON. Status: ${response.status}, Content-Type: ${contentType}, Location: ${location || "none"}. Preview: ${preview}`
    );
  }

  // Parser le JSON
  let result: GasResponse;
  try {
    result = JSON.parse(text) as GasResponse;
  } catch (error) {
    console.error(`[GAS] JSON parse error:`, {
      status: response.status,
      contentType,
      textPreview: text.substring(0, 200),
    });
    throw new Error(
      `GAS returned invalid JSON. Status: ${response.status}, Content-Type: ${contentType}. Preview: ${text.substring(0, 200)}`
    );
  }

  // Vérifier les erreurs dans la réponse
  if (result.error) {
    throw new Error(`GAS error: ${result.error}`);
  }

  if (!response.ok) {
    throw new Error(
      `GAS request failed: ${response.status} ${response.statusText}. Response: ${JSON.stringify(result).substring(0, 200)}`
    );
  }

  // Log en développement
  if (process.env.NODE_ENV === "development") {
    console.log(`[GAS] Success: ${payload.action || "custom"} → ${response.status}`);
  }

  return result;
}

/**
 * Wrapper pour les appels admin (action + data + key automatique)
 */
export async function gasPostAdmin(action: string, data?: unknown): Promise<unknown> {
  const { key } = validateEnv();
  const result = await gasPost({
    action,
    key,
    data,
  });
  
  // GAS retourne { data: ... } pour les actions admin
  if (result && typeof result === "object" && "data" in result) {
    return (result as { data: unknown }).data;
  }
  
  return result;
}
