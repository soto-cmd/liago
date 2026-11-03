import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export const dynamic = "force-dynamic";

const formatNumber = (value: number) => Math.round(value).toLocaleString("es-PY");
const money = (value: number) => `Gs. ${formatNumber(value)}`;
const paymentLabels = { PAID: "Pagada", PARTIAL: "Parcial", PENDING: "Pendiente" } as const;
const debtLabels = { PENDING: "Pendiente", PARTIAL: "Parcial", OVERDUE: "Vencida", PAID: "Pagada" } as const;

export default async function ReportsPage() {
  const { supabase, organizationId } = await requireActiveOrganization();
  const [
    salesResult, paymentsResult, expensesResult, debtsResult, productsResult, customersResult,
  ] = await Promise.all([
    supabase.from("sales").select("total,status,payment_status").eq("organization_id",organizationId).order("sold_at",{ascending:false}).limit(1000),
    supabase.from("payments").select("amount,status").eq("organization_id",organizationId).order("paid_at",{ascending:false}).limit(1000),
    supabase.from("expenses").select("amount,status").eq("organization_id",organizationId).order("expense_date",{ascending:false}).limit(1000),
    supabase.from("debts").select("balance,status").eq("organization_id",organizationId).limit(1000),
    supabase.from("products").select("id",{count:"exact",head:true}).eq("organization_id",organizationId).is("deleted_at",null),
    supabase.from("customers").select("id",{count:"exact",head:true}).eq("organization_id",organizationId).is("deleted_at",null),
  ]);

  const results = [salesResult,paymentsResult,expensesResult,debtsResult,productsResult,customersResult];
  const hasError = results.some((result) => Boolean(result.error));
  const truncated = [salesResult,paymentsResult,expensesResult,debtsResult].some((result) => (result.data?.length ?? 0) === 1000);
  const confirmedSum = (rows: {status:string;total?:number;amount?:number}[] | null, field:"total"|"amount") =>
    rows?.filter(row => row.status === "CONFIRMED").reduce((sum,row)=>sum+Number(row[field] ?? 0),0) ?? 0;
  const salesTotal=confirmedSum(salesResult.data,"total");
  const collected=confirmedSum(paymentsResult.data,"amount");
  const spent=confirmedSum(expensesResult.data,"amount");
  const receivable=debtsResult.data?.filter(row=>["PENDING","PARTIAL","OVERDUE"].includes(row.status)).reduce((sum,row)=>sum+Number(row.balance),0) ?? 0;
  const cards=[
    {label:"Ventas registradas",value:money(salesTotal),error:!!salesResult.error},
    {label:"Cobros registrados",value:money(collected),error:!!paymentsResult.error},
    {label:"Gastos registrados",value:money(spent),error:!!expensesResult.error},
    {label:"Pendiente de cobro",value:money(receivable),error:!!debtsResult.error},
    {label:"Clientes",value:formatNumber(customersResult.count ?? 0),error:!!customersResult.error},
    {label:"Productos/servicios",value:formatNumber(productsResult.count ?? 0),error:!!productsResult.error},
  ];
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <p className="text-sm text-slate-500">Indicadores</p>
        <h1 className="text-3xl font-extrabold text-slate-950">Reportes</h1>
        <p className="mt-1 text-sm text-slate-600">Resumen comercial de tu empresa. Los movimientos se calculan a partir de los registros recientes.</p>
      </div>
      {hasError ? <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">No se pudieron consultar algunos indicadores. Los datos no disponibles se muestran con un guion en lugar de cero.</p> : null}
      {truncated ? <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Hay 1.000 o más registros en al menos una categoría. Los importes de movimientos representan únicamente los últimos 1.000 registros de cada categoría y no un acumulado histórico completo.</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(card=><section key={card.label} className="liago-card p-5">
          <p className="text-sm font-semibold text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-950">{card.error?"—":card.value}</p>
        </section>)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="liago-card p-5">
          <h2 className="font-bold text-slate-900">Estados de venta</h2>
          <div className="mt-4 space-y-3 text-sm">
            {Object.entries(paymentLabels).map(([status,label])=><div key={status} className="flex justify-between"><span>{label}</span><strong>{salesResult.error?"—":salesResult.data?.filter(s=>s.payment_status===status).length??0}</strong></div>)}
          </div>
        </section>
        <section className="liago-card p-5">
          <h2 className="font-bold text-slate-900">Cartera</h2>
          <div className="mt-4 space-y-3 text-sm">
            {Object.entries(debtLabels).map(([status,label])=><div key={status} className="flex justify-between"><span>{label}</span><strong>{debtsResult.error?"—":debtsResult.data?.filter(d=>d.status===status).length??0}</strong></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
