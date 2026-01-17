import { PublicAvailabilityQuerySchema, PublicAvailabilityResponseSchema } from "@mirroreffect/core";
import { gasPost } from "@/lib/gas";

// Miroirs hardcodes pour MVP (pas de sheet inventory)
const TOTAL_MIRRORS = 4;

/**
 * Normalise une date vers le format YYYY-MM-DD
 * Supporte: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, ISO 8601 (2025-01-24T23:00:00.000Z)
 */
function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  // Format YYYY-MM-DD (deja bon)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Format ISO 8601 with timezone (e.g., 2025-01-24T23:00:00.000Z)
  if (str.includes("T")) {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  // Format DD/MM/YYYY or DD-MM-YYYY
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }

  return null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = PublicAvailabilityQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  const { date } = parsed.data;

  try {
    // Lire Clients sheet (contient uniquement les events avec acompte payé)
    const result = await gasPost({
      action: "readSheet",
      key: process.env.GAS_KEY,
      data: { sheetName: "Clients" }
    });

    // GAS returns { values: [...] } for readSheet action
    console.log("[availability] GAS response keys:", Object.keys(result));
    console.log("[availability] GAS response:", JSON.stringify(result).substring(0, 500));

    const values = result.values as unknown[][] | undefined;
    if (!values) {
      console.error("[availability] No values in GAS response:", result);
      return Response.json({ error: "sheets_error", debug: result }, { status: 500 });
    }

    const rows = values;
    if (rows.length < 2) {
      // Pas d'events = tous les miroirs disponibles
      const output = PublicAvailabilityResponseSchema.parse({
        date,
        total_mirrors: TOTAL_MIRRORS,
        reserved_mirrors: 0,
        remaining_mirrors: TOTAL_MIRRORS,
        available: true
      });
      return Response.json(output);
    }

    const headers = (rows[0] as string[]).map(h => String(h).trim());
    const dateIdx = headers.findIndex(h => h === "Date Event");

    console.log("[availability] Headers:", headers);
    console.log("[availability] Date Event column index:", dateIdx);
    console.log("[availability] Total rows (including header):", rows.length);

    if (dateIdx === -1) {
      console.error("[availability] Header 'Date Event' not found in headers:", headers);
      return Response.json({ error: "sheet_format_error" }, { status: 500 });
    }

    // Log les 5 premieres lignes pour debug
    console.log("[availability] First 5 data rows Date Event values:");
    rows.slice(1, 6).forEach((row, i) => {
      console.log(`  Row ${i}: raw="${row[dateIdx]}" normalized="${normalizeDate(row[dateIdx])}"`);
    });

    // Compter TOUS les events sur cette date (comme dans admin)
    const reserved = rows.slice(1).filter(row => {
      const eventDateRaw = row[dateIdx];
      const eventDate = normalizeDate(eventDateRaw);

      const matches = eventDate === date;
      if (matches) {
        console.log("[availability] MATCH:", eventDateRaw, "->", eventDate);
      }

      return matches;
    }).length;

    console.log("[availability] Query date:", date, "Reserved:", reserved, "of", TOTAL_MIRRORS);

    const remaining = Math.max(0, TOTAL_MIRRORS - reserved);

    const output = PublicAvailabilityResponseSchema.parse({
      date,
      total_mirrors: TOTAL_MIRRORS,
      reserved_mirrors: reserved,
      remaining_mirrors: remaining,
      available: remaining > 0
    });

    return Response.json(output);
  } catch (error) {
    console.error("[availability] Error:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
