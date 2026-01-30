/**
 * Sync event data to Google Sheets
 *
 * Target spreadsheet: 12X9G62lKRzJSYHZfGQ6jCTMwgOCfdMtkTD6A-GbuwqQ
 * Tab: 'Clients'
 *
 * Hard data columns:
 * Nom, Email, Phone, Language, Date Formulaire, Date Event, Lieu Event,
 * Type Event, Invités, Pack, Pack (€), Transport (€), Date acompte payé,
 * Acompte, Total, Event ID
 */

type EventData = {
  event_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  language: string;
  event_date: string | null;
  address: string;
  event_type?: string;
  guest_count?: number | null;
  pack_code?: string;
  total_cents: number | null;
  transport_fee_cents: number | null;
  deposit_cents: number;
  closing_date?: string | null; // Date formulaire / Date acompte payé
};

/**
 * Convert cents to Euro string with comma decimal (European format)
 */
function centsToEuro(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  const euros = cents / 100;
  return euros.toFixed(2).replace(".", ",");
}

/**
 * Format date to DD/MM/YYYY
 */
function formatDateFR(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

/**
 * Sync event to Google Sheets 'Clients' tab
 * Uses Google Apps Script Web App for simplicity
 */
export async function syncEventToSheets(event: EventData): Promise<{ success: boolean; error?: string }> {
  const gasWebAppUrl = process.env.GAS_WEBAPP_URL;
  const gasKey = process.env.GAS_KEY;

  if (!gasWebAppUrl) {
    console.log("[syncToSheets] GAS_WEBAPP_URL not configured, skipping sync");
    return { success: false, error: "GAS_WEBAPP_URL not configured" };
  }

  const now = new Date().toISOString();
  const closingDate = event.closing_date || now;

  // Build row data matching 'Clients' sheet columns
  const rowData = {
    "Event ID": event.event_id,
    "Nom": event.client_name || "",
    "Email": event.client_email || "",
    "Phone": event.client_phone || "",
    "Language": (event.language || "fr").toLowerCase(),
    "Date Formulaire": formatDateFR(closingDate),
    "Date Event": formatDateFR(event.event_date),
    "Lieu Event": event.address || "",
    "Type Event": event.event_type || "",
    "Invités": event.guest_count?.toString() || "",
    "Pack": event.pack_code || "",
    "Pack (€)": centsToEuro(event.total_cents),
    "Transport (€)": centsToEuro(event.transport_fee_cents),
    "Date acompte payé": formatDateFR(closingDate),
    "Acompte": centsToEuro(event.deposit_cents),
    "Total": centsToEuro((event.total_cents || 0) + (event.transport_fee_cents || 0)),
  };

  try {
    const payload = {
      action: "appendOrUpdateRow",
      sheetName: "Clients",
      keyColumn: "Event ID",
      keyValue: event.event_id,
      values: rowData,
      key: gasKey,
    };

    console.log("[syncToSheets] Syncing event to Google Sheets:", {
      event_id: event.event_id,
      client: event.client_name,
    });

    const response = await fetch(gasWebAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // GAS returns 302 redirect on success, follow it
    if (response.redirected) {
      const redirectResponse = await fetch(response.url);
      const result = await redirectResponse.json();
      console.log("[syncToSheets] Success (after redirect):", result);
      return { success: true };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[syncToSheets] Error response:", errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log("[syncToSheets] Success:", result);
    return { success: true };
  } catch (error) {
    console.error("[syncToSheets] Exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
