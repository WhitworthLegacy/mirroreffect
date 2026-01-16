// Health check - mirrors hardcoded to 4 for MVP
const TOTAL_MIRRORS = 4;

export async function GET() {
  return Response.json({
    ok: true,
    mirrors_count: TOTAL_MIRRORS,
    source: "hardcoded"
  });
}
