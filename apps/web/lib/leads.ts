import { formatEuros, generateLeadId } from "@/lib/date-utils";
import { toDDMMYYYY } from "@/lib/date";
import { getLeadId, getUTMParams, setLeadId } from "@/lib/tracking";
import type { ReservationDraft } from "@/lib/reservationDraft";

type PersistLeadOptions = {
  step: number;
  status?: string;
  draft: ReservationDraft;
  requestId?: string;
};

export type PersistLeadResult = {
  leadId: string | null;
  created: boolean;
  error?: LeadsPersistenceError;
};

export class LeadsPersistenceError extends Error {
  constructor(
    public requestId: string,
    public status?: number,
    public responseBody?: unknown,
    message?: string
  ) {
    super(message || `Leads persistence failed (requestId=${requestId})`);
    this.name = "LeadsPersistenceError";
  }
}

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

export async function persistLeadToLeads({ step, status, draft, requestId }: PersistLeadOptions): Promise<PersistLeadResult> {
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
  const reqId = requestId || crypto.randomUUID();

  const hasLeadRow = Boolean(storedLeadId);
  const canCreate = !hasLeadRow && Boolean(clientEmail);
  const canUpdate = Boolean(hasLeadRow);

  if (!canCreate && !canUpdate) {
    console.warn(`[leads][${reqId}] Skipping persistence (missing leadId/email)`);
    return { leadId, created: false };
  }

  const payload: Record<string, unknown> = {
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
    const { status, data, rawText } = await sendLeadPayload(payload, reqId);
    console.log(`[leads][${reqId}] Received response`, { status, data, rawText });

    const returnedLeadId = (data && typeof (data as Record<string, unknown>).lead_id === "string"
      ? (data as Record<string, unknown>).lead_id
      : leadId) || null;

    if (returnedLeadId && returnedLeadId !== leadId) {
      setLeadId(returnedLeadId);
      leadId = returnedLeadId;
    }

    const created =
      Boolean(data && (data as Record<string, unknown>).created) || (!hasLeadRow && Boolean(clientEmail));

    return { leadId, created };
  } catch (error) {
    const persistenceError =
      error instanceof LeadsPersistenceError
        ? error
        : new LeadsPersistenceError(reqId, undefined, undefined, (error as Error).message);
    console.error(`[leads][${reqId}] persistLeadToLeads failed`, persistenceError);
    return { leadId, created: false, error: persistenceError };
  }
}

async function sendLeadPayload(
  payload: Record<string, unknown>,
  requestId: string,
  attempt = 1
): Promise<{ status: number; data: unknown; rawText: string }> {
  const body = JSON.stringify({ ...payload, request_id: requestId });
  const url = "/api/public/leads";

  try {
    console.log(`[leads][${requestId}] Sending payload (attempt ${attempt}):`, {
      step: String(payload.step ?? ""),
      client_email: String(payload.client_email ?? ""),
      client_phone: String(payload.client_phone ?? ""),
      pack_code: String(payload.pack_code ?? ""),
      event_date: String(payload.event_date ?? "")
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId
      },
      body
    });

    const rawText = await response.text();
    let parsed: unknown = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = rawText;
    }

    if (!response.ok) {
      throw new LeadsPersistenceError(
        requestId,
        response.status,
        parsed,
        `HTTP ${response.status}`
      );
    }

    return { status: response.status, data: parsed, rawText };
  } catch (error) {
    if (attempt < 2) {
      console.warn(`[leads][${requestId}] Attempt ${attempt} failed, retrying...`, error);
      await delay(200 * attempt);
      return sendLeadPayload(payload, requestId, attempt + 1);
    }
    if (error instanceof LeadsPersistenceError) {
      throw error;
    }
    throw new LeadsPersistenceError(requestId, undefined, null, (error as Error).message);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
