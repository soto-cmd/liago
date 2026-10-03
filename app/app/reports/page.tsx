import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export default async function ReportsPage() {
  const { supabase, organizationId } = await requireActiveOrganization();
  const [{ data:sales },{ data:payments },{ data:expenses },{ data:debts },{ data:products },{ data:customers }] = await Promise.all([
    supabase.from("sales").select("sold_at,total,status,payment_status").eq("organization_id",organizationId).order("sold_at",{ascending:false}).limit(1000),
    supabase.from("payments").select("paid_at,amount,status,payment_method").eq("organization_id",organizationId).order("paid_at",{ascending:false}).limit(1000),
    supabase.from("expenses").select("expense_date,amount,status,category").eq("organization_id",organizationId).order("expense_date",{ascending:false}).limit(1000),
    supabase.from("debts").select("balance,status,due_date").eq("organization_id",organizationId),
    supabase.from("products").select("id,status,item_type").eq("organization_id",organizationId).is("deleted_at",null),
    supabase.from("customers").select("id,status").eq("organization_id",organizationId).is("deleted_at",null),
  ]);
  const salesTotal=sales?.filter((x)=>x.status==="CONFIRMED").reduce((s,x)=>s+Number(x.total),0)??0;
  const collected=payments?.filter((x)=>x.status==="CONFIRMED").reduce((s,x)=>s+Number(x.amount),0)??0;
  const spent=expenses?.filter((x)=>x.status==="CONFIRMED").reduce((s,x)=>s+Number(x.amount),0)??0;
  const receivable=debts?.filter((x)=>["PENDING","PARTIAL","OVERDUE"].includes(x.status)).reduce((s,x)=>s+Number(x.balance),0)??0;
  const cards=[["Ventas acumuladas",salesTotal],["Cobros acumulados",collected],["Gastos acumulados",spent],["Pendiente de cobro",receivable],["Clientes",customers?.length??0],["Productos/servicios",products?.length??0]];

  return <div className="p-4 md:p-8"><div className="mb-6"><p className="text-sm text-neutral-500">Indicadores</p><h1 className="text-2xl font-semibold">Reportes</h1><p className="mt-1 text-sm text-neutral-600">Resumen comercial. Los filtros por rango, exportación y utilidad detallada quedarán sobre esta misma base.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map(([label,value])=><div key={label} className="rounded-xl border bg-white p-5 shadow-sm"><div className="text-sm text-neutral-500">{label}</div><div className="mt-2 text-2xl font-semibold">{Number(value).toLocaleString("es-PY")}</div></div>)}</div><div className="mt-6 grid gap-4 lg:grid-cols-2"><div className="rounded-xl border bg-white p-5 shadow-sm"><div className="font-medium">Estados de venta</div><div className="mt-4 space-y-2 text-sm">{["PAID","PARTIAL","PENDING"].map((status)=><div key={status} className="flex justify-between"><span>{status}</span><span className="font-medium">{sales?.filter((s)=>s.payment_status===status).length??0}</span></div>)}</div></div><div className="rounded-xl border bg-white p-5 shadow-sm"><div className="font-medium">Cartera</div><div className="mt-4 space-y-2 text-sm">{["PENDING","PARTIAL","OVERDUE","PAID"].map((status)=><div key={status} className="flex justify-between"><span>{status}</span><span className="font-medium">{debts?.filter((d)=>d.status===status).length??0}</span></div>)}</div></div></div></div>;
}
