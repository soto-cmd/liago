import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { NewProductForm } from "@/components/products/new-product-form";

export default async function NewProductPage() {
  const { supabase, organizationId } = await requireActiveOrganization();
  const [{ data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("product_categories").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("suppliers").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
  ]);

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <NewProductForm categories={categories ?? []} suppliers={suppliers ?? []} />
    </div>
  );
}
