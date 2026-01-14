import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const CSV_DIR = path.join(process.cwd(), "../../../files/csv");

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, serviceKey);

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n").filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] || "").trim();
    });
    return row;
  });
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === "") return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function parseNumber(numStr: string): number | null {
  if (!numStr || numStr === "") return null;
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

async function importStudents() {
  console.log("\n📚 Importing Students data...");
  const csvContent = fs.readFileSync(path.join(CSV_DIR, "students.csv"), "utf-8");
  const rows = parseCSV(csvContent);

  for (const row of rows) {
    const date = parseDate(row["Date"]);
    if (!date) continue;

    const data = {
      month: date,
      student_name: row["Etudiant"] || null,
      hours_raw: parseNumber(row["Heures"]),
      hours_adjusted: parseNumber(row["Heures corrigés"]),
      remuneration_cents: Math.round((parseNumber(row["Rémunération"]) || 0) * 100),
    };

    const { error } = await supabase
      .from("student_monthly_stats")
      .upsert(data, { onConflict: "month,student_name" });

    if (error) {
      console.error(`Error importing student data for ${date}:`, error);
    } else {
      console.log(`✓ Imported student stats for ${data.student_name} - ${date}`);
    }
  }
}

async function importCommercial() {
  console.log("\n📞 Importing Commercial data...");
  const csvContent = fs.readFileSync(path.join(CSV_DIR, "commercial.csv"), "utf-8");
  const rows = parseCSV(csvContent);

  for (const row of rows) {
    const date = parseDate(row["Date"]);
    if (!date || !row["Commercial"]) continue;

    const data = {
      month: date,
      commercial_name: row["Commercial"],
      total_calls: parseNumber(row["Total Calls"]),
      calls_under_30s: parseNumber(row["< 30 secs (no reply)"]),
      calls_over_30s: parseNumber(row["> 30 secs"]),
      calls_over_1min: parseNumber(row["> 1 min"]),
      calls_over_2min: parseNumber(row["> 2 min"]),
      calls_over_5min: parseNumber(row["> 5 min"]),
      calls_over_5min_pct: parseNumber(row["> 5 min (%)"]),
      bonus_calls_cents: Math.round((parseNumber(row["Bonus > 5 min"]) || 0) * 100),
      calls_answered: parseNumber(row["Calls answered"]),
      closed_deals: parseNumber(row["Closed"]),
      conversion_pct: parseNumber(row["Conversion (%)"]),
      commissions_cents: Math.round((parseNumber(row["Commissions TVAC"]) || 0) * 100),
      bonus_conversion_cents: Math.round((parseNumber(row["Bonus Conv (%)"]) || 0) * 100),
      callbacks_scheduled: parseNumber(row["CB planifiés"]),
      callbacks_completed: parseNumber(row["CB réalisés"]),
      callbacks_completion_pct: parseNumber(row["CB réalisés (%)"]),
      bonus_callbacks_cents: Math.round((parseNumber(row["Bonus CB"]) || 0) * 100),
      total_bonus_cents: Math.round((parseNumber(row["Total Bonus TVAC"]) || 0) * 100),
      total_tvac_cents: Math.round((parseNumber(row["Total TVAC"]) || 0) * 100),
      total_htva_cents: Math.round((parseNumber(row["Total HTVA"]) || 0) * 100),
    };

    const { error } = await supabase
      .from("commercial_monthly_stats")
      .upsert(data, { onConflict: "month,commercial_name" });

    if (error) {
      console.error(`Error importing commercial data for ${date}:`, error);
    } else {
      console.log(`✓ Imported commercial stats for ${data.commercial_name} - ${date}`);
    }
  }
}

async function importStats() {
  console.log("\n📊 Importing Stats data...");
  const csvContent = fs.readFileSync(path.join(CSV_DIR, "stats.csv"), "utf-8");
  const rows = parseCSV(csvContent);

  for (const row of rows) {
    const date = parseDate(row["Date"]);
    if (!date) continue;

    const data = {
      month: date,
      leads_meta: parseNumber(row["# Leads META"]),
      spent_meta_cents: Math.round((parseNumber(row["Spent META"]) || 0) * 100),
      cpl_meta_cents: Math.round((parseNumber(row["CPL META"]) || 0) * 100),
      closing_meta: parseNumber(row["# closing META"]),
      conversion_meta_pct: parseNumber(row["Conversion (%) META"]),
      cpa_meta_cents: Math.round((parseNumber(row["CPA META"]) || 0) * 100),
      leads_total: parseNumber(row["# Leads Total"]),
      cpl_total_cents: Math.round((parseNumber(row["CPL Total"]) || 0) * 100),
      closing_total: parseNumber(row["# closing Total"]),
      conversion_total_pct: parseNumber(row["Conversion (%) total"]),
      cpa_total_cents: Math.round((parseNumber(row["CPA G"]) || 0) * 100),
      closing_decouverte: parseNumber(row["# C.Découverte"]),
      closing_essentiel: parseNumber(row["# C.Essentiel"]),
      closing_premium: parseNumber(row["# C.Premium"]),
      deposits_paid_cents: Math.round((parseNumber(row["Acomptes (payés)"]) || 0) * 100),
      events_count: parseNumber(row["# Events"]),
      events_decouverte: parseNumber(row["# E.Découverte"]),
      events_essentiel: parseNumber(row["# E.Essentiel"]),
      events_premium: parseNumber(row["# E.Premium"]),
      total_event_cents: Math.round((parseNumber(row["Total (event)"]) || 0) * 100),
      deposits_event_cents: Math.round((parseNumber(row["Acomptes (event)"]) || 0) * 100),
      remaining_event_cents: Math.round((parseNumber(row["Restants (event)"]) || 0) * 100),
      ca_total_cents: Math.round((parseNumber(row["CA (Acomptes + Restants)"]) || 0) * 100),
      ca_generated_cents: Math.round((parseNumber(row["CA généré (Event + Transport)"]) || 0) * 100),
      transport_cents: Math.round((parseNumber(row["€ transport (Ev. Réalisés)"]) || 0) * 100),
      pack_cost_cents: Math.round((parseNumber(row["Coût packs (Ev. Réalisés)"]) || 0) * 100),
      student_hours: parseNumber(row["Heures étudiants"]),
      student_cost_cents: Math.round((parseNumber(row["Coût staff étudiants"]) || 0) * 100),
      fuel_cost_cents: Math.round((parseNumber(row["Essence"]) || 0) * 100),
      commercial_commission_cents: Math.round((parseNumber(row["Comm Commerciaux"]) || 0) * 100),
      fixed_charges_cents: Math.round((parseNumber(row["Charges fixes mensuelles"]) || 0) * 100),
      gross_margin_cents: Math.round((parseNumber(row["Marge brute opé. (Events)"]) || 0) * 100),
      net_margin_cents: Math.round((parseNumber(row["Marge nette opé. (Events)"]) || 0) * 100),
      cashflow_gross_cents: Math.round((parseNumber(row["Cashflow Brut (mensuel)"]) || 0) * 100),
      cashflow_net_cents: Math.round((parseNumber(row["Cashflow Net (mensuel)"]) || 0) * 100),
    };

    const { error } = await supabase
      .from("monthly_stats")
      .upsert(data, { onConflict: "month" });

    if (error) {
      console.error(`Error importing stats for ${date}:`, error);
    } else {
      console.log(`✓ Imported stats for ${date}`);
    }
  }
}

async function importCompta() {
  console.log("\n💰 Importing Compta (accounting) data...");
  const csvContent = fs.readFileSync(path.join(CSV_DIR, "compta.csv"), "utf-8");
  const rows = parseCSV(csvContent);

  let imported = 0;
  for (const row of rows) {
    const date = parseDate(row["Date valeur"]);
    if (!date || !row["Nom de la contrepartie"]) continue;

    const amount = parseNumber(row["Montant"]);
    if (amount === null || amount === 0) continue;

    const data = {
      transaction_date: date,
      counterparty: row["Nom de la contrepartie"],
      amount_cents: Math.round(amount * 100),
      sent_to_accountant: row["Envoyé chez le Comptable"] === "True",
    };

    const { error } = await supabase
      .from("accounting_transactions")
      .insert(data);

    if (error) {
      console.error(`Error importing transaction for ${date}:`, error);
    } else {
      imported++;
    }
  }
  console.log(`✓ Imported ${imported} accounting transactions`);
}

async function main() {
  console.log("🚀 Starting data import...\n");

  try {
    await importStudents();
    await importCommercial();
    await importStats();
    await importCompta();

    console.log("\n✅ All data imported successfully!");
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  }
}

main();
