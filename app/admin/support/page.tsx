import { LifeBuoy, MessageSquareText } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";
import { replySupportConversationAction, updateSupportStatusAction } from "./actions";

export default async function AdminSupportPage() {
  const { supabase } = await requirePlatformAdmin();

  const { data: conversations } = await supabase
    .from("support_conversations")
    .select("id,organization_id,opened_by,subject,status,priority,category,current_path,browser_info,last_message_at,created_at,organizations(name)")
    .order("last_message_at", { ascending: false })
    .limit(50);

  const ids = (conversations ?? []).map((item) => item.id);
  const { data: messages } = ids.length
    ? await supabase
        .from("support_messages")
        .select("id,conversation_id,sender_type,message,created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true })
    : { data: [] };

  const grouped = new Map<string, typeof messages>();
  for (const message of messages ?? []) {
    const list = grouped.get(message.conversation_id) ?? [];
    list.push(message);
    grouped.set(message.conversation_id, list);
  }

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><LifeBuoy className="h-3.5 w-3.5" /> Soporte</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Conversaciones de soporte</h1>
          <p className="mt-2 text-sm text-slate-500">Reportes enviados por empresas y usuarios de LiaGo.</p>
        </div>

        <div className="space-y-4">
          {conversations?.length ? conversations.map((conversation) => {
            const org = conversation.organizations as unknown as { name: string } | null;
            const thread = grouped.get(conversation.id) ?? [];
            return (
              <section key={conversation.id} className="liago-card overflow-hidden">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-extrabold text-slate-950">{conversation.subject || "Reporte sin asunto"}</h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{conversation.category}</span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">{conversation.priority}</span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{conversation.status}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">{org?.name || "Sin empresa"} · {new Date(conversation.created_at).toLocaleString("es-PY")}</div>
                      {conversation.current_path ? <div className="mt-1 text-xs text-slate-400">Pantalla: {conversation.current_path}</div> : null}
                    </div>
                    <form action={updateSupportStatusAction} className="flex gap-2">
                      <input type="hidden" name="conversation_id" value={conversation.id} />
                      <select name="status" defaultValue={conversation.status} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold">
                        <option value="OPEN">Abierto</option>
                        <option value="WAITING">Esperando</option>
                        <option value="RESOLVED">Resuelto</option>
                        <option value="CLOSED">Cerrado</option>
                      </select>
                      <button className="liago-btn-secondary">Guardar</button>
                    </form>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50/60 p-5">
                  {thread.length ? thread.map((message) => (
                    <div key={message.id} className={`max-w-3xl rounded-2xl border p-4 ${message.sender_type === "USER" ? "bg-white" : "ml-auto border-blue-100 bg-blue-50"}`}>
                      <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{message.sender_type}</div>
                      <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.message}</div>
                      <div className="mt-2 text-[11px] text-slate-400">{new Date(message.created_at).toLocaleString("es-PY")}</div>
                    </div>
                  )) : <div className="text-sm text-slate-500">Sin mensajes.</div>}
                </div>

                <form action={replySupportConversationAction} className="flex gap-3 border-t border-slate-100 p-5">
                  <input type="hidden" name="conversation_id" value={conversation.id} />
                  <textarea name="message" required rows={2} placeholder="Responder al usuario..." className="liago-input flex-1 resize-none" />
                  <button className="liago-btn-primary self-end"><MessageSquareText className="h-4 w-4" /> Responder</button>
                </form>
              </section>
            );
          }) : <div className="liago-card p-12 text-center text-slate-500">Todavía no hay conversaciones de soporte.</div>}
        </div>
      </div>
    </div>
  );
}
