"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

export async function createInvitationAction(formData: FormData) {
  const { supabase, user } = await requirePlatformAdmin(["SUPERADMIN", "ADMIN"]);
  const invitationType = String(formData.get("invitation_type") || "TRIAL");
  const organizationId = text(formData, "organization_id");
  const maxUses = Math.max(1, Math.min(1000, Number(formData.get("max_uses") || 1)));
  const trialDays = Math.max(1, Math.min(90, Number(formData.get("trial_days") || 7)));
  const expiresDays = Math.max(1, Math.min(365, Number(formData.get("expires_days") || 7)));
  const plan = String(formData.get("plan") || "FREE");
  const role = String(formData.get("role") || "VIEWER");

  if (!["TRIAL", "ORGANIZATION"].includes(invitationType)) redirect("/admin/invitations?error=type");
  if (invitationType === "ORGANIZATION" && !organizationId) redirect("/admin/invitations?error=organization");

  const { error } = await supabase.from("invitation_links").insert({
    invitation_type: invitationType,
    label: text(formData, "label"),
    email: text(formData, "email"),
    organization_id: invitationType === "ORGANIZATION" ? organizationId : null,
    role: invitationType === "ORGANIZATION" ? role : null,
    plan: invitationType === "TRIAL" ? plan : "FREE",
    trial_days: trialDays,
    max_uses: maxUses,
    expires_at: new Date(Date.now() + expiresDays * 86400000).toISOString(),
    created_by: user.id,
  });

  if (error) redirect("/admin/invitations?error=save");
  revalidatePath("/admin/invitations");
  redirect("/admin/invitations?created=1");
}

export async function revokeInvitationAction(formData: FormData) {
  const { supabase } = await requirePlatformAdmin(["SUPERADMIN", "ADMIN"]);
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/invitations?error=missing");

  const { error } = await supabase.from("invitation_links").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin/invitations?error=revoke");
  revalidatePath("/admin/invitations");
  redirect("/admin/invitations?revoked=1");
}
