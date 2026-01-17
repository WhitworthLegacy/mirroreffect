import { PublicAvailabilityQuerySchema, PublicAvailabilityResponseSchema } from "@mirroreffect/core";
import { gasPost } from "@/lib/gas";
import { normalizeDateToISO } from "@/lib/date";

const TOTAL_MIRRORS = 4;
type GstRow = unknown[];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = PublicAvailabilityQuerySchema.safeParse(params);
  const debugMode = params.debug === "1";

  if (!parsed.success) {
    return Response.json(
      { error: "invalid_query", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const queryDateRaw = parsed.data.date;
  const normalizedQueryDate = normalizeDateToISO(queryDateRaw);
  if (!normalizedQueryDate) {
    console.error("[availability] Invalid query date:", queryDateRaw);
    return Response.json(
      { error: "invalid_date", message: "Date must be YYYY-MM-DD or DD/MM/YYYY" },
      { status: 400 }
    );
  }
  const queryDateISO = normalizedQueryDate;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[availability] query date raw=${queryDateRaw} normalized=${queryDateISO}`);
  }

  try {
    const result = await gasPost({
      action: "readSheet",
      key: process.env.GAS_KEY,
      data: { sheetName: "Clients" }
    });

    // GAS peut retourner { values: [...] } ou { data: { values: [...] } }
    // Gérer les deux formats pour compatibilité
    let rows: GstRow[] | undefined;
    if (result && typeof result === "object") {
      if ("values" in result && Array.isArray(result.values)) {
        rows = result.values as GstRow[];
      } else if ("data" in result && result.data && typeof result.data === "object" && "values" in result.data && Array.isArray(result.data.values)) {
        rows = (result.data as { values: unknown[][] }).values as GstRow[];
      }
    }

    if (!rows || rows.length < 2) {
      const output = PublicAvailabilityResponseSchema.parse({
        date: queryDateISO,
        total_mirrors: TOTAL_MIRRORS,
        reserved_mirrors: 0,
        remaining_mirrors: TOTAL_MIRRORS,
        available: true
      });
      return Response.json(output);
    }

    const headers = (rows[0] as string[]).map((column) => String(column).trim());
    const dateIdx = headers.findIndex((column) => column === "Date Event");
    const eventIdIdx = headers.findIndex((column) => column === "Event ID");

    if (dateIdx === -1) {
      console.error("[availability] Header 'Date Event' not found", headers);
      return Response.json({ error: "sheet_format_error" }, { status: 500 });
    }

    let reserved = 0;
    const matchedEventIds: string[] = [];

    // Échantillon des dates pour debug (10 premières lignes)
    const sampleDates = rows.slice(1, 11).map((row, sampleIndex) => {
      const raw = row[dateIdx];
      const normalized = normalizeDateToISO(raw);
      return {
        row: sampleIndex + 1,
        raw: raw !== undefined && raw !== null ? String(raw) : null,
        iso: normalized
      };
    });

    // Compter les réservations pour la date demandée
    for (const row of rows.slice(1)) {
      const eventDateISO = normalizeDateToISO(row[dateIdx]);
      if (!eventDateISO || eventDateISO !== queryDateISO) {
        continue;
      }

      reserved += 1;
      if (eventIdIdx >= 0) {
        const eventIdValue = String(row[eventIdIdx] || "").trim();
        if (eventIdValue) {
          matchedEventIds.push(eventIdValue);
        }
      }
    }

    const remaining = Math.max(0, TOTAL_MIRRORS - reserved);
    const output = PublicAvailabilityResponseSchema.parse({
      date: queryDateISO,
      total_mirrors: TOTAL_MIRRORS,
      reserved_mirrors: reserved,
      remaining_mirrors: remaining,
      available: remaining > 0
    });

    if (process.env.NODE_ENV !== "production" || debugMode) {
      return Response.json({
        ...output,
        debug: {
          query_date_raw: queryDateRaw,
          query_date_iso: queryDateISO,
          normalized_query_date: normalizedQueryDate,
          dateEventIdx: dateIdx,
          rowCount: rows.length - 1,
          sampleDates: sampleDates,
          matched_rows: reserved,
          sample_event_ids: matchedEventIds.slice(0, 5)
        }
      });
    }

    return Response.json(output);
  } catch (error) {
    console.error("[availability] Error:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
