import { PublicAvailabilityQuerySchema, PublicAvailabilityResponseSchema } from "@mirroreffect/core";
import { gasPost } from "@/lib/gas";
import { normalizeDateToISO } from "@/lib/date";

const TOTAL_MIRRORS = 4;
type GstRow = unknown[];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = PublicAvailabilityQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json(
      { error: "invalid_query", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const queryDateRaw = parsed.data.date;
  const queryDateISO = normalizeDateToISO(queryDateRaw);

  if (!queryDateISO) {
    return Response.json(
      { error: "invalid_date", message: "Date must be YYYY-MM-DD or DD/MM/YYYY" },
      { status: 400 }
    );
  }

  try {
    const result = await gasPost({
      action: "readSheet",
      key: process.env.GAS_KEY,
      data: { sheetName: "Clients" }
    });

    const rows = result.values as GstRow[] | undefined;
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

    for (const row of rows.slice(1)) {
      const eventDateISO = normalizeDateToISO(row[dateIdx]);
      if (!eventDateISO) continue;
      if (eventDateISO !== queryDateISO) continue;

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

    if (process.env.NODE_ENV !== "production") {
      return Response.json({
        ...output,
        debug: {
          query_date_raw: queryDateRaw,
          query_date_iso: queryDateISO,
          rows_total: rows.length - 1,
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
