/**
 * Google Apps Script WebApp Client
 * 
 * Fonction robuste pour appeler GAS avec gestion des redirects et détection HTML.
 * Utilisée uniquement server-side (API routes / server actions).
 */

type GasPostOptions = {
  [key: string]: unknown;
};

type GasResponse = {
  ok?: boolean;
  error?: string;
  [key: string]: unknown;
};

/**
 * Valide que les variables d'environnement requises sont présentes
 */
function validateEnv(): { url: string } {
  const url = process.env.GAS_WEBAPP_URL;

  if (!url) {
    throw new Error(
      "GAS_WEBAPP_URL is not configured. Please set it in your Vercel environment variables."
    );
  }

  return { url };
}

/**
 * Appelle Google Apps Script WebApp avec gestion robuste des redirects
 * 
 * @param payload - Payload à envoyer (objet personnalisé, typiquement pour leads)
 * @returns JSON parsé depuis la réponse GAS
 * @throws Error avec détails si HTML détecté, redirect échoué, ou erreur GAS
 */
export async function gasPost(payload: GasPostOptions): Promise<GasResponse> {
  const { url } = validateEnv();

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

  // Log en développement
  if (process.env.NODE_ENV === "development") {
    console.log(`[GAS] Success → ${response.status}`);
  }

  return result;
}
