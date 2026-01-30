type FbqFunction = (
  command: "init" | "track" | "trackCustom" | "set",
  event: string,
  params?: Record<string, unknown>
) => void;

declare global {
  interface Window {
    fbq?: FbqFunction;
  }
}

export function trackMetaEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }
  window.fbq("track", eventName, params);
}

function persistGuard(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (localStorage.getItem(key)) {
    return false;
  }
  localStorage.setItem(key, "1");
  return true;
}

export function trackMetaLeadOnce(leadId?: string, payload?: Record<string, unknown>): void {
  if (!leadId) {
    return;
  }

  const guardKey = `me_meta_lead_fired_${leadId}`;
  if (!persistGuard(guardKey)) {
    return;
  }

  trackMetaEvent("Lead", {
    content_name: "MirrorEffect Booking",
    content_category: "Photobooth",
    ...(payload ?? {})
  });
}

export function trackMetaInitiateCheckoutOnce(identifier?: string, payload?: Record<string, unknown>): void {
  const guardKey = `me_meta_checkout_fired_${identifier || "no-id"}`;
  if (!persistGuard(guardKey)) {
    return;
  }

  trackMetaEvent("InitiateCheckout", payload);
}
