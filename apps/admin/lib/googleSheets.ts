/**
 * Google Sheets Integration
 * 
 * Configuration requise:
 * - GOOGLE_SHEETS_SPREADSHEET_ID: ID du Google Sheet
 * 
 * Authentification (choisir une méthode):
 * 
 * Option 1: Google Apps Script Web App (RECOMMANDÉ - Plus simple)
 * - GAS_WEBAPP_URL: URL de votre Google Apps Script déployé comme Web App
 * - GAS_KEY: Clé secrète pour sécuriser l'accès (optionnel mais recommandé)
 * 
 * Option 2: OAuth 2.0 avec Refresh Token
 * - GOOGLE_SHEETS_CLIENT_ID: Client ID OAuth 2.0
 * - GOOGLE_SHEETS_CLIENT_SECRET: Client Secret OAuth 2.0
 * - GOOGLE_SHEETS_REFRESH_TOKEN: Refresh Token OAuth 2.0
 * 
 * Option 3: Service Account (si autorisé par votre organisation)
 * - GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL: Email du service account
 * - GOOGLE_SHEETS_PRIVATE_KEY: Clé privée du service account (format PEM)
 * 
 * Option 4: API Key (lecture seule)
 * - GOOGLE_SHEETS_API_KEY: Clé API Google (pour lecture seule)
 * 
 * Pour les events, on écrit dans une feuille "Events"
 * Pour les stats mensuelles, on lit depuis une feuille "Stats"
 */

type GoogleSheetsConfig = {
  spreadsheetId: string;
  // Google Apps Script
  gasWebAppUrl?: string;
  gasKey?: string;
  // OAuth 2.0
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  // Service Account
  serviceAccountEmail?: string;
  privateKey?: string;
  // API Key
  apiKey?: string;
};

let config: GoogleSheetsConfig | null = null;

function getConfig(): GoogleSheetsConfig {
  if (config) return config;

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");
  }

  config = {
    spreadsheetId,
    // Google Apps Script
    gasWebAppUrl: process.env.GAS_WEBAPP_URL,
    gasKey: process.env.GAS_KEY,
    // OAuth 2.0
    clientId: process.env.GOOGLE_SHEETS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SHEETS_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_SHEETS_REFRESH_TOKEN,
    // Service Account
    serviceAccountEmail: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    // API Key
    apiKey: process.env.GOOGLE_SHEETS_API_KEY,
  };

  return config;
}

/**
 * Get OAuth2 access token using refresh token (RECOMMENDED)
 */
