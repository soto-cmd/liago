"use client";

import { useEffect, useState } from "react";
import { CloudOff, Wifi } from "lucide-react";
import { countOfflineMutations } from "@/lib/offline/db";

export function ConnectivityBanner() {
  const [online, setOnline] = useState(true);
  const [restored, setRestored] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let restoredTimer = 0;

    const refreshPending = () => {
      countOfflineMutations().then(setPending).catch(() => setPending(0));
    };

    const updateConnection = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      refreshPending();
      if (isOnline) {
        setRestored(true);
        window.clearTimeout(restoredTimer);
        restoredTimer = window.setTimeout(() => setRestored(false), 2500);
      }
    };

    setOnline(navigator.onLine);
    refreshPending();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("liago:offline-queue-changed", refreshPending);

    return () => {
      window.clearTimeout(restoredTimer);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener("liago:offline-queue-changed", refreshPending);
    };
  }, []);

  if (online && !restored && pending === 0) return null;

  const message = !online
    ? pending > 0
      ? `Sin conexión. ${pending} cambio${pending === 1 ? "" : "s"} guardado${pending === 1 ? "" : "s"} en este dispositivo.`
      : "Sin conexión. LiaGo usará los datos disponibles en este dispositivo."
    : pending > 0
      ? `Conexión restablecida. Hay ${pending} cambio${pending === 1 ? "" : "s"} pendiente${pending === 1 ? "" : "s"} de sincronización.`
      : "Conexión restablecida.";

  return (
    <div className={`fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold shadow-sm ${online ? "bg-emerald-600 text-white" : "bg-amber-500 text-slate-950"}`}>
      {online ? <Wifi className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
      {message}
    </div>
  );
}
