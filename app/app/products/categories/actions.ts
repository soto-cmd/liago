"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

export async function createCategoryAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/products/categories?error=not_allowed");
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/app/products/categories?error=required");

  const { error } = await supabase.from("product_categories").insert({
    organization_id: organizationId,
    name,
    code: text(formData, "code"),
    description: text(formData, "description"),
    status: "ACTIVE",
  });
  if (error) redirect(`/app/products/categories?error=${error.code === "23505" ? "duplicate" : "save"}`);
  revalidatePath("/app/products/categories");
  revalidatePath("/app/products");
  redirect("/app/products/categories?created=1");
}

export async function updateCategoryAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/products/categories?error=not_allowed");
  const id = String(formData.get("category_id") || "");
  const name = String(formData.get("name") || "").trim();
  const requested = String(formData.get("status") || "ACTIVE");
  const status = requested === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  if (!id || !name) redirect("/app/products/categories?error=required");

  const { error } = await supabase.from("product_categories").update({
    name,
    code: text(formData, "code"),
    description: text(formData, "description"),
    status,
  }).eq("id", id).eq("organization_id", organizationId);
  if (error) redirect(`/app/products/categories?error=${error.code === "23505" ? "duplicate" : "save"}`);
  revalidatePath("/app/products/categories");
  revalidatePath("/app/products");
  redirect("/app/products/categories?updated=1");
}
