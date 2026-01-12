export type AppRole = "admin" | "ops" | "sales" | "staff" | "system" | "public";

export async function requireRole(req: Request, allowed: AppRole[]) {
  if (allowed.includes("public")) {
    return null;
  }

  const role = (req.headers.get("x-mirror-role") || "public") as AppRole;

  // TODO: Replace header-based role with verified Supabase JWT claims.
  if (!allowed.includes(role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  return null;
}
