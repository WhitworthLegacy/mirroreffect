import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const CSV_PATH = path.join(process.cwd(), "../../../files/clients.csv");

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, serviceKey);

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || "";
    });
    return row;
  });
}

async function importStudentsData() {
  console.log("Reading CSV file...");
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(csvContent);

  console.log(`Found ${rows.length} rows`);

  // Group by Event ID and update event_finance table
  for (const row of rows) {
    const eventId = row["Event ID"];
    if (!eventId) continue;

    const studentName = row["Etudiant"];
    const studentHours = parseFloat(row["Heures Etudiant"]) || 0;
    const studentRateEuros = parseFloat(row["Etudiant €/Event"]) || 0;
    const kmOneWay = parseFloat(row["KM (Aller)"]) || 0;
    const kmTotal = parseFloat(row["KM (Total)"]) || 0;
    const fuelCostEuros = parseFloat(row["Coût Essence"]) || 0;
    const commercialName = row["Commercial"];
    const commercialCommEuros = parseFloat(row["Comm Commercial"]) || 0;
    const grossMarginEuros = parseFloat(row["Marge Brut (Event)"]) || 0;

    if (!studentName) continue;

    const financeData = {
      event_id: eventId,
      student_name: studentName,
      student_hours: studentHours,
      student_rate_cents: Math.round(studentRateEuros * 100),
      km_one_way: kmOneWay,
      km_total: kmTotal,
      fuel_cost_cents: Math.round(fuelCostEuros * 100),
      commercial_name: commercialName || null,
      commercial_commission_cents: Math.round(commercialCommEuros * 100),
      gross_margin_cents: Math.round(grossMarginEuros * 100)
    };

    // Upsert into event_finance
    const { error } = await supabase
      .from("event_finance")
      .upsert(financeData, { onConflict: "event_id" });

    if (error) {
      console.error(`Error upserting event ${eventId}:`, error);
    } else {
      console.log(`✓ Imported finance data for event ${eventId}`);
    }
  }

  console.log("Import complete!");
}

importStudentsData().catch(console.error);
