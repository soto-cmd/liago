"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";

export async function replySupportConversationAction(formData: FormData) {
  const { supabase, user, role } = await requirePlatformAdmin();
  const conversationId = String(formData.get("conversation_id") || "");
  const message = String(formData.get("message") || "").trim();
  if (!conversationId || !message) return;

  await supabase.from("support_messages").insert({
    conversation_id: conversationId,
    sender_user_id: user.id,
    sender_type: role === "SUPPORT" ? "SUPPORT" : "ADMIN",
    message,
  });

  await supabase
    .from("support_conversations")
    .update({ status: "WAITING", last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath("/admin/support");
}

export async function updateSupportStatusAction(formData: FormData) {
  const { supabase } = await requirePlatformAdmin();
  const conversationId = String(formData.get("conversation_id") || "");
  const status = String(formData.get("status") || "OPEN");
  const safeStatus = ["OPEN", "WAITING", "RESOLVED", "CLOSED"].includes(status) ? status : "OPEN";
  if (!conversationId) return;

  await supabase.from("support_conversations").update({ status: safeStatus }).eq("id", conversationId);
  revalidatePath("/admin/support");
}
