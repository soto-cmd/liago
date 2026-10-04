"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function redeemInvitationAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  if (!token) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/invite/${token}`)}`);

  const { data: organizationId, error } = await supabase.rpc("redeem_invitation_link", { p_token: token });
  if (error || !organizationId) redirect(`/invite/${token}?error=redeem`);

  const cookieStore = await cookies();
  cookieStore.set("active_organization_id", organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/app");
}
