import Link from "next/link";
import { CloudOff, RotateCcw } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7fb] p-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <CloudOff className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950">Estás trabajando sin conexión</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          LiaGo conservará los datos disponibles en este dispositivo y dejará las operaciones compatibles pendientes de sincronización.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/app" className="liago-btn-primary"><RotateCcw className="h-4 w-4" /> Volver al sistema</Link>
        </div>
      </div>
    </main>
  );
}
