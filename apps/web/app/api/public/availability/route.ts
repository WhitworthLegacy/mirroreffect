import { PublicAvailabilityQuerySchema, PublicAvailabilityResponseSchema } from "@mirroreffect/core";
import { createSupabaseServerClient } from "@/lib/supabase";
import { normalizeDateToISO } from "@/lib/date";

const TOTAL_MIRRORS = 4;

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
    console.error("[availability] Date invalide:", queryDateRaw);
    return Response.json(
      { error: "invalid_date", message: "Date doit être YYYY-MM-DD ou DD/MM/YYYY" },
      { status: 400 }
    );
  }
  const queryDateISO = normalizedQueryDate;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[availability] date brute=${queryDateRaw} normalisée=${queryDateISO}`);
  }

  try {
    const supabase = createSupabaseServerClient();

    // Compter les événements pour la date demandée
    // On compte tous les événements actifs (status != cancelled)
    const { count, error, data } = await supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("event_date", queryDateISO)
      .neq("status", "cancelled");

    if (error) {
      console.error("[availability] Erreur Supabase:", error);
      return Response.json({ error: "database_error" }, { status: 500 });
    }

    const reserved = count || 0;
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
          matched_rows: reserved,
          sample_ids: data?.slice(0, 5).map((e) => e.id) || []
        }
      });
    }

    return Response.json(output);
  } catch (error) {
    console.error("[availability] Erreur:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
