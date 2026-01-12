import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    has_SUPABASE_URL: !!process.env.SUPABASE_URL,
    has_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_MOLLIE_API_KEY: !!process.env.MOLLIE_API_KEY,
    has_WEBHOOK_SECRET: !!process.env.MOLLIE_WEBHOOK_SECRET,
    app_env: !!process.env.APP_ENV,
    app_url: !!process.env.APP_URL,
  });
}
