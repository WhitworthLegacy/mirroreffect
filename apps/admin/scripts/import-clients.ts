import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Pack name to ID mapping (will be populated from DB)
let packMapping: Record<string, string> = {};

function parseNumber(value: string | undefined | null): number | null {
  if (!value || value.trim() === "") return null;
  const cleaned = value.replace(",", ".").replace(/[^\d.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function eurosToCents(euros: number | null): number | null {
  if (euros === null) return null;
  return Math.round(euros * 100);
}

function parseDate(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  // Format: 2025-01-11 00:00:00
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

function getPackId(packName: string | undefined | null): string | null {
  if (!packName) return null;
  const normalized = packName.toLowerCase().trim();
  if (normalized.includes("découverte") || normalized.includes("decouverte")) {
    return packMapping["decouverte"] || null;
  }
  if (normalized.includes("essentiel")) {
    return packMapping["essentiel"] || null;
  }
  if (normalized.includes("premium")) {
    return packMapping["premium"] || null;
  }
  return null;
}

function determineEventType(type: string | undefined | null): string | null {
  if (!type) return null;
  const normalized = type.toLowerCase().trim();
  if (normalized.includes("mariage") || normalized.includes("marriage")) return "wedding";
  if (normalized.includes("b2b")) return "corporate";
  if (normalized.includes("anniversaire")) return "birthday";
  if (normalized.includes("bapteme") || normalized.includes("baptême")) return "baptism";
  if (normalized.includes("baby")) return "babyshower";
  return "other";
}

async function loadPackMapping() {
  const { data: packs, error } = await supabase
    .from("packs")
    .select("id, code, name_fr");

  if (error) {
    console.error("Error loading packs:", error);
    return;
  }

  for (const pack of packs || []) {
    if (pack.code) {
      packMapping[pack.code.toLowerCase()] = pack.id;
    }
    if (pack.name_fr) {
      const name = pack.name_fr.toLowerCase();
      if (name.includes("découverte") || name.includes("decouverte")) {
        packMapping["decouverte"] = pack.id;
      } else if (name.includes("essentiel")) {
        packMapping["essentiel"] = pack.id;
      } else if (name.includes("premium")) {
        packMapping["premium"] = pack.id;
      }
    }
  }
  console.log("Pack mapping loaded:", packMapping);
}

async function importClients() {
  const csvPath = path.join(__dirname, "../../../files/csv/clients.csv");

  if (!fs.existsSync(csvPath)) {
    console.error("CSV file not found:", csvPath);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  console.log(`Found ${records.length} records in CSV`);

  await loadPackMapping();

  // Clear existing data
  console.log("Clearing existing events...");
  await supabase.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    const eventDate = parseDate(record["Date Event"]);
    const closingDate = parseDate(record["Date Closing"]) || parseDate(record["Date Signature"]);

    // Skip rows without event date
    if (!eventDate) {
      skipped++;
      continue;
    }

    const totalEuros = parseNumber(record["Total"]) || parseNumber(record["Pack (€)"]);
    const transportEuros = parseNumber(record["Transport (€)"]);
    const depositEuros = parseNumber(record["Acompte"]);
    const balanceEuros = parseNumber(record["Solde Restant"]);

    // Parse guest count
    const guestCount = parseNumber(record["Invités"]);

    // Parse finance data (now in same table as events)
    const studentName = record["Etudiant"];
    const studentHours = parseNumber(record["Heures Etudiant"]);
    const kmOneWay = parseNumber(record["KM (Aller)"]);
    const kmTotal = parseNumber(record["KM (Total)"]);
    const fuelCost = parseNumber(record["Coût Essence"]);
    const commercialName = record["Commercial"];
    const commercialComm = parseNumber(record["Comm Commercial"]);

    // Create event with all data (including finance fields)
    const eventData = {
      // Core event fields
      event_date: eventDate,
      closing_date: closingDate,
      event_type: determineEventType(record["Type Event"]),
      language: record["Language"]?.toUpperCase() === "NL" ? "nl" : "fr",
      client_name: record["Nom"] || null,
      client_email: record["Email"] || null,
      client_phone: record["Phone"] || null,
      address: record["Lieu Event"] || null,
      pack_id: getPackId(record["Pack"]),
      total_cents: eurosToCents(totalEuros),
      transport_fee_cents: eurosToCents(transportEuros),
      deposit_cents: eurosToCents(depositEuros),
      balance_due_cents: eurosToCents(balanceEuros),
      guest_count: guestCount ? Math.round(guestCount) : null,
      status: balanceEuros === 0 ? "confirmed" : "pending",
      balance_status: balanceEuros === 0 ? "paid" : "partial",
      // Finance fields (formerly in event_finance)
      student_name: studentName || null,
      student_hours: studentHours,
      student_rate_cents: 1400, // 14€/h default rate
      km_one_way: kmOneWay,
      km_total: kmTotal,
      fuel_cost_cents: eurosToCents(fuelCost),
      commercial_name: commercialName || null,
      commercial_commission_cents: eurosToCents(commercialComm),
      // Invoice references for ZenFacture
      deposit_invoice_ref: record["Ref Facture Acompte"] || null,
      balance_invoice_ref: record["Ref Facture Solde"] || null,
      invoice_deposit_paid: record["Acompte Payé"]?.toLowerCase() === "oui" || record["Acompte Payé"]?.toLowerCase() === "true",
      invoice_balance_paid: record["Solde Payé"]?.toLowerCase() === "oui" || record["Solde Payé"]?.toLowerCase() === "true",
    };

    const { error: eventError } = await supabase
      .from("events")
      .insert(eventData);

    if (eventError) {
      console.error("Error inserting event:", eventError.message, record["Nom"]);
      skipped++;
      continue;
    }

    imported++;
    if (imported % 20 === 0) {
      console.log(`Imported ${imported} events...`);
    }
  }

  console.log(`\nImport complete!`);
  console.log(`- Imported: ${imported}`);
  console.log(`- Skipped: ${skipped}`);
}

importClients().catch(console.error);