async function getAccessTokenFromRefreshToken(): Promise<string> {
  const cfg = getConfig();
  if (!cfg.clientId || !cfg.clientSecret || !cfg.refreshToken) {
    throw new Error("OAuth 2.0 credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: cfg.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token from refresh token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get OAuth2 access token using service account (fallback)
 */
async function getAccessTokenFromServiceAccount(): Promise<string> {
  const cfg = getConfig();
  if (!cfg.serviceAccountEmail || !cfg.privateKey) {
    throw new Error("Service account credentials not configured");
  }

  // Use Google OAuth2 API to get access token
  // For server-side, we'll use a JWT-based approach
  try {
    const jwt = await import("jsonwebtoken");
    
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.default.sign(
      {
        iss: cfg.serviceAccountEmail,
        sub: cfg.serviceAccountEmail,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      },
      cfg.privateKey,
      { algorithm: "RS256" }
    );

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: token,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cannot find module")) {
      throw new Error(
        "jsonwebtoken package is required. Install it with: pnpm add jsonwebtoken @types/jsonwebtoken"
      );
    }
    throw error;
  }
}

/**
 * Get OAuth2 access token (tries OAuth 2.0 first, then service account)
 */
async function getAccessToken(): Promise<string> {
  const cfg = getConfig();
  
  // Try OAuth 2.0 with refresh token first (recommended)
  if (cfg.clientId && cfg.clientSecret && cfg.refreshToken) {
    try {
      return await getAccessTokenFromRefreshToken();
    } catch (error) {
      console.warn("Failed to get token from refresh token, trying service account:", error);
    }
  }
  
  // Fallback to service account
  if (cfg.serviceAccountEmail && cfg.privateKey) {
    return await getAccessTokenFromServiceAccount();
  }
  
  throw new Error("No authentication method configured. Please set up OAuth 2.0 or Service Account credentials.");
}

/**
 * Make request via Google Apps Script Web App (if configured)
 */
async function gasRequest(action: string, data?: unknown): Promise<unknown> {
  const cfg = getConfig();
  if (!cfg.gasWebAppUrl) {
    throw new Error("GAS_WEBAPP_URL not configured");
  }

  const response = await fetch(cfg.gasWebAppUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      key: cfg.gasKey || "p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7", // Default to your existing key
      data,
    }),
  });

  // Handle redirects (Google Apps Script Web Apps sometimes redirect)
  if (response.status === 200 && response.redirected) {
    // If redirected, follow the redirect
    const redirectUrl = response.url;
    const redirectResponse = await fetch(redirectUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        key: cfg.gasKey || "p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7",
        data,
      }),
    });
    if (!redirectResponse.ok) {
      const error = await redirectResponse.text();
      throw new Error(`Google Apps Script error: ${error}`);
    }
    const redirectResult = await redirectResponse.json();
    if (redirectResult.error) {
      throw new Error(redirectResult.error);
    }
    return redirectResult.data;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Apps Script error: ${error}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

/**
 * Make authenticated request to Google Sheets API
 */
