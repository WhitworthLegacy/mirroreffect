import { readCommercialStatsFromSheets } from "@/lib/googleSheets";
import { formatCurrency } from "@/lib/format";
import CommercialPageClient from "./CommercialPageClient";

export default async function CommercialPage() {
  let error: string | null = null;
  let stats: Array<{
    month: string;
    commercial_name: string;
    [key: string]: unknown;
  }> = [];

  try {
    stats = await readCommercialStatsFromSheets();
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les données.";
  }

  return <CommercialPageClient initialStats={stats} error={error} />;
}

