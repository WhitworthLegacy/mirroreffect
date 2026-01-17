/**
 * Google Apps Script WebApp Client
 *
 * Fonction robuste pour appeler GAS avec gestion des redirects et detection HTML.
 * Utilisee uniquement server-side (API routes / server actions).
 */

type GasPostOptions = {
  action?: string;
  key?: string;
  data?: unknown;
  [key: string]: unknown;
};

type GasResponse = {
  values?: unknown[][];
  error?: string;
  [key: string]: unknown;
};

function buildUrlWithQuery(baseUrl: string, payload: GasPostOptions): string {
  const u = new URL(baseUrl);
  if (payload.action) u.searchParams.set("action", String(payload.action));
  if (payload.key) u.searchParams.set("key", String(payload.key));
  if (payload.data !== undefined) {
    u.searchParams.set("data", encodeURIComponent(JSON.stringify(payload.data)));
  }
  return u.toString();
}

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
 * Valide que les variables d'environnement requises sont presentes
 */
function validateEnv(): { url: string } {
  const url = validateAndCleanUrl(process.env.GAS_WEBAPP_URL);
  return { url };
}

/**
 * Appelle Google Apps Script WebApp avec gestion robuste des redirects
 *
 * @param payload - Payload a envoyer (action, key, data, ou objet personnalise)
 * @returns JSON parse depuis la reponse GAS
 * @throws Error avec details si HTML detecte, redirect echoue, ou erreur GAS
 */
export async function gasPost(payload: GasPostOptions): Promise<GasResponse> {
  const { url } = validateEnv();

  // Construire le body JSON
  const body = JSON.stringify(payload);
  let finalUrl = url;

  // Construire URL avec query params (comme admin)
  const urlWithQuery = buildUrlWithQuery(url, payload);

  // Premiere tentative avec redirect: "manual" - POST
  let response = await fetch(urlWithQuery, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    redirect: "manual",
    cache: "no-store",
  });

  // Gerer les redirects 302/303 - Follow as GET (GAS expects GET after redirect)
  if (response.status === 302 || response.status === 303) {
    const location = response.headers.get("location");
    if (!location) {
      throw new Error(
        `GAS returned ${response.status} redirect but no Location header. Status: ${response.status}, Content-Type: ${response.headers.get("content-type")}`
      );
    }

    // Nettoyer l'URL de redirect
    const redirectUrl = location.trim().startsWith("http")
      ? location.trim()
      : new URL(location.trim(), url).toString();

    console.log(`[GAS] Redirect detected: ${response.status} -> ${redirectUrl.substring(0, 100)}...`);
    finalUrl = redirectUrl;

    // Follow redirect as GET (302/303 expect GET, not POST)
    response = await fetch(redirectUrl, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
    });
  }

  // Lire le texte d'abord pour detecter HTML
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  // Detecter HTML (commence par "<" ou content-type text/html)
  if (text.trim().startsWith("<") || contentType.includes("text/html")) {
    const preview = text.substring(0, 500);
    const location = response.headers.get("location");

    console.error(`[GAS] HTML response detected:`, {
      status: response.status,
      contentType,
      location: location || "none",
      preview,
      url: finalUrl,
    });

    throw new Error(
      `GAS returned HTML instead of JSON (likely 405 Page Not Found - check GAS deployment and URL). Status: ${response.status}, Content-Type: ${contentType}, Location: ${location || "none"}. Preview: ${preview}`
    );
  }

  // Parser le JSON
  let result: GasResponse;
  try {
    result = JSON.parse(text) as GasResponse;
  } catch {
    console.error(`[GAS] JSON parse error:`, {
      status: response.status,
      contentType,
      textPreview: text.substring(0, 200),
      url: finalUrl,
    });
    throw new Error(
      `GAS returned invalid JSON. Status: ${response.status}, Content-Type: ${contentType}. Preview: ${text.substring(0, 200)}`
    );
  }

  // Verifier les erreurs dans la reponse GAS
  if (result.error) {
    console.error(`[GAS] GAS error:`, result.error);
    throw new Error(`GAS error: ${result.error}`);
  }

  // Log en developpement
  if (process.env.NODE_ENV === "development") {
    console.log(`[GAS] Success -> ${response.status}`);
  }

  return result;
}
