import { gasPost } from "@/lib/gas";

export async function GET() {
  try {
    const result = await gasPost({
      action: "readSheet",
      key: process.env.GAS_KEY,
      data: { sheetName: "Clients" }
    });

    const values = result.values as unknown[][] | undefined;
    if (!values || values.length < 2) {
      return Response.json({ error: "no_data", result });
    }

    const headers = (values[0] as string[]).map(h => String(h).trim());
    const dateIdx = headers.findIndex(h => h === "Date Event");

    // Retourner les 10 premieres lignes avec leurs dates
    const sample = values.slice(1, 11).map((row, i) => ({
      row: i + 1,
      raw_date: row[dateIdx],
      type: typeof row[dateIdx],
    }));

    return Response.json({
      headers,
      dateColumnIndex: dateIdx,
      totalRows: values.length - 1,
      sample
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
