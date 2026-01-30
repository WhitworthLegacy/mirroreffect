import { createClient } from "@supabase/supabase-js";

/**
 * Crée un client Supabase pour les routes API server-side
 * Utilise le Service Role Key pour bypasser les RLS policies
 */
export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Variables manquantes: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
}
