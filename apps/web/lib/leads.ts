import { formatEuros, generateLeadId } from "@/lib/date-utils";
import { toDDMMYYYY } from "@/lib/date";
import { getLeadId, getUTMParams, setLeadId } from "@/lib/tracking";
import type { ReservationDraft } from "@/lib/reservationDraft";

type PersistLeadOptions = {
  step: number;
  status?: string;
  draft: ReservationDraft;
};

export type PersistLeadResult = {
  leadId: string | null;
  created: boolean;
};

const DEFAULT_LANGUAGE: ReservationDraft["customer"]["language"] = "fr";

function formatEurosValue(value?: number): string {
  if (typeof value !== "number") {
    return "";
  }
  return formatEuros(value);
}

function buildFullName(firstName?: string, lastName?: string): string {
  return `${firstName?.trim() || ""} ${lastName?.trim() || ""}`.trim();
}

export async function persistLeadToLeads({ step, status, draft }: PersistLeadOptions): Promise<PersistLeadResult> {
  if (typeof window === "undefined") {
    return { leadId: null, created: false };
  }

  const storedLeadId = draft.leadId || getLeadId();
  let leadId = storedLeadId;

  if (!leadId) {
    leadId = generateLeadId();
    setLeadId(leadId);
  }

  const language = draft.customer.language || DEFAULT_LANGUAGE;
  const clientName = buildFullName(draft.customer.firstName, draft.customer.lastName);
  const clientEmail = draft.customer.email?.trim() || "";
  const clientPhone = draft.customer.phone?.trim() || "";
  const eventDate = toDDMMYYYY(draft.event.dateEvent || draft.event.lieuEvent || "") || "";
  const address = draft.event.address || draft.event.lieuEvent || "";
  const packCode = draft.event.pack || "";
  const guests = draft.event.invites || "";
  const transport = formatEurosValue(draft.event.transport);
  const total = formatEurosValue(draft.event.total);
  const deposit = formatEurosValue(draft.event.acompte);
  const utm = draft.utm || getUTMParams();

  const hasLeadRow = Boolean(storedLeadId);
  const canCreate = !hasLeadRow && Boolean(clientEmail);
  const canUpdate = Boolean(hasLeadRow);

  if (!canCreate && !canUpdate) {
    return { leadId, created: false };
  }

  const payload = {
    event: "lead_progress" as const,
    lead_id: leadId,
    step: step.toString(),
    status: status || `step_${step}_completed`,
    language,
    client_name: clientName,
    client_email: clientEmail,
    client_phone: clientPhone,
    event_date: eventDate,
    address,
    pack_code: packCode,
    guests,
    transport_euros: transport,
    total_euros: total,
    deposit_euros: deposit,
    utm_source: utm.source || "",
    utm_campaign: utm.campaign || "",
    utm_medium: utm.medium || ""
  };

  try {
    const res = await fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    const returnedLeadId = (data && typeof data.lead_id === "string" ? data.lead_id : leadId) || null;

    if (returnedLeadId && returnedLeadId !== leadId) {
      setLeadId(returnedLeadId);
      leadId = returnedLeadId;
    }

    const created = Boolean(data && data.created) || (!hasLeadRow && Boolean(clientEmail) && res.ok);

    if (!res.ok && process.env.NODE_ENV !== "production") {
      console.warn("[leads] persistLeadToLeads: non-200 response", res.status, data);
    }

    return { leadId, created };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[leads] persistLeadToLeads error:", error);
    }
    return { leadId, created: false };
  }
}
