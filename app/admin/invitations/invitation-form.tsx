"use client";

import { useState } from "react";
import { createInvitationAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Organization = { id: string; name: string };

export function InvitationForm({ organizations }: { organizations: Organization[] }) {
  const [type, setType] = useState<"TRIAL" | "ORGANIZATION">("TRIAL");

  return (
    <form action={createInvitationAction} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="mb-1.5 block text-sm font-medium">Tipo de enlace</label>
        <select
          name="invitation_type"
          value={type}
          onChange={(event) => setType(event.target.value as "TRIAL" | "ORGANIZATION")}
          className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
        >
          <option value="TRIAL">Prueba de LiaGo</option>
          <option value="ORGANIZATION">Invitación a empresa</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Nombre de la campaña</label>
        <Input name="label" placeholder="Ej.: Prueba octubre - comercios locales" required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Email del invitado</label>
        <Input name="email" type="email" placeholder="Opcional" />
      </div>

      {type === "TRIAL" ? (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Duración de la prueba</label>
            <select name="trial_days" defaultValue="14" className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm">
              <option value="7">7 días</option>
              <option value="14">14 días</option>
              <option value="30">30 días</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Plan de prueba</label>
            <select name="plan" defaultValue="PRO" className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm">
              <option value="FREE">FREE</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="BUSINESS">BUSINESS</option>
            </select>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Empresa</label>
            <select name="organization_id" className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm" required>
              <option value="">Seleccionar empresa</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Rol</label>
            <select name="role" defaultValue="VIEWER" className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm" required>
              <option value="ADMIN">Administrador</option>
              <option value="MANAGER">Gerente</option>
              <option value="SELLER">Vendedor</option>
              <option value="CASHIER">Cajero</option>
              <option value="VIEWER">Solo lectura</option>
            </select>
          </div>
          <input type="hidden" name="trial_days" value="7" />
          <input type="hidden" name="plan" value="FREE" />
        </>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium">Vigencia del enlace</label>
        <select name="expiry_days" defaultValue="7" className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm">
          <option value="1">1 día</option>
          <option value="3">3 días</option>
          <option value="7">7 días</option>
          <option value="14">14 días</option>
          <option value="30">30 días</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Usos máximos</label>
        <Input name="max_uses" type="number" min="1" max="1000" defaultValue="1" />
      </div>

      <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
        {type === "TRIAL"
          ? "El enlace se presentará como una invitación exclusiva para probar LiaGo y generará automáticamente un mensaje listo para WhatsApp o email."
          : "El enlace permitirá invitar a una persona a una empresa específica con el rol seleccionado."}
      </div>

      <div className="md:col-span-2 flex justify-end">
        <Button type="submit">Generar enlace</Button>
      </div>
    </form>
  );
}
