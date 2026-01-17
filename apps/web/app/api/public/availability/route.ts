import { PublicAvailabilityQuerySchema, PublicAvailabilityResponseSchema } from "@mirroreffect/core";
import { gasPost } from "@/lib/gas";

const TOTAL_MIRRORS = 4;

type GstRow = unknown[];

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const str = String(value).replace(",", ".").trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

function normalizeToISO(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  if (str.includes("T")) {
    const date = new Date(str);
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const dd = match[1].padStart(2, "0");
    const mm = match[2].padStart(2, "0");
    const yyyy = match[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

function normalizeToFR(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  const iso = normalizeToISO(str);
  if (!iso) return null;
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function sameDate(a: unknown, b: unknown): boolean {
  const isoA = normalizeToISO(a);
  const isoB = normalizeToISO(b);
  if (!isoA || !isoB) return false;
  return isoA === isoB;
}

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
  const queryDateISO = normalizeToISO(queryDateRaw);
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

    if (!result.ok || !result.data) {
      return Response.json({ error: "sheets_error" }, { status: 500 });
    }

    const rows = result.data as GstRow[];
    if (rows.length < 2) {
      const output = PublicAvailabilityResponseSchema.parse({
        date: queryDateISO,
        total_mirrors: TOTAL_MIRRORS,
        reserved_mirrors: 0,
        remaining_mirrors: TOTAL_MIRRORS,
        available: true
      });
      return Response.json(output);
    }

    const headers = (rows[0] as string[]).map(h => String(h).trim());
    const dateIdx = headers.findIndex(h => h === "Date Event");
    const depositDateIdx = headers.findIndex(h => h === "Date acompte payé");
    const depositIdx = headers.findIndex(h => h === "Acompte" || h === "Acompte (€)");
    const eventIdIdx = headers.findIndex(h => h === "Event ID");

    if (dateIdx === -1) {
      console.error("[availability] Header 'Date Event' not found", headers);
      return Response.json({ error: "sheet_format_error" }, { status: 500 });
    }

    let reserved = 0;
    let confirmed = 0;
    const matchedEventIds: string[] = [];

    for (const row of rows.slice(1)) {
      const eventDateISO = normalizeToISO(row[dateIdx]);
      if (!eventDateISO) continue;

      const depositDateRaw = depositDateIdx >= 0 ? row[depositDateIdx] : null;
      const depositAmountRaw = depositIdx >= 0 ? row[depositIdx] : null;
      const depositAmount = toNumber(depositAmountRaw);
      const hasDepositPaid =
        (depositDateRaw && String(depositDateRaw).trim().length > 0) ||
        (depositAmount !== null && depositAmount > 0);

      if (!hasDepositPaid) continue;
      confirmed += 1;

      if (eventDateISO !== queryDateISO) continue;

      reserved += 1;
      if (eventIdIdx >= 0) {
        const eventId = String(row[eventIdIdx] || "").trim();
        if (eventId) matchedEventIds.push(eventId);
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
          confirmed_rows: confirmed,
          matched_rows: reserved,
          sample_matched_event_ids: matchedEventIds.slice(0, 5)
        }
      });
    }

    return Response.json(output);
  } catch (error) {
    console.error("[availability] Error:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
