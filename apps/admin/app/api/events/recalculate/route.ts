import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const ORIGIN_ADDRESS = "Boulevard Edmond Machtens 119, 1080 Bruxelles, Belgique";

function roundTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventId = body?.event_id as string | undefined;
    const addressOverride = body?.address as string | undefined;

    if (!eventId) {
      return NextResponse.json({ error: "event_id missing" }, { status: 400 });
    }

    // Read event from Supabase
    const supabase = createSupabaseServerClient();
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("event_id", eventId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const destination = addressOverride || event.address;
    if (!destination) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY missing" }, { status: 500 });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", ORIGIN_ADDRESS);
    url.searchParams.set("destinations", destination);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json({ error: "Google API error" }, { status: 502 });
    }
    const data = await res.json();
    const element = data?.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return NextResponse.json({ error: "No route found" }, { status: 400 });
    }

    const meters = element.distance?.value ?? 0;
    const durationSeconds = element.duration?.value ?? 0;
    const kmOneWay = roundTwo(meters / 1000);
    const kmTotal = roundTwo(kmOneWay * 4); // Aller-retour x2

    // Heures étudiant = (temps aller x 4) + 60 min installation, arrondi au 0.5 supérieur
    const minutesTotal = (durationSeconds * 4) + 3600; // 4 trajets + 60 min
    const heuresReelles = minutesTotal / 3600;
    const studentHours = Math.ceil(heuresReelles * 2) / 2; // Arrondi au 0.5 supérieur

    const studentRateCents = 1400; // 14€/h
    const fuelCostCents = Math.round(kmTotal * 0.15 * 100); // 0.15€/km

    // Update event in Supabase
    const { error: updateError } = await supabase
      .from("events")
      .update({
        address: addressOverride || event.address,
        student_hours: studentHours,
        student_rate_cents: studentRateCents,
        km_one_way: kmOneWay,
        km_total: kmTotal,
        fuel_cost_cents: fuelCostCents,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId);

    if (updateError) {
      console.error("[recalculate] Erreur Supabase:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      km_one_way: kmOneWay,
      km_total: kmTotal,
      student_hours: studentHours,
      student_rate_cents: studentRateCents,
      fuel_cost_cents: fuelCostCents
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
