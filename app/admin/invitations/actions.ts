"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";

function clean(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

export async function createInvitationAction(formData: FormData) {
  const { supabase, user } = await requirePlatformAdmin(["SUPERADMIN", "ADMIN"]);

  const invitationType = String(formData.get("invitation_type") || "TRIAL");
  const label = clean(formData.get("label"));
  const email = clean(formData.get("email"));
  const organizationId = clean(formData.get("organization_id"));
  const role = clean(formData.get("role"));
  const plan = String(formData.get("plan") || "FREE");
  const trialDays = Math.max(1, Math.min(90, Number(formData.get("trial_days") || 7)));
  const maxUses = Math.max(1, Math.min(1000, Number(formData.get("max_uses") || 1)));
  const expiryDays = Math.max(1, Math.min(90, Number(formData.get("expiry_days") || 7)));

  if (!["TRIAL", "ORGANIZATION"].includes(invitationType)) {
    redirect("/admin/invitations?error=type");
  }

  if (!["FREE", "BASIC", "PRO", "BUSINESS"].includes(plan)) {
    redirect("/admin/invitations?error=plan");
  }

  if (invitationType === "ORGANIZATION" && (!organizationId || !role)) {
    redirect("/admin/invitations?error=organization");
  }

  const expiresAt = new Date(Date.now() + expiryDays * 86_400_000).toISOString();

  const { error } = await supabase.from("invitation_links").insert({
    invitation_type: invitationType,
    label,
    email,
    organization_id: invitationType === "ORGANIZATION" ? organizationId : null,
    role: invitationType === "ORGANIZATION" ? role : null,
    plan,
    trial_days: trialDays,
    max_uses: maxUses,
    expires_at: expiresAt,
    created_by: user.id,
  });

  if (error) redirect("/admin/invitations?error=save");

  revalidatePath("/admin/invitations");
  redirect("/admin/invitations?created=1");
}

export async function revokeInvitationAction(formData: FormData) {
  const { supabase } = await requirePlatformAdmin(["SUPERADMIN", "ADMIN"]);
  const id = String(formData.get("id") || "").trim();
  if (!id) redirect("/admin/invitations?error=revoke");

  const { error } = await supabase
    .from("invitation_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null);

  if (error) redirect("/admin/invitations?error=revoke");
  revalidatePath("/admin/invitations");
}
