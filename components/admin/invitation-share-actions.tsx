"use client";

import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";

export function InvitationShareActions({ url, label }: { url: string; label?: string | null }) {
  const [copied, setCopied] = useState(false);
  const text = `Te invito a probar LiaGo${label ? ` (${label})` : ""}: ${url}`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copiado" : "Copiar"}
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
      <a href={`mailto:?subject=${encodeURIComponent("Invitación a LiaGo")}&body=${encodeURIComponent(text)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"><Mail className="h-3.5 w-3.5" /> Email</a>
    </div>
  );
}
