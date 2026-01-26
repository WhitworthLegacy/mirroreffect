import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase";
import { generateLeadId } from "@/lib/date-utils";

const PromoIntentSchema = z.object({
  request_id: z.string().optional(),
  email: z.string().email(),
  locale: z.enum(["fr", "nl"]).default("fr"),
  payload: z.object({
    email: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
    date: z.string().optional(),
    location: z.string().optional(),
    guests: z.string().optional(),
    theme: z.string().optional(),
    priority: z.string().optional()
  }).optional()
});

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const forwardedId = req.headers.get("x-request-id") ?? undefined;
  console.log(`[promo][${requestId}] Requête reçue`, { forwardedId });

  const body = await req.json().catch(() => null);
  const parsed = PromoIntentSchema.safeParse(body);

  if (!parsed.success) {
    console.warn(`[promo][${requestId}] Validation échouée`, parsed.error.format());
    return Response.json(
      { error: "invalid_body", requestId, issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const { email, locale, payload } = parsed.data;
  console.log(`[promo][${requestId}] Payload valide`, { email, locale, payload });

  const supabase = createSupabaseServerClient();

  try {
    // Générer l'ID du lead
    const leadId = generateLeadId();
    const clientName = `${payload?.first_name?.trim() || ""} ${payload?.last_name?.trim() || ""}`.trim();

    // Vérifier si le lead existe déjà par email
    const { data: existingLead } = await supabase
      .from("leads")
      .select("lead_id")
      .eq("email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingLead) {
      // Mettre à jour le lead existant
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          nom: clientName || undefined,
          phone: payload?.phone?.trim() || undefined,
          language: locale.toUpperCase(),
          date_event: payload?.date || undefined,
          lieu_event: payload?.location?.trim() || undefined,
          invites: payload?.guests?.trim() || undefined,
          step: 5,
          status: "progress",
          updated_at: new Date().toISOString(),
        })
        .eq("lead_id", existingLead.lead_id);

      if (updateError) {
        console.error(`[promo][${requestId}] Échec mise à jour lead:`, updateError);
        throw new Error(updateError.message);
      }

      console.log(`[promo][${requestId}] Lead existant mis à jour`, { leadId: existingLead.lead_id });

      return Response.json({
        queued: true,
        requestId,
        lead_id: existingLead.lead_id,
        updated: true
      });
    }

    // Créer un nouveau lead dans Supabase
    const { error: insertError } = await supabase
      .from("leads")
      .insert({
        lead_id: leadId,
        email: email.toLowerCase(),
        nom: clientName || null,
        phone: payload?.phone?.trim() || null,
        language: locale.toUpperCase(),
        date_event: payload?.date || null,
        lieu_event: payload?.location?.trim() || null,
        invites: payload?.guests?.trim() || null,
        step: 5,
        status: "progress",
      });

    if (insertError) {
      console.error(`[promo][${requestId}] Échec création lead:`, insertError);
      throw new Error(insertError.message);
    }

    console.log(`[promo][${requestId}] Lead créé dans Supabase`, { leadId });

    // Note: L'email de nurturing (PROMO_72H) sera envoyé par le cron job
    // /api/cron/send-emails qui vérifie les leads > 72h sans promo_sent_at

    return Response.json({ queued: true, requestId, lead_id: leadId });
  } catch (error) {
    console.error(`[promo][${requestId}] Erreur:`, error);
    return Response.json(
      { error: "internal_error", requestId },
      { status: 500 }
    );
  }
}