async function sheetsRequest(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<unknown> {
  const cfg = getConfig();

  // Note: If GAS is configured, the calling functions should use gasRequest instead
  // This function is only for direct API calls

  let token: string | undefined;

  // Try OAuth 2.0 first, then service account, then API key
  if (cfg.clientId && cfg.clientSecret && cfg.refreshToken) {
    try {
      token = await getAccessTokenFromRefreshToken();
    } catch (error) {
      console.warn("OAuth 2.0 failed, trying service account:", error);
      if (cfg.serviceAccountEmail && cfg.privateKey) {
        token = await getAccessTokenFromServiceAccount();
      }
    }
  } else if (cfg.serviceAccountEmail && cfg.privateKey) {
    token = await getAccessTokenFromServiceAccount();
  } else if (cfg.apiKey) {
    // For read-only operations with API key
    endpoint += `?key=${cfg.apiKey}`;
  } else {
    throw new Error("No authentication method configured");
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cfg.spreadsheetId}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Sheets API error: ${error}`);
  }

  return response.json();
}

/**
 * Append a row to a sheet
 */
export async function appendRowToSheet(
  sheetName: string,
  values: unknown[]
): Promise<void> {
  const cfg = getConfig();
  
  // Use Google Apps Script if configured
  if (cfg.gasWebAppUrl) {
    await gasRequest("appendRow", { sheetName, values });
    return;
  }

  // Use direct API
  await sheetsRequest("POST", `/${sheetName}:append`, {
    values: [values],
    insertDataOption: "INSERT_ROWS",
  });
}

/**
 * Update a row in a sheet (by finding matching ID in first column)
 */
export async function updateRowInSheet(
  sheetName: string,
  id: string,
  values: unknown[]
): Promise<void> {
  const cfg = getConfig();
  
  // Use Google Apps Script if configured
  if (cfg.gasWebAppUrl) {
    // Pour "Clients", on utilise updateRow qui cherche par Event ID
    await gasRequest("updateRow", { sheetName, id, values });
    return;
  }

  // Use direct API
  // First, find the row index
  const range = `${sheetName}!A:A`;
  const response = await sheetsRequest("GET", `/values/${range}`) as {
    values?: string[][];
  };

  const rows = response.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) {
    // Row not found, append it
    await appendRowToSheet(sheetName, [id, ...values]);
    return;
  }

  // Update the row (rowIndex + 1 because Sheets API is 1-indexed)
  const updateRange = `${sheetName}!A${rowIndex + 1}:${getColumnLetter(values.length + 1)}${rowIndex + 1}`;
  await sheetsRequest("PUT", `/values/${updateRange}`, {
    values: [[id, ...values]],
    valueInputOption: "RAW",
  });
}

/**
 * Read all rows from a sheet
 */
export async function readSheet(sheetName: string): Promise<unknown[][]> {
  const cfg = getConfig();
  
  // Use Google Apps Script if configured
  if (cfg.gasWebAppUrl) {
    const result = await gasRequest("readSheet", { sheetName }) as {
      values?: unknown[][];
    };
    return result.values || [];
  }

  // Use direct API
  const response = await sheetsRequest("GET", `/values/${sheetName}`) as {
    values?: unknown[][];
  };
  return response.values || [];
}

/**
 * Delete a row from a sheet by ID (first column)
 */
export async function deleteRowFromSheet(sheetName: string, id: string): Promise<void> {
  const cfg = getConfig();
  
  // Use Google Apps Script if configured
  if (cfg.gasWebAppUrl) {
    await gasRequest("deleteRow", { sheetName, id });
    return;
  }

  // Use direct API
  // Read all rows to find the one to delete
  const rows = await readSheet(sheetName);
  const rowIndex = rows.findIndex((row) => row[0] === id);

  if (rowIndex === -1) {
    // Row not found, nothing to delete
    return;
  }

  let token: string | undefined;

  // Try OAuth 2.0 first, then service account
  if (cfg.clientId && cfg.clientSecret && cfg.refreshToken) {
    try {
      token = await getAccessTokenFromRefreshToken();
    } catch (error) {
      if (cfg.serviceAccountEmail && cfg.privateKey) {
        token = await getAccessTokenFromServiceAccount();
      } else {
        throw new Error("OAuth 2.0 or Service account credentials required for delete operations");
      }
    }
  } else if (cfg.serviceAccountEmail && cfg.privateKey) {
    token = await getAccessTokenFromServiceAccount();
  } else {
    throw new Error("OAuth 2.0 or Service account credentials required for delete operations");
  }

  // First, get the sheet metadata to find the sheet ID
  const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cfg.spreadsheetId}`;
  const metadataResponse = await fetch(metadataUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!metadataResponse.ok) {
    throw new Error("Failed to get sheet metadata");
  }

  const metadata = await metadataResponse.json() as {
    sheets?: Array<{ properties?: { title?: string; sheetId?: number } }>;
  };
  
  const sheet = metadata.sheets?.find(s => s.properties?.title === sheetName);
  if (!sheet?.properties?.sheetId) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  const sheetId = sheet.properties.sheetId;

  // Use batchUpdate to delete the row (rowIndex + 1 because Sheets API is 1-indexed, but we skip header)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cfg.spreadsheetId}:batchUpdate`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: rowIndex + 1, // +1 because we skip header row
              endIndex: rowIndex + 2,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete row: ${error}`);
  }
}

/**
 * Convert column number to letter (1 -> A, 27 -> AA, etc.)
 */
function getColumnLetter(columnNumber: number): string {
  let result = "";
  while (columnNumber > 0) {
    columnNumber--;
    result = String.fromCharCode(65 + (columnNumber % 26)) + result;
    columnNumber = Math.floor(columnNumber / 26);
  }
  return result;
}

/**
 * Map EventRow to Clients sheet columns
 * Retourne un objet avec les valeurs à mettre à jour dans la feuille "Clients"
 */
function mapEventRowToClientsValues(event: {
  id: string;
  event_date: string | null;
  event_type: string | null;
  language: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  address: string | null;
  pack_id: string | null;
  total_cents: number | null;
  transport_fee_cents: number | null;
  deposit_cents: number | null;
  balance_due_cents: number | null;
  status: string | null;
  student_name: string | null;
  student_hours: number | null;
  student_rate_cents: number | null;
  km_one_way: number | null;
  km_total: number | null;
  fuel_cost_cents: number | null;
  commercial_name: string | null;
  commercial_commission_cents: number | null;
  gross_margin_cents: number | null;
  deposit_invoice_ref: string | null;
  balance_invoice_ref: string | null;
  invoice_deposit_paid: boolean | null;
  invoice_balance_paid: boolean | null;
  closing_date: string | null;
  guest_count?: number | null;
}): Record<string, unknown> {
  // Helper pour convertir centimes en euros avec virgule (format européen)
  const centsToEuro = (cents: number | null | undefined): string => {
    if (cents === null || cents === undefined) return "";
    const euros = cents / 100;
    return euros.toFixed(2).replace(".", ",");
  };

  // Helper pour formater les nombres avec virgule
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return "";
    return num.toString().replace(".", ",");
  };

  return {
    "Event ID": event.id,
    "Date Event": event.event_date || "",
    "Type Event": event.event_type || "",
    "Language": event.language || "",
    "Nom": event.client_name || "",
    "Email": event.client_email || "",
    "Phone": event.client_phone || "",
    "Lieu Event": event.address || "",
    "Pack": event.pack_id || "",
    "Pack (€)": centsToEuro(event.total_cents),
    "Transport (€)": centsToEuro(event.transport_fee_cents),
    "Acompte": centsToEuro(event.deposit_cents),
    "Solde Restant": centsToEuro(event.balance_due_cents),
    "Etudiant": event.student_name || "",
    "Heures Etudiant": formatNumber(event.student_hours),
    "KM (Aller)": formatNumber(event.km_one_way),
    "KM (Total)": formatNumber(event.km_total),
    "Coût Essence": centsToEuro(event.fuel_cost_cents),
    "Commercial": event.commercial_name || "",
    "Comm Commercial": centsToEuro(event.commercial_commission_cents),
    "Marge Brut (Event)": centsToEuro(event.gross_margin_cents),
    "Acompte Facture": event.deposit_invoice_ref || "",
    "Solde Facture": event.balance_invoice_ref || "",
    "Invités": formatNumber(event.guest_count),
  };
}

/**
 * Write an event to Google Sheets (feuille "Clients")
 */
export async function writeEventToSheets(event: {
  id: string;
  event_date: string | null;
  event_type: string | null;
  language: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  address: string | null;
  pack_id: string | null;
  total_cents: number | null;
  transport_fee_cents: number | null;
  deposit_cents: number | null;
  balance_due_cents: number | null;
  status: string | null;
  student_name: string | null;
  student_hours: number | null;
  student_rate_cents: number | null;
  km_one_way: number | null;
  km_total: number | null;
  fuel_cost_cents: number | null;
  commercial_name: string | null;
  commercial_commission_cents: number | null;
  gross_margin_cents: number | null;
  deposit_invoice_ref: string | null;
  balance_invoice_ref: string | null;
  invoice_deposit_paid: boolean | null;
  invoice_balance_paid: boolean | null;
  closing_date: string | null;
  guest_count?: number | null;
}): Promise<void> {
  // Pour la feuille "Clients", on doit mettre à jour les colonnes spécifiques
  // On utilise GAS pour mettre à jour par Event ID
  const cfg = getConfig();
  
  if (cfg.gasWebAppUrl) {
    // Utiliser GAS pour mettre à jour les colonnes spécifiques par Event ID
    const values = mapEventRowToClientsValues(event);
    await gasRequest("updateRowByEventId", {
      eventId: event.id,
      values,
    });
  } else {
    // Fallback: utiliser updateRowInSheet (pour OAuth/Service Account)
    // Note: Cette approche nécessite que l'ordre des colonnes soit connu
    // Pour "Clients", on doit chercher par "Event ID" au lieu de la première colonne
    // Dans ce cas, on utilise updateRowInSheet qui sera adapté par GAS si disponible
    const values = [
      event.event_date || "",
      event.event_type || "",
      event.language || "",
      event.client_name || "",
      event.client_email || "",
      event.client_phone || "",
      event.address || "",
      event.pack_id || "",
      event.total_cents ? (event.total_cents / 100).toString().replace(".", ",") : "",
      event.transport_fee_cents ? (event.transport_fee_cents / 100).toString().replace(".", ",") : "",
      event.deposit_cents ? (event.deposit_cents / 100).toString().replace(".", ",") : "",
      event.balance_due_cents ? (event.balance_due_cents / 100).toString().replace(".", ",") : "",
      event.student_name || "",
      event.student_hours?.toString().replace(".", ",") || "",
      event.km_one_way?.toString() || "",
      event.km_total?.toString() || "",
      event.fuel_cost_cents ? (event.fuel_cost_cents / 100).toString().replace(".", ",") : "",
      event.commercial_name || "",
      event.commercial_commission_cents ? (event.commercial_commission_cents / 100).toString().replace(".", ",") : "",
      event.gross_margin_cents ? (event.gross_margin_cents / 100).toString().replace(".", ",") : "",
      event.deposit_invoice_ref || "",
      event.balance_invoice_ref || "",
      event.guest_count?.toString() || "",
    ];
    await updateRowInSheet("Clients", event.id, values);
  }
}

/**
 * Read monthly stats from Google Sheets
 */
export async function readMonthlyStatsFromSheets(): Promise<Array<{
  month: string;
  [key: string]: unknown;
}>> {
  // ✅ LECTURE DEPUIS LA FEUILLE "Stats"
  console.log("[Google Sheets] Reading monthly stats from sheet: 'Stats'");
  const rows = await readSheet("Stats");
  if (rows.length === 0) {
    console.log("[Google Sheets] Sheet 'Stats' is empty");
    return [];
  }
  console.log(`[Google Sheets] Found ${rows.length - 1} rows in sheet 'Stats' (excluding header)`);

  // First row is headers
  const headers = rows[0] as string[];
  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj as { month: string; [key: string]: unknown };
  });
}

/**
 * Read student monthly stats from Google Sheets
 */
export async function readStudentStatsFromSheets(): Promise<Array<{
  month: string;
  student_name: string;
  [key: string]: unknown;
}>> {
  const rows = await readSheet("Students");
  if (rows.length === 0) return [];

  // First row is headers
  const headers = rows[0] as string[];
  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj as { month: string; student_name: string; [key: string]: unknown };
  });
}

/**
 * Read commercial monthly stats from Google Sheets
 */
export async function readCommercialStatsFromSheets(): Promise<Array<{
  month: string;
  commercial_name: string;
  [key: string]: unknown;
}>> {
  const rows = await readSheet("Commercial");
  if (rows.length === 0) return [];

  // First row is headers
  const headers = rows[0] as string[];
  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj as { month: string; commercial_name: string; [key: string]: unknown };
  });
}

/**
 * Update or insert a row in a sheet by composite key (month + name)
 */
async function updateRowByCompositeKey(
  sheetName: string,
  key1: string,
  key1Value: string,
  key2: string,
  key2Value: string,
  values: Record<string, unknown>
): Promise<void> {
  const cfg = getConfig();
  
  if (cfg.gasWebAppUrl) {
    await gasRequest("updateRowByCompositeKey", {
      sheetName,
      key1,
      key1Value,
      key2,
      key2Value,
      values,
    });
    return;
  }

  // Use direct API - find row by composite key
  const rows = await readSheet(sheetName);
  if (rows.length === 0) throw new Error(`Sheet "${sheetName}" is empty`);

  const headers = rows[0] as string[];
  const dataRows = rows.slice(1);
  
  const key1Idx = headers.findIndex(h => String(h).trim() === key1);
  const key2Idx = headers.findIndex(h => String(h).trim() === key2);
  
  if (key1Idx < 0 || key2Idx < 0) {
    throw new Error(`Keys "${key1}" or "${key2}" not found in sheet "${sheetName}"`);
  }

  const rowIndex = dataRows.findIndex(
    row => String(row[key1Idx]) === String(key1Value) && String(row[key2Idx]) === String(key2Value)
  );

  // Build values array in header order
  const valuesArray = headers.map(header => {
    if (header === key1) return key1Value;
    if (header === key2) return key2Value;
    return values[header] ?? "";
  });

  if (rowIndex === -1) {
    // Row not found, append it
    await appendRowToSheet(sheetName, valuesArray);
  } else {
    // Update existing row
    const updateRange = `${sheetName}!A${rowIndex + 2}:${getColumnLetter(headers.length)}${rowIndex + 2}`;
    const token = await getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${cfg.spreadsheetId}/values/${updateRange}?valueInputOption=RAW`;
    await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ values: [valuesArray] }),
    });
  }
}

