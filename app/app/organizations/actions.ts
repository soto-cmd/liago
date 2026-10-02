"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export async function setActiveOrganizationAction(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const organizationId = String(formData.get("organizationId") || "");

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    redirect("/app/organizations?error=not_allowed");
  }

  const cookieStore = await cookies();
  cookieStore.set("active_organization_id", organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/app");
}
