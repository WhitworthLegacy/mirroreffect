import { NextResponse } from "next/server";
import { gasPost } from "@/lib/gas";

/**
 * API route pour envoyer des leads vers Google Apps Script
 * Proxy server-side pour éviter d'exposer GAS_WEBAPP_URL au client
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Valider que le payload existe
    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Appeler GAS via la fonction robuste
    const result = await gasPost(payload);

    // GAS retourne { ok: true } ou { ok: false, error: "..." }
    if (result && typeof result === "object" && "ok" in result) {
      const gasResult = result as { ok?: boolean; error?: string };
      if (gasResult.ok === false) {
        return NextResponse.json(
          { ok: false, error: gasResult.error || "Unknown error" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Si pas de format attendu, retourner tel quel
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /leads] Error:", error);
    
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
