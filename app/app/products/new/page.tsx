import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { NewProductForm } from "@/components/products/new-product-form";

export default async function NewProductPage({searchParams}:{searchParams:Promise<{from?:string}>}) {
  const params=await searchParams;
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER","ADMIN","MANAGER"].includes(role)) redirect("/app/products?error=not_allowed");
  const [{ data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("product_categories").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("suppliers").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
  ]);

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <NewProductForm categories={categories ?? []} suppliers={suppliers ?? []} returnToStore={params.from==="store"} />
    </div>
  );
}
