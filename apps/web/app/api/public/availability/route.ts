import { PublicAvailabilityQuerySchema, PublicAvailabilityResponseSchema } from "@mirroreffect/core";
import { gasPost } from "@/lib/gas";

// Miroirs hardcodés pour MVP (pas de sheet inventory)
const TOTAL_MIRRORS = 4;

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

    if (!result.ok || !result.data) {
      return Response.json({ error: "sheets_error" }, { status: 500 });
    }

    const rows = result.data as unknown[][];
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
    const depositPaidIdx = headers.findIndex(h => h === "Date Acompte Payé" || h === "Date acompte payé");

    if (dateIdx === -1) {
      console.error("[availability] Header 'Date Event' not found");
      return Response.json({ error: "sheet_format_error" }, { status: 500 });
    }

    // Compter les events sur cette date
    // IMPORTANT: Only count rows with a non-empty "Date Acompte Payé" (paid deposits only)
    // Format date attendu: YYYY-MM-DD
    const reserved = rows.slice(1).filter(row => {
      // Skip rows without paid deposit
      if (depositPaidIdx >= 0) {
        const depositPaid = String(row[depositPaidIdx] || "").trim();
        if (!depositPaid) return false;
      }

      const eventDate = String(row[dateIdx] || "").trim();
      // Normaliser les formats de date possibles
      if (eventDate === date) return true;
      // Format DD/MM/YYYY -> YYYY-MM-DD
      const match = eventDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (match) {
        const normalized = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
        return normalized === date;
      }
      return false;
    }).length;

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
