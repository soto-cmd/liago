"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function createSupportConversationAction(formData: FormData) {
  const { supabase, userId, organizationId } = await requireActiveOrganization();

  const message = String(formData.get("message") || "").trim();
  const subject = String(formData.get("subject") || "").trim() || "Reporte desde LiaGo";
  const category = String(formData.get("category") || "ERROR");
  const priority = String(formData.get("priority") || "NORMAL");
  const currentPath = String(formData.get("current_path") || "").trim() || null;
  const browserInfo = String(formData.get("browser_info") || "").trim() || null;

  if (!message) return;

  const safeCategory = ["ERROR", "QUESTION", "REQUEST", "BILLING", "OTHER"].includes(category) ? category : "ERROR";
  const safePriority = ["LOW", "NORMAL", "HIGH", "URGENT"].includes(priority) ? priority : "NORMAL";

  const { data: conversation, error } = await supabase
    .from("support_conversations")
    .insert({
      organization_id: organizationId,
      opened_by: userId,
      subject,
      category: safeCategory,
      priority: safePriority,
      current_path: currentPath,
      browser_info: browserInfo,
      status: "OPEN",
    })
    .select("id")
    .single();

  if (error || !conversation) return;

  await supabase.from("support_messages").insert({
    conversation_id: conversation.id,
    sender_user_id: userId,
    sender_type: "USER",
    message,
    error_context: {
      path: currentPath,
      browser: browserInfo,
      sent_at: new Date().toISOString(),
    },
  });

  await supabase
    .from("support_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);

  revalidatePath("/app");
  redirect(`/app?support=sent`);
}
