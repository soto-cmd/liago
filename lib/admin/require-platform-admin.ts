import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requirePlatformAdmin(allowedRoles: string[] = ["SUPERADMIN", "ADMIN", "SUPPORT"]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: admin } = await supabase
    .from("platform_admins")
    .select("role,status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin || admin.status !== "ACTIVE" || !allowedRoles.includes(admin.role)) {
    redirect("/app");
  }

  return { supabase, user, role: admin.role as string };
}
