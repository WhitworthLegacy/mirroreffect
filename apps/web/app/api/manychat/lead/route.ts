import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { generateLeadId } from "@/lib/date-utils";
import { normalizeDateToISO } from "@/lib/date";

interface ManyChatLeadPayload {
  subscriber_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  event_date?: string;
  event_type?: string;
  address?: string;
  guest_count?: string | number;
}

/**
 * API pour Manychat External Request
 * Capture un lead depuis Manychat
 *
 * POST /api/manychat/lead
 * Body: { subscriber_id, email, first_name, last_name, phone, event_date, event_type, address, guest_count }
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`[manychat-lead][${requestId}] Requête reçue`);

  try {
    const payload: ManyChatLeadPayload = await req.json();

    // Validation
    if (!payload.subscriber_id) {
      return Response.json({
        ok: false,
        error: "Missing subscriber_id",
        requestId,
      }, { status: 400 });
    }

    if (!payload.email) {
      return Response.json({
        ok: false,
        error: "Missing email",
        requestId,
      }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Construire le nom complet
    const clientName = [payload.first_name, payload.last_name]
      .filter(Boolean)
      .join(" ") || "";

    const clientEmail = payload.email.toLowerCase();
    const clientPhone = payload.phone || "";

    console.log(`[manychat-lead][${requestId}] Processing lead:`, {
      subscriberId: payload.subscriber_id,
      email: clientEmail,
      hasPhone: Boolean(clientPhone),
    });

    // Vérifier si un lead existe déjà pour cet email
    const { data: existingLead } = await supabase
      .from("leads")
      .select("lead_id, status, client_email")
      .eq("client_email", clientEmail)
      .maybeSingle();

    if (existingLead) {
      console.log(`[manychat-lead][${requestId}] Lead existant trouvé:`, {
        lead_id: existingLead.lead_id,
        status: existingLead.status,
      });

      // Mettre à jour les infos si nouvelles données disponibles
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (clientName) updates.client_name = clientName;
      if (clientPhone) updates.client_phone = clientPhone;
      if (payload.event_date) {
        updates.event_date = normalizeDateToISO(payload.event_date);
      }
      if (payload.event_type) {
        updates.event_type = payload.event_type;
      }
      if (payload.address) {
        updates.event_location = payload.address;
      }
      if (payload.guest_count) {
        const guestCount = typeof payload.guest_count === 'string'
          ? parseInt(payload.guest_count, 10)
          : payload.guest_count;
        if (!isNaN(guestCount)) {
          updates.guest_count = guestCount;
        }
      }

      const { error: updateError } = await supabase
        .from("leads")
        .update(updates)
        .eq("lead_id", existingLead.lead_id);

      if (updateError) {
        console.error(`[manychat-lead][${requestId}] Update error:`, updateError);
        throw updateError;
      }

      return Response.json({
        ok: true,
        requestId,
        lead_id: existingLead.lead_id,
        updated: true,
        message: "Lead mis à jour avec succès",
      });
    }

    // Créer un nouveau lead
    const leadId = generateLeadId();

    const { error: insertError } = await supabase.from("leads").insert({
      lead_id: leadId,
      status: "progress",
      step: 5,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      language: "fr",
      event_date: payload.event_date
        ? normalizeDateToISO(payload.event_date)
        : null,
      event_type: payload.event_type || null,
      event_location: payload.address || "",
      guest_count: payload.guest_count
        ? (typeof payload.guest_count === 'string'
            ? parseInt(payload.guest_count, 10)
            : payload.guest_count)
        : null,
      utm_source: "manychat",
      utm_medium: "messenger",
      utm_campaign: "chatbot",
    });

    if (insertError) {
      console.error(`[manychat-lead][${requestId}] DB error:`, insertError);
      throw insertError;
    }

    console.log(`[manychat-lead][${requestId}] Lead créé:`, {
      lead_id: leadId,
      subscriber_id: payload.subscriber_id,
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
    console.error(`[manychat-lead][${requestId}] Error:`, errorMsg);
    return Response.json(
      { ok: false, requestId, error: errorMsg },
      { status: 500 }
    );
  }
}
