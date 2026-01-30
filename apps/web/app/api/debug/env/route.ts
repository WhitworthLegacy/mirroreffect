import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    has_GAS_WEBAPP_URL: !!process.env.GAS_WEBAPP_URL,
    has_GAS_KEY: !!process.env.GAS_KEY,
    has_MOLLIE_API_KEY: !!process.env.MOLLIE_API_KEY,
    has_WEBHOOK_SECRET: !!process.env.MOLLIE_WEBHOOK_SECRET,
    app_env: !!process.env.APP_ENV,
    app_url: !!process.env.APP_URL,
  });
}
