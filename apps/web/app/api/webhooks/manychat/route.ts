import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { generateLeadId } from "@/lib/date-utils";
import { normalizeDateToISO } from "@/lib/date";
import { MANYCHAT_CONFIG } from "@/lib/manychat/config";

interface ManyChatWebhookPayload {
  subscriber_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  custom_fields?: {
    event_date?: string;
    event_type?: string;
    address?: string;
    guest_count?: string;
  };
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`[manychat-webhook][${requestId}] Requête reçue`);

  // Validation du secret webhook
  const secret = req.headers.get("x-manychat-secret");
  if (secret !== MANYCHAT_CONFIG.webhookSecret) {
    console.warn(`[manychat-webhook][${requestId}] Secret invalide`);
    return Response.json(
      { ok: false, requestId, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Parse payload
  let payload: ManyChatWebhookPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error(`[manychat-webhook][${requestId}] Invalid JSON:`, error);
    return Response.json(
      { ok: false, requestId, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const subscriberId = payload.subscriber_id;
  if (!subscriberId) {
    console.warn(`[manychat-webhook][${requestId}] Missing subscriber_id`);
    return Response.json(
      { ok: false, requestId, error: "Missing subscriber_id" },
      { status: 400 }
    );
  }

  const clientName = [payload.first_name, payload.last_name]
    .filter(Boolean)
    .join(" ");
  const clientEmail = payload.email?.toLowerCase() || "";
  const clientPhone = payload.phone || "";

  console.log(`[manychat-webhook][${requestId}] Processing lead:`, {
    subscriberId,
    hasEmail: Boolean(clientEmail),
    hasPhone: Boolean(clientPhone),
  });

  const supabase = createSupabaseServerClient();

  try {
    // Vérifier si un lead existe déjà pour ce subscriber_id
    const { data: existingLead } = await supabase
      .from("leads")
      .select("lead_id, client_email")
      .eq("manychat_subscriber_id", subscriberId)
      .maybeSingle();

    if (existingLead) {
      console.log(`[manychat-webhook][${requestId}] Lead existant trouvé:`, {
        lead_id: existingLead.lead_id,
      });

      // Mettre à jour les infos si nouvelles données disponibles
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (clientName) updates.client_name = clientName;
      if (clientEmail) updates.client_email = clientEmail;
      if (clientPhone) updates.client_phone = clientPhone;
      if (payload.custom_fields?.event_date) {
        updates.event_date = normalizeDateToISO(payload.custom_fields.event_date);
      }
      if (payload.custom_fields?.event_type) {
        updates.event_type = payload.custom_fields.event_type;
      }
      if (payload.custom_fields?.address) {
        updates.event_location = payload.custom_fields.address;
      }
      if (payload.custom_fields?.guest_count) {
        updates.guest_count = parseInt(payload.custom_fields.guest_count, 10);
      }

      const { error: updateError } = await supabase
        .from("leads")
        .update(updates)
        .eq("lead_id", existingLead.lead_id);

      if (updateError) {
        console.error(`[manychat-webhook][${requestId}] Update error:`, updateError);
        throw updateError;
      }

      return Response.json({
        ok: true,
        requestId,
        lead_id: existingLead.lead_id,
        updated: true,
      });
    }

    // Créer un nouveau lead
    const leadId = generateLeadId();

    const { error: insertError } = await supabase.from("leads").insert({
      lead_id: leadId,
      manychat_subscriber_id: subscriberId,
      status: "progress",
      step: 5,
      client_name: clientName || "",
      client_email: clientEmail,
      client_phone: clientPhone,
      language: "fr",
      event_date: payload.custom_fields?.event_date
        ? normalizeDateToISO(payload.custom_fields.event_date)
        : null,
      event_type: payload.custom_fields?.event_type || null,
      event_location: payload.custom_fields?.address || "",
      guest_count: payload.custom_fields?.guest_count
        ? parseInt(payload.custom_fields.guest_count, 10)
        : null,
      utm_source: "manychat",
      utm_medium: "messenger",
      utm_campaign: "chatbot",
    });

    if (insertError) {
      console.error(`[manychat-webhook][${requestId}] DB error:`, insertError);
      throw insertError;
    }

    console.log(`[manychat-webhook][${requestId}] Lead créé:`, {
      lead_id: leadId,
      subscriber_id: subscriberId,
    });

    return Response.json({
      ok: true,
      requestId,
      lead_id: leadId,
      created: true,
      message: "Lead créé avec succès",
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[manychat-webhook][${requestId}] Error:`, errorMsg);
    return Response.json(
      { ok: false, requestId, error: errorMsg },
      { status: 500 }
    );
  }
}
