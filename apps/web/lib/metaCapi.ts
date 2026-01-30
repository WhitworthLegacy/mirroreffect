/**
 * Meta Conversions API (CAPI) - Server-side event tracking
 *
 * Sends events directly to Meta's servers, bypassing ad blockers
 * and improving match rate with hashed user data.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from "crypto";

const PIXEL_ID = process.env.META_PIXEL_ID || "1995347034641420";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION = "v21.0";

// Hash function for user data (SHA256, lowercase)
function hashSHA256(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

// Normalize and hash email
function hashEmail(email: string): string {
  return hashSHA256(email.trim().toLowerCase());
}

// Normalize and hash phone (remove spaces, dashes, +)
function hashPhone(phone: string): string {
  const normalized = phone.replace(/[\s\-\+\(\)]/g, "");
  return hashSHA256(normalized);
}

// User data interface
export interface MetaUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // Facebook click ID from _fbc cookie
  fbp?: string; // Facebook browser ID from _fbp cookie
}

// Event data interface
export interface MetaEventData {
  eventName: "Lead" | "InitiateCheckout" | "Purchase" | "ViewContent" | "AddToCart" | "PageView" | string;
  eventTime?: number; // Unix timestamp in seconds
  eventId?: string; // For deduplication with browser pixel
  eventSourceUrl?: string;
  actionSource?: "website" | "email" | "app" | "phone_call" | "chat" | "physical_store" | "system_generated" | "other";
  userData: MetaUserData;
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentCategory?: string;
    contentIds?: string[];
    contentType?: string;
    orderId?: string;
    numItems?: number;
    [key: string]: unknown;
  };
}

// Response interface
interface MetaApiResponse {
  events_received?: number;
  messages?: string[];
  fbtrace_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Send an event to Meta Conversions API
 */
