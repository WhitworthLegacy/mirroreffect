export const MANYCHAT_CONFIG = {
  apiKey: process.env.MANYCHAT_API_KEY!,
  webhookSecret: process.env.MANYCHAT_WEBHOOK_SECRET!,
  apiBaseUrl: "https://api.manychat.com/fb",
} as const;

// Validation au démarrage
if (!process.env.MANYCHAT_API_KEY) {
  console.warn("[manychat-config] MANYCHAT_API_KEY not configured");
}

if (!process.env.MANYCHAT_WEBHOOK_SECRET) {
  console.warn("[manychat-config] MANYCHAT_WEBHOOK_SECRET not configured");
}
