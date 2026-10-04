"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, MessageCircle, Send, X } from "lucide-react";
import { createSupportConversationAction } from "@/app/app/support/actions";

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("");
  const [browser, setBrowser] = useState("");

  useEffect(() => {
    setPath(window.location.pathname + window.location.search);
    setBrowser(navigator.userAgent);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {open ? (
        <div className="mb-3 w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600"><LifeBuoy className="h-5 w-5" /></span>
              <div><div className="font-bold">Soporte LiaGo</div><div className="text-xs text-slate-400">Reportá errores o pedí ayuda</div></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-white/10" aria-label="Cerrar soporte"><X className="h-4 w-4" /></button>
          </div>

          <form action={createSupportConversationAction} className="space-y-4 p-5">
            <input type="hidden" name="current_path" value={path} />
            <input type="hidden" name="browser_info" value={browser} />

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Asunto</label>
              <input name="subject" placeholder="Ej. Error al guardar una venta" className="liago-input" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Tipo</label>
                <select name="category" className="liago-input">
                  <option value="ERROR">Error</option>
                  <option value="QUESTION">Consulta</option>
                  <option value="REQUEST">Solicitud</option>
                  <option value="BILLING">Facturación</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Prioridad</label>
                <select name="priority" className="liago-input">
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                  <option value="LOW">Baja</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Mensaje</label>
              <textarea name="message" required rows={5} placeholder="Contanos qué pasó y qué estabas intentando hacer..." className="liago-input resize-none" />
              <p className="mt-2 text-xs leading-5 text-slate-400">LiaGo enviará automáticamente la pantalla actual y datos técnicos básicos del navegador para ayudar a identificar el problema.</p>
            </div>

            <button className="liago-btn-primary w-full justify-center"><Send className="h-4 w-4" /> Enviar a soporte</button>
          </form>
        </div>
      ) : null}

      <button type="button" onClick={() => setOpen((value) => !value)} className="ml-auto flex h-14 items-center gap-2 rounded-full bg-blue-600 px-5 font-bold text-white shadow-xl transition hover:bg-blue-700" aria-label="Abrir soporte">
        <MessageCircle className="h-5 w-5" /> <span className="hidden sm:inline">Soporte</span>
      </button>
    </div>
  );
}
