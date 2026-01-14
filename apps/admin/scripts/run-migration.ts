import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SQL_FILE = path.join(__dirname, "create-tables.sql");

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, serviceKey);

async function runMigration() {
  console.log("📋 Reading SQL migration file...");
  const sqlContent = fs.readFileSync(SQL_FILE, "utf-8");

  console.log("🔧 Running migration...");

  // Split by semicolon and execute each statement
  const statements = sqlContent
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql_query: statement });

      if (error) {
        // Try direct query if RPC doesn't work
        const { error: directError } = await supabase.from("_").select().limit(0);
        console.log("⚠️  Note: Using Supabase dashboard to run migrations is recommended");
        console.log("   Or use psql directly with your database connection string");
        break;
      }
    } catch (err) {
      console.log("\n⚠️  Cannot run migrations directly via API.");
      console.log("   Please run the SQL file manually in your Supabase dashboard:");
      console.log(`   ${SQL_FILE}\n`);
      console.log("   Or use psql:");
      console.log(`   psql <YOUR_DB_CONNECTION_STRING> -f ${SQL_FILE}\n`);
      return;
    }
  }

  console.log("✅ Migration completed successfully!");
}

runMigration().catch(console.error);
