"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";

type Props = {
  url: string;
  type: "TRIAL" | "ORGANIZATION";
  organizationName?: string | null;
};

export function ShareInvitation({ url, type, organizationName }: Props) {
  const [copied, setCopied] = useState<"link" | "message" | null>(null);

  const message = useMemo(() => {
    if (type === "TRIAL") {
      return `Hola. Fuiste una de las pocas personas seleccionadas para probar LiaGo, nuestra nueva app de gestión comercial.\n\nPodés acceder desde este enlace:\n${url}\n\nTu experiencia y opinión nos ayudarán a mejorar la plataforma. ¡Gracias por probarla!`;
    }

    return `Hola. Te invitamos a formar parte de ${organizationName || "una empresa"} en LiaGo.\n\nIngresá desde este enlace para crear tu acceso:\n${url}`;
  }, [organizationName, type, url]);

  async function copy(value: string, kind: "link" | "message") {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const emailSubject = type === "TRIAL" ? "Invitación exclusiva para probar LiaGo" : "Invitación a LiaGo";
  const mailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-3">
      <textarea
        readOnly
        value={message}
        className="min-h-32 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm leading-6"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => copy(url, "link")} className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50">
          {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copiar enlace
        </button>
        <button type="button" onClick={() => copy(message, "message")} className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50">
          {copied === "message" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copiar mensaje
        </button>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <a href={mailUrl} className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50">
          <Mail className="h-4 w-4" /> Email
        </a>
      </div>
    </div>
  );
}
