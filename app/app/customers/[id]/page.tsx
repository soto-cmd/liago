import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeDollarSign, History, Pencil } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { setCustomerStatusAction, updateCustomerAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const { supabase, organizationId, role } = await requireActiveOrganization();
  const canEdit = ["OWNER", "ADMIN", "MANAGER", "SELLER", "CASHIER"].includes(role);
  const canManageStatus = ["OWNER", "ADMIN", "MANAGER"].includes(role);

  const [{ data: customer }, { data: debts }, { data: entries }, { data: sales }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).eq("organization_id", organizationId).is("deleted_at", null).maybeSingle(),
    supabase.from("debts").select("id,concept,original_amount,balance,status,due_date,issued_at").eq("organization_id", organizationId).eq("customer_id", id).order("issued_at", { ascending: false }),
    supabase.from("customer_account_entries").select("id,entry_date,entry_type,description,debit,credit").eq("organization_id", organizationId).eq("customer_id", id).order("entry_date", { ascending: false }).limit(50),
    supabase.from("sales").select("id,sale_number,sold_at,total,amount_paid,balance_due,status,payment_status").eq("organization_id", organizationId).eq("customer_id", id).order("sold_at", { ascending: false }).limit(20),
  ]);

  if (!customer) notFound();
  const pending = (debts ?? []).filter((d) => !["PAID", "CANCELED"].includes(d.status)).reduce((sum, d) => sum + Number(d.balance), 0);
  const accountBalance = (entries ?? []).reduce((sum, e) => sum + Number(e.debit) - Number(e.credit), 0);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/app/customers" className="mb-3 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950"><ArrowLeft className="h-4 w-4" /> Volver a clientes</Link>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold">{customer.name}</h1><span className="rounded-full border bg-white px-2.5 py-1 text-xs font-medium">{customer.status}</span></div>
          <p className="mt-1 text-sm text-neutral-500">{customer.customer_code ? `Código ${customer.customer_code}` : "Sin código"}{customer.tax_id ? ` · ${customer.tax_id}` : ""}</p>
        </div>
        {canManageStatus ? <div className="flex gap-2"><form action={setCustomerStatusAction}><input type="hidden" name="customer_id" value={customer.id} /><input type="hidden" name="status" value={customer.status === "ACTIVE" ? "BLOCKED" : "ACTIVE"} /><button className="rounded-lg border bg-white px-4 py-2 text-sm font-medium">{customer.status === "ACTIVE" ? "Bloquear" : "Activar"}</button></form></div> : null}
      </div>

      {messages.created ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Cliente creado correctamente.</div> : null}
      {messages.updated ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Cambios guardados.</div> : null}
      {messages.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo completar la operación.</div> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-sm text-neutral-500">Saldo pendiente</p><p className="mt-2 text-2xl font-semibold">{pending.toLocaleString("es-PY")}</p></div>
        <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-sm text-neutral-500">Cuenta corriente</p><p className="mt-2 text-2xl font-semibold">{accountBalance.toLocaleString("es-PY")}</p></div>
        <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-sm text-neutral-500">Límite de crédito</p><p className="mt-2 text-2xl font-semibold">{Number(customer.credit_limit).toLocaleString("es-PY")}</p></div>
        <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-sm text-neutral-500">Ventas registradas</p><p className="mt-2 text-2xl font-semibold">{sales?.length ?? 0}</p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Pencil className="h-4 w-4" /><h2 className="font-semibold">Datos del cliente</h2></div>
          <form action={updateCustomerAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="customer_id" value={customer.id} />
            <select name="customer_type" defaultValue={customer.customer_type} disabled={!canEdit} className="rounded-lg border px-3 py-2 text-sm"><option value="PERSON">Persona</option><option value="COMPANY">Empresa</option></select>
            <input name="customer_code" defaultValue={customer.customer_code ?? ""} disabled={!canEdit} placeholder="Código" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="name" defaultValue={customer.name} required disabled={!canEdit} placeholder="Nombre / Razón social" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            <input name="tax_id" defaultValue={customer.tax_id ?? ""} disabled={!canEdit} placeholder="Documento / RUC" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="phone" defaultValue={customer.phone ?? ""} disabled={!canEdit} placeholder="Teléfono" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="whatsapp" defaultValue={customer.whatsapp ?? ""} disabled={!canEdit} placeholder="WhatsApp" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="email" type="email" defaultValue={customer.email ?? ""} disabled={!canEdit} placeholder="Email" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="city" defaultValue={customer.city ?? ""} disabled={!canEdit} placeholder="Ciudad" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="credit_limit" type="number" min="0" step="0.01" defaultValue={customer.credit_limit} disabled={!canEdit} placeholder="Límite de crédito" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="address" defaultValue={customer.address ?? ""} disabled={!canEdit} placeholder="Dirección" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            <textarea name="notes" defaultValue={customer.notes ?? ""} disabled={!canEdit} placeholder="Notas" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            {canEdit ? <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white md:col-span-2">Guardar cambios</button> : null}
          </form>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><BadgeDollarSign className="h-4 w-4" /><h2 className="font-semibold">Deudas</h2></div>
            <div className="space-y-3">{debts?.length ? debts.map((d) => <div key={d.id} className="flex items-center justify-between gap-4 border-b pb-3 text-sm last:border-0 last:pb-0"><div><div className="font-medium">{d.concept}</div><div className="text-xs text-neutral-500">{d.due_date ? `Vence ${new Date(`${d.due_date}T00:00:00`).toLocaleDateString("es-PY")}` : "Sin vencimiento"} · {d.status}</div></div><div className="text-right"><div className="font-semibold">{Number(d.balance).toLocaleString("es-PY")}</div><div className="text-xs text-neutral-500">de {Number(d.original_amount).toLocaleString("es-PY")}</div></div></div>) : <p className="text-sm text-neutral-500">Sin deudas.</p>}</div>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><History className="h-4 w-4" /><h2 className="font-semibold">Cuenta corriente</h2></div>
            <div className="space-y-3">{entries?.length ? entries.map((e) => <div key={e.id} className="grid grid-cols-[1fr_auto] gap-4 border-b pb-3 text-sm last:border-0 last:pb-0"><div><div className="font-medium">{e.description}</div><div className="text-xs text-neutral-500">{new Date(e.entry_date).toLocaleString("es-PY")} · {e.entry_type}</div></div><div className="text-right"><div className={Number(e.credit) > 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>{Number(e.credit) > 0 ? `-${Number(e.credit).toLocaleString("es-PY")}` : `+${Number(e.debit).toLocaleString("es-PY")}`}</div></div></div>) : <p className="text-sm text-neutral-500">Sin movimientos.</p>}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
