import { gasPost } from "@/lib/gas";

// Health check - mirrors hardcoded to 4 for MVP
const TOTAL_MIRRORS = 4;

export async function GET() {
  try {
    // Read Clients sheet to count today's reservations
    const result = await gasPost({
      action: "readSheet",
      key: process.env.GAS_KEY,
      data: { sheetName: "Clients" }
    });

    let todayReservations = 0;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (result.ok && result.data) {
      const rows = result.data as unknown[][];
      if (rows.length >= 2) {
        const headers = (rows[0] as string[]).map(h => String(h).trim());
        const dateIdx = headers.findIndex(h => h === "Date Event");
        const depositPaidIdx = headers.findIndex(h => h === "Date Acompte Payé" || h === "Date acompte payé");

        if (dateIdx >= 0) {
          todayReservations = rows.slice(1).filter(row => {
            // Only count rows with paid deposit
            if (depositPaidIdx >= 0) {
              const depositPaid = String(row[depositPaidIdx] || "").trim();
              if (!depositPaid) return false;
            }

            const eventDate = String(row[dateIdx] || "").trim();
            if (eventDate === today) return true;
            // Handle DD/MM/YYYY format
            const match = eventDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (match) {
              const normalized = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
              return normalized === today;
            }
            return false;
          }).length;
        }
      }
    }

    return Response.json({
      ok: true,
      mirrors_total: TOTAL_MIRRORS,
      today_reservations: todayReservations,
      today_remaining: Math.max(0, TOTAL_MIRRORS - todayReservations),
      date: today
    });
  } catch (error) {
    console.error("[health] Error:", error);
    return Response.json({
      ok: true,
      mirrors_total: TOTAL_MIRRORS,
      today_reservations: 0,
      today_remaining: TOTAL_MIRRORS,
      error: "sheets_unavailable"
    });
  }
}
