/**
 * Script d'import CSV vers Supabase
 *
 * Usage: npx tsx scripts/import-csv-to-supabase.ts <path-to-csv>
 *
 * Le CSV doit avoir les colonnes suivantes (basé sur Clients.csv):
 * - Nom, Email, Phone, Language, Date Event, Lieu Event, Type Event
 * - Pack, Total, Transport (€), Acompte, Solde Restant
 * - Etudiant, Heures Etudiant, Etudiant €/Event
 * - KM (Aller), KM (Total), Coût Essence
 * - Commercial, Comm Commercial, Marge Brut (Event)
 * - Event ID, Acompte Facture, Solde Facture
 * - Date acompte payé (-> closing_date)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Charger les variables d'environnement
const dotenvPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(dotenvPath)) {
  const envContent = fs.readFileSync(dotenvPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse un nombre européen (1.234,56 ou 1234,56 ou 1234.56)
function parseEuroNumber(value: string | undefined | null): number | null {
  if (!value || value.trim() === "" || value === "—") return null;
  // Enlever le symbole €
  let cleaned = value.replace(/€/g, "").trim();
  // Si on a une virgule, c'est le format européen
  if (cleaned.includes(",")) {
    // Enlever les points (séparateurs de milliers)
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse un nombre et le convertir en cents
function parseEuroCents(value: string | undefined | null): number | null {
  const num = parseEuroNumber(value);
  return num === null ? null : Math.round(num * 100);
}

// Parse une date (formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
function parseDate(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  const v = value.trim();

  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // Format DD/MM/YYYY ou DD-MM-YYYY
  const m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    const year = m[3];
    return `${year}-${month}-${day}`;
  }

  return null;
}

// Générer un event_id unique si non fourni
function generateEventId(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Parse le CSV
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n").filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

// Mapper une ligne CSV vers un event Supabase
function mapRowToEvent(row: Record<string, string>): { data: Record<string, unknown>; csvEventId: string | null } | null {
  // Event ID du CSV (pour vérifier les doublons)
  const csvEventId = row["Event ID"]?.trim() || null;

  // Ignorer les lignes sans date d'event
  const eventDate = parseDate(row["Date Event"]);
  if (!eventDate) {
    console.log(`  ⚠️ Skipping row without event date: ${row["Nom"] || csvEventId || "unknown"}`);
    return null;
  }

  return {
    csvEventId,
    data: {
      event_date: eventDate,
      event_type: row["Type Event"]?.trim() || null,
      language: row["Language"]?.trim().toLowerCase() || "fr",
      client_name: row["Nom"]?.trim() || null,
      client_email: row["Email"]?.trim() || null,
      client_phone: row["Phone"]?.trim() || null,
      address: row["Lieu Event"]?.trim() || null,
      // pack_id omis car nécessite UUID de la table packs
      guest_count: parseEuroNumber(row["Invités"]),
      total_cents: parseEuroCents(row["Total"]) || parseEuroCents(row["Pack (€)"]),
      transport_fee_cents: parseEuroCents(row["Transport (€)"]),
      deposit_cents: parseEuroCents(row["Acompte"]),
      balance_due_cents: parseEuroCents(row["Solde Restant"]),
      student_name: row["Etudiant"]?.trim() || null,
      student_hours: parseEuroNumber(row["Heures Etudiant"]),
      student_rate_cents: parseEuroCents(row["Etudiant €/Event"]),
      km_one_way: parseEuroNumber(row["KM (Aller)"]),
      km_total: parseEuroNumber(row["KM (Total)"]),
      fuel_cost_cents: parseEuroCents(row["Coût Essence"]),
      commercial_name: row["Commercial"]?.trim() || null,
      commercial_commission_cents: parseEuroCents(row["Comm Commercial"]),
      deposit_invoice_ref: row["Acompte Facture"]?.trim() || null,
      balance_invoice_ref: row["Solde Facture"]?.trim() || null,
      closing_date: parseDate(row["Date acompte payé"]) || parseDate(row["Date Formulaire"]),
      status: "active",
      balance_status: (parseEuroCents(row["Solde Restant"]) ?? 0) > 0 ? "due" : "paid",
    }
  };
}

async function main() {
  const csvPath = process.argv[2] || "/Users/macbook/Dev/clients/mirroreffect/files/csv/Clients.csv";

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`\n📂 Reading CSV: ${csvPath}\n`);
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  console.log(`Found ${rows.length} rows\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const result = mapRowToEvent(row);
    if (!result) {
      skipped++;
      continue;
    }

    const { data: event, csvEventId } = result;
    const clientName = event.client_name as string || "Unknown";
    const clientEmail = event.client_email as string || "";

    try {
      // Check if event already exists by client_email + event_date
      const eventDate = event.event_date as string;
      let existing = null;

      if (clientEmail) {
        const { data } = await supabase
          .from("events")
          .select("id")
          .eq("client_email", clientEmail)
          .eq("event_date", eventDate)
          .single();
        existing = data;
      }

      if (existing) {
        // Update
        const { error } = await supabase
          .from("events")
          .update({ ...event, updated_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (error) {
          console.log(`  ❌ Error updating ${clientName}: ${error.message}`);
          errors++;
        } else {
          console.log(`  ✏️ Updated: ${clientName} (${eventDate})`);
          updated++;
        }
      } else {
        // Insert
        const { error } = await supabase.from("events").insert(event);

        if (error) {
          console.log(`  ❌ Error inserting ${clientName}: ${error.message}`);
          errors++;
        } else {
          console.log(`  ✅ Inserted: ${clientName} (${eventDate})`);
          inserted++;
        }
      }
    } catch (err) {
      console.log(`  ❌ Exception for ${clientName}: ${err}`);
      errors++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ✏️ Updated: ${updated}`);
  console.log(`   ⏭️ Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📁 Total: ${rows.length}\n`);
}

main().catch(console.error);
