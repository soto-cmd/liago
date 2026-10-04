"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, Wifi } from "lucide-react";

export function ConnectivityBanner() {
  const [online, setOnline] = useState(true);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const update = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      if (isOnline) {
        setRestored(true);
        const id = window.setTimeout(() => setRestored(false), 2500);
        return () => window.clearTimeout(id);
      }
    };

    setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online && !restored) return null;

  return (
    <div className={`fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold shadow-sm ${online ? "bg-emerald-600 text-white" : "bg-amber-500 text-slate-950"}`}>
      {online ? <Wifi className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
      {online ? "Conexión restablecida. LiaGo sincronizará los cambios pendientes." : "Sin conexión. Podés seguir trabajando; los cambios quedarán pendientes de sincronización."}
      {!online ? <RefreshCw className="h-3.5 w-3.5" /> : null}
    </div>
  );
}
