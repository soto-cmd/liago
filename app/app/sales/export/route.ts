import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const { supabase, organizationId, organization } = await requireActiveOrganization();

  const { data: sales, error } = await supabase
    .from("sales")
    .select("sale_number,sold_at,customers(name),sale_type,total,amount_paid,balance_due,status,payment_status")
    .eq("organization_id", organizationId)
    .order("sold_at", { ascending: false })
    .limit(5000);

  if (error) {
    return new Response("No se pudo generar la exportación.", { status: 500 });
  }

  const rows = [
    ["N°", "Fecha", "Cliente", "Tipo", "Total", "Cobrado", "Saldo", "Estado"],
    ...(sales ?? []).map((sale) => {
      const customer = sale.customers as unknown as { name: string } | null;
      const type = sale.sale_type === "CASH" ? "Contado" : sale.sale_type === "PARTIAL" ? "Pago parcial" : "Crédito";
      const status = sale.status === "CANCELED"
        ? "Anulada"
        : sale.payment_status === "PAID"
          ? "Pagada"
          : sale.payment_status === "PARTIAL"
            ? "Parcial"
            : "Pendiente";

      return [
        sale.sale_number,
        new Date(sale.sold_at).toLocaleString("es-PY"),
        customer?.name || "Consumidor final",
        type,
        Number(sale.total || 0),
        Number(sale.amount_paid || 0),
        Number(sale.balance_due || 0),
        status,
      ];
    }),
  ];

  const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  const safeName = organization.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "liago";
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ventas-${safeName}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
