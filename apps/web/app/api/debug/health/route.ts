import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { count, error } = await supabase
      .from("inventory_items")
      .select("id", { count: "exact", head: true })
      .eq("type", "mirror");

    if (error) {
      return Response.json({ ok: false, error: "inventory_error" }, { status: 500 });
    }

    return Response.json({ ok: true, mirrors_count: count ?? 0 });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "server_error" },
      { status: 500 }
    );
  }
}
