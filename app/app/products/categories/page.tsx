import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { createCategoryAction, updateCategoryAction } from "./actions";

export default async function ProductCategoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { supabase, organizationId, role } = await requireActiveOrganization();
  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(role);
  const { data: categories } = await supabase
    .from("product_categories")
    .select("id,name,code,description,status,created_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");

  return <div className="p-4 md:p-8">
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><Link href="/app/products" className="mb-3 inline-flex items-center gap-2 text-sm text-neutral-600"><ArrowLeft className="h-4 w-4" /> Volver a productos</Link><p className="text-sm text-neutral-500">Organización del catálogo</p><h1 className="text-2xl font-semibold">Categorías</h1><p className="mt-1 text-sm text-neutral-600">Agrupá productos y servicios para facilitar búsqueda y reportes.</p></div>
      {canManage ? <details className="rounded-xl border bg-white p-3 shadow-sm md:w-[420px]"><summary className="flex cursor-pointer list-none items-center gap-2 font-medium"><Plus className="h-4 w-4" /> Nueva categoría</summary><form action={createCategoryAction} className="mt-4 grid gap-3"><input name="name" required placeholder="Nombre *" className="rounded-lg border px-3 py-2 text-sm" /><input name="code" placeholder="Código" className="rounded-lg border px-3 py-2 text-sm" /><textarea name="description" placeholder="Descripción" className="rounded-lg border px-3 py-2 text-sm" /><button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Guardar categoría</button></form></details> : null}
    </div>
    {params.created ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Categoría creada.</div> : null}
    {params.updated ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Categoría actualizada.</div> : null}
    {params.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo guardar la categoría.</div> : null}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{categories?.length ? categories.map((c) => <div key={c.id} className="rounded-xl border bg-white p-4 shadow-sm"><form action={updateCategoryAction} className="space-y-3"><input type="hidden" name="category_id" value={c.id} /><div className="flex items-center justify-between gap-3"><input name="name" defaultValue={c.name} required disabled={!canManage} className="min-w-0 flex-1 rounded-lg border px-3 py-2 font-medium" /><select name="status" defaultValue={c.status} disabled={!canManage} className="rounded-lg border px-2 py-2 text-sm"><option value="ACTIVE">Activa</option><option value="INACTIVE">Inactiva</option></select></div><input name="code" defaultValue={c.code ?? ""} disabled={!canManage} placeholder="Código" className="w-full rounded-lg border px-3 py-2 text-sm" /><textarea name="description" defaultValue={c.description ?? ""} disabled={!canManage} placeholder="Descripción" className="w-full rounded-lg border px-3 py-2 text-sm" />{canManage ? <button className="w-full rounded-lg border bg-neutral-50 px-3 py-2 text-sm font-medium">Guardar cambios</button> : null}</form></div>) : <div className="rounded-xl border bg-white p-8 text-sm text-neutral-500">Todavía no hay categorías.</div>}</div>
  </div>;
}
