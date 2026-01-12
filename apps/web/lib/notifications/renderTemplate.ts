import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RenderInput = {
  key: string;
  locale?: string;
  payload?: Record<string, string | number | boolean | null>;
};

type RenderedTemplate = {
  subject: string;
  html: string;
};

function interpolate(template: string, payload: Record<string, string | number | boolean | null>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = payload[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export async function renderTemplate({ key, locale, payload = {} }: RenderInput): Promise<RenderedTemplate | null> {
  const supabase = createSupabaseServerClient();
  const preferredLocale = locale || "fr";

  const { data: template, error } = await supabase
    .from("message_templates")
    .select("subject, html")
    .eq("key", key)
    .eq("locale", preferredLocale)
    .maybeSingle();

  if (error) {
    throw new Error("Template fetch failed");
  }

  let resolved = template;

  if (!resolved && preferredLocale !== "fr") {
    const { data: fallback } = await supabase
      .from("message_templates")
      .select("subject, html")
      .eq("key", key)
      .eq("locale", "fr")
      .maybeSingle();
    resolved = fallback ?? null;
  }

  if (!resolved) {
    return null;
  }

  return {
    subject: interpolate(resolved.subject, payload),
    html: interpolate(resolved.html, payload)
  };
}