export async function sendMetaEvent(event: MetaEventData): Promise<{ success: boolean; response?: MetaApiResponse; error?: string }> {
  console.log("[meta-capi] sendMetaEvent called:", {
    eventName: event.eventName,
    hasAccessToken: !!ACCESS_TOKEN,
    pixelId: PIXEL_ID,
    hasUserData: !!event.userData?.email,
  });

  if (!ACCESS_TOKEN) {
    console.warn("[meta-capi] ACCESS_TOKEN not configured, skipping event:", event.eventName);
    return { success: false, error: "ACCESS_TOKEN not configured" };
  }

  const eventTime = event.eventTime || Math.floor(Date.now() / 1000);
  const eventId = event.eventId || `${event.eventName}_${eventTime}_${crypto.randomUUID()}`;

  // Build user_data with hashed values
  const userData: Record<string, string> = {};

  if (event.userData.email) {
    userData.em = hashEmail(event.userData.email);
  }
  if (event.userData.phone) {
    userData.ph = hashPhone(event.userData.phone);
  }
  if (event.userData.firstName) {
    userData.fn = hashSHA256(event.userData.firstName);
  }
  if (event.userData.lastName) {
    userData.ln = hashSHA256(event.userData.lastName);
  }
  if (event.userData.city) {
    userData.ct = hashSHA256(event.userData.city);
  }
  if (event.userData.country) {
    userData.country = hashSHA256(event.userData.country);
  }
  if (event.userData.clientIpAddress) {
    userData.client_ip_address = event.userData.clientIpAddress;
  }
  if (event.userData.clientUserAgent) {
    userData.client_user_agent = event.userData.clientUserAgent;
  }
  if (event.userData.fbc) {
    userData.fbc = event.userData.fbc;
  }
  if (event.userData.fbp) {
    userData.fbp = event.userData.fbp;
  }

  // Build custom_data
  const customData: Record<string, unknown> = {};

  if (event.customData?.value !== undefined) {
    customData.value = event.customData.value;
  }
  if (event.customData?.currency) {
    customData.currency = event.customData.currency;
  }
  if (event.customData?.contentName) {
    customData.content_name = event.customData.contentName;
  }
  if (event.customData?.contentCategory) {
    customData.content_category = event.customData.contentCategory;
  }
  if (event.customData?.contentIds) {
    customData.content_ids = event.customData.contentIds;
  }
  if (event.customData?.contentType) {
    customData.content_type = event.customData.contentType;
  }
  if (event.customData?.orderId) {
    customData.order_id = event.customData.orderId;
  }
  if (event.customData?.numItems !== undefined) {
    customData.num_items = event.customData.numItems;
  }

  // Build payload
  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: eventTime,
        event_id: eventId,
        event_source_url: event.eventSourceUrl,
        action_source: event.actionSource || "website",
        user_data: userData,
        custom_data: Object.keys(customData).length > 0 ? customData : undefined,
      },
    ],
    // Test event code for debugging - remove in production
    test_event_code: "TEST11352",
  };

  const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  console.log("[meta-capi] Sending to Meta:", {
    url: url.replace(ACCESS_TOKEN!, "[REDACTED]"),
    payload: JSON.stringify(payload, null, 2),
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as MetaApiResponse;

    if (!response.ok || data.error) {
      console.error("[meta-capi] API error:", data.error || data);
      return { success: false, response: data, error: data.error?.message || "API error" };
    }

    console.log(`[meta-capi] Event sent successfully:`, {
      eventName: event.eventName,
      eventId,
      eventsReceived: data.events_received,
    });

    return { success: true, response: data };
  } catch (error) {
    console.error("[meta-capi] Network error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Track Purchase event (call from Mollie webhook)
 */
export async function trackPurchase(params: {
  email: string;
  phone?: string;
  firstName?: string;
  value: number; // in EUR
  currency?: string;
  orderId: string; // Event ID
  contentName?: string;
  clientIp?: string;
  userAgent?: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendMetaEvent({
    eventName: "Purchase",
    eventId: `purchase_${params.orderId}`,
    actionSource: "website",
    userData: {
      email: params.email,
      phone: params.phone,
      firstName: params.firstName,
      clientIpAddress: params.clientIp,
      clientUserAgent: params.userAgent,
    },
    customData: {
      value: params.value,
      currency: params.currency || "EUR",
      contentName: params.contentName || "MirrorEffect Booking",
      contentCategory: "Photobooth",
      orderId: params.orderId,
      contentType: "product",
    },
  });
}

/**
 * Track Lead event (call from leads API)
 */
export async function trackLead(params: {
  email?: string;
  phone?: string;
  firstName?: string;
  leadId: string;
  value?: number;
  clientIp?: string;
  userAgent?: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendMetaEvent({
    eventName: "Lead",
    eventId: `lead_${params.leadId}`,
    actionSource: "website",
    userData: {
      email: params.email,
      phone: params.phone,
      firstName: params.firstName,
      clientIpAddress: params.clientIp,
      clientUserAgent: params.userAgent,
    },
    customData: {
      value: params.value,
      currency: "EUR",
      contentName: "MirrorEffect Booking",
      contentCategory: "Photobooth",
    },
  });
}

/**
 * Track InitiateCheckout event (call from checkout API)
 */
export async function trackInitiateCheckout(params: {
  email: string;
  phone?: string;
  firstName?: string;
  eventId: string;
  value: number;
  contentName?: string;
  clientIp?: string;
  userAgent?: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendMetaEvent({
    eventName: "InitiateCheckout",
    eventId: `checkout_${params.eventId}`,
    actionSource: "website",
    userData: {
      email: params.email,
      phone: params.phone,
      firstName: params.firstName,
      clientIpAddress: params.clientIp,
      clientUserAgent: params.userAgent,
    },
    customData: {
      value: params.value,
      currency: "EUR",
      contentName: params.contentName || "MirrorEffect Booking",
      contentCategory: "Photobooth",
      contentType: "product",
    },
  });
}