/**
 * Write monthly stats to Google Sheets
 */
export async function writeMonthlyStatsToSheets(stat: {
  month: string;
  [key: string]: unknown;
}): Promise<void> {
  // For Stats, we use month as the key (assuming one row per month)
  const rows = await readSheet("Stats");
  if (rows.length === 0) throw new Error("Stats sheet is empty");
  
  const headers = rows[0] as string[];
  const dataRows = rows.slice(1);
  
  const monthIdx = headers.findIndex(h => String(h).trim().toLowerCase() === "month");
  if (monthIdx < 0) throw new Error("Month column not found in Stats sheet");

  const rowIndex = dataRows.findIndex(row => String(row[monthIdx]) === String(stat.month));
  
  // Build values array in header order
  const valuesArray = headers.map(header => {
    const headerLower = String(header).trim().toLowerCase();
    if (headerLower === "month") return stat.month;
    return stat[header] ?? "";
  });

  if (rowIndex === -1) {
    await appendRowToSheet("Stats", valuesArray);
  } else {
    const updateRange = `Stats!A${rowIndex + 2}:${getColumnLetter(headers.length)}${rowIndex + 2}`;
    const token = await getAccessToken();
    const cfg = getConfig();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${cfg.spreadsheetId}/values/${updateRange}?valueInputOption=RAW`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ values: [valuesArray] }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update Stats: ${error}`);
    }
  }
}

/**
 * Write student stats to Google Sheets
 */
export async function writeStudentStatsToSheets(stat: {
  month: string;
  student_name: string;
  [key: string]: unknown;
}): Promise<void> {
  await updateRowByCompositeKey("Students", "month", stat.month, "student_name", stat.student_name, stat);
}

/**
 * Write commercial stats to Google Sheets
 */
export async function writeCommercialStatsToSheets(stat: {
  month: string;
  commercial_name: string;
  [key: string]: unknown;
}): Promise<void> {
  await updateRowByCompositeKey("Commercial", "month", stat.month, "commercial_name", stat.commercial_name, stat);
}

/**
 * Mapping des colonnes de la feuille "Clients" vers EventRow
 */
function mapClientsRowToEventRow(headers: string[], row: unknown[]): {
  id: string;
  event_date: string | null;
  event_type: string | null;
  language: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  zone_id: string | null;
  status: string | null;
  total_cents: number | null;
  transport_fee_cents: number | null;
  deposit_cents: number | null;
  balance_due_cents: number | null;
  balance_status: string | null;
  pack_id: string | null;
  address: string | null;
  on_site_contact: string | null;
  guest_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  student_name: string | null;
  student_hours: number | null;
  student_rate_cents: number | null;
  km_one_way: number | null;
  km_total: number | null;
  fuel_cost_cents: number | null;
  commercial_name: string | null;
  commercial_commission_cents: number | null;
  gross_margin_cents: number | null;
  deposit_invoice_ref: string | null;
  balance_invoice_ref: string | null;
  invoice_deposit_paid: boolean | null;
  invoice_balance_paid: boolean | null;
  closing_date: string | null;
} | null {
  const getCol = (label: string): unknown => {
    const idx = headers.findIndex(h => String(h).trim() === label);
    return idx >= 0 ? row[idx] : null;
  };

  // Helper to convert string to number (cents) - les valeurs dans Clients sont en euros avec virgule
  const parseCents = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    let num: number;
    if (typeof value === "string") {
      // Gérer les virgules (format européen) et les points
      const cleaned = value.replace(",", ".").trim();
      num = parseFloat(cleaned);
    } else {
      num = Number(value);
    }
    return Number.isNaN(num) ? null : Math.round(num * 100); // Convertir euros en centimes
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

  // Helper to parse boolean
  const parseBoolean = (value: unknown): boolean | null => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      return lower === "true" || lower === "1" || lower === "oui" || lower === "yes";
    }
    return Boolean(value);
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
    // Gérer différents formats de date
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${('0'+m[2]).slice(-2)}-${('0'+m[1]).slice(-2)}`;
    return str;
  };

  // Mapping selon vos colonnes COLS
  const eventId = getCol("Event ID");
  if (!eventId) return null; // Ignorer les lignes sans Event ID

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
  // Taux étudiant par défaut 14€/h = 1400 centimes
  const student_rate_cents = 1400;
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
    status: "active", // Par défaut, vous pouvez adapter selon vos besoins
    total_cents,
    transport_fee_cents,
    deposit_cents,
    balance_due_cents,
    balance_status: balance_due_cents && balance_due_cents > 0 ? "due" : "paid",
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
    invoice_deposit_paid: null, // Pas dans votre structure actuelle
    invoice_balance_paid: null, // Pas dans votre structure actuelle
    closing_date: null, // Vous pouvez ajouter cette colonne si nécessaire
  };
}

/**
 * Read all events from Google Sheets (feuille "Clients")
 * Returns events in the same format as Supabase
 */
export async function readEventsFromSheets(): Promise<Array<{
  id: string;
  event_date: string | null;
  event_type: string | null;
  language: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  zone_id: string | null;
  status: string | null;
  total_cents: number | null;
  transport_fee_cents: number | null;
  deposit_cents: number | null;
  balance_due_cents: number | null;
  balance_status: string | null;
  pack_id: string | null;
  address: string | null;
  on_site_contact: string | null;
  guest_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  student_name: string | null;
  student_hours: number | null;
  student_rate_cents: number | null;
  km_one_way: number | null;
  km_total: number | null;
  fuel_cost_cents: number | null;
  commercial_name: string | null;
  commercial_commission_cents: number | null;
  gross_margin_cents: number | null;
  deposit_invoice_ref: string | null;
  balance_invoice_ref: string | null;
  invoice_deposit_paid: boolean | null;
  invoice_balance_paid: boolean | null;
  closing_date: string | null;
}>> {
  // ✅ LECTURE DEPUIS LA FEUILLE "Clients" (pas "Events")
  console.log("[Google Sheets] Reading events from sheet: 'Clients'");
  const rows = await readSheet("Clients");
  if (rows.length === 0) {
    console.log("[Google Sheets] Sheet 'Clients' is empty");
    return [];
  }
  console.log(`[Google Sheets] Found ${rows.length - 1} rows in sheet 'Clients' (excluding header)`);

  // First row is headers
  const headers = rows[0].map(h => String(h).trim()) as string[];
  const dataRows = rows.slice(1);

  return dataRows
    .map((row) => mapClientsRowToEventRow(headers, row))
    .filter((event): event is NonNullable<typeof event> => event !== null)
    .sort((a, b) => {
      // Sort by event_date ascending
      if (!a.event_date && !b.event_date) return 0;
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return a.event_date.localeCompare(b.event_date);
    });
}
