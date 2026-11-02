"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

const dashboard = "/app/online-store";
function field(form: FormData, name: string) { return String(form.get(name) ?? "").trim(); }
function safeUrl(value: string): string | null {
  if (!value) return null;
  if (value.length > 1500) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch { return null; }
}
function fail(code: string): never { redirect(`${dashboard}?error=${code}`); }

async function manager() {
  const ctx = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(ctx.role)) fail("permission");
  return ctx;
}
async function storefront(ctx: Awaited<ReturnType<typeof manager>>) {
  const { data } = await ctx.supabase.from("online_stores").select("slug").eq("organization_id", ctx.organizationId).maybeSingle();
  if (!data) fail("store");
  return data;
}
function refresh(slug: string) {
  revalidatePath(dashboard);
  revalidatePath(`/tienda/${slug}`);
}

export async function saveOnlineStoreAction(form: FormData) {
  const ctx = await manager();
  const slug = field(form,"slug").toLowerCase();
  const title = field(form,"title");
  const tagline = field(form,"tagline").slice(0,150);
  const description = field(form,"description").slice(0,1000);
  const whatsapp = field(form,"whatsapp").replace(/\D/g,"").slice(0,20);
  const logoRaw = field(form,"logo_url");
  const bannerRaw = field(form,"banner_url");
  const color = field(form,"accent_color");
  const published = field(form,"is_published") === "on";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 70
      || title.length < 2 || title.length > 120
      || (logoRaw && !safeUrl(logoRaw)) || (bannerRaw && !safeUrl(bannerRaw))
      || (color && !/^#[0-9a-f]{6}$/i.test(color))) fail("validation");
  const { data: old } = await ctx.supabase.from("online_stores")
    .select("slug").eq("organization_id",ctx.organizationId).maybeSingle();
  const { error } = await ctx.supabase.from("online_stores").upsert({
    organization_id:ctx.organizationId,slug,title,tagline:tagline||null,
    description:description||null,whatsapp:whatsapp||null,logo_url:safeUrl(logoRaw),
    banner_url:safeUrl(bannerRaw),accent_color:color||"#1d4ed8",
    is_published:published,updated_at:new Date().toISOString()
  },{onConflict:"organization_id"});
  if (error) fail("save");
  refresh(slug);
  if (old?.slug && old.slug !== slug) revalidatePath(`/tienda/${old.slug}`);
  redirect(`${dashboard}?saved=store`);
}

export async function publishOnlineStoreProductAction(form: FormData) {
  const ctx = await manager();
  const store = await storefront(ctx);
  const productId = field(form,"product_id");
  const { data: product } = await ctx.supabase.from("products")
    .select("id,code,name,description,image_url,sale_price,status,item_type,product_categories(name)")
    .eq("id",productId).eq("organization_id",ctx.organizationId)
    .eq("item_type","PRODUCT").eq("status","ACTIVE").is("deleted_at",null).maybeSingle();
  if (!product) fail("product");
  const category = product.product_categories as unknown as {name:string}|null;
  const { error } = await ctx.supabase.from("online_store_items").upsert({
    organization_id:ctx.organizationId,product_id:product.id,
    title:product.name,code:product.code,description:product.description,
    category_name:category?.name || "Otros",image_url:safeUrl(product.image_url||""),
    price:Number(product.sale_price),currency:"PYG",is_published:false
  },{onConflict:"organization_id,product_id",ignoreDuplicates:true});
  if(error) fail("save");
  refresh(store.slug);
  redirect(`${dashboard}?saved=item`);
}

export async function updateOnlineStoreProductAction(form: FormData) {
  const ctx = await manager();
  const store = await storefront(ctx);
  const id = field(form,"id");
  const title=field(form,"title");
  const description=field(form,"description").slice(0,1800);
  const category=field(form,"category_name").slice(0,80);
  const imageRaw=field(form,"image_url");
  const price=Number(field(form,"price"));
  const originalRaw=field(form,"compare_at_price");
  const compare=originalRaw ? Number(originalRaw) : null;
  const published=field(form,"is_published")==="on";
  if (!title || title.length>160 || !Number.isFinite(price) || price<0
      || (compare!==null && (!Number.isFinite(compare)||compare<price))
      || (imageRaw && !safeUrl(imageRaw))) fail("validation");
  const { data: row,error } = await ctx.supabase.from("online_store_items")
    .update({title,description:description||null,category_name:category||"Otros",
      image_url:safeUrl(imageRaw),price,compare_at_price:compare,is_published:published,
      updated_at:new Date().toISOString()})
    .eq("id",id).eq("organization_id",ctx.organizationId).select("id").maybeSingle();
  if(error||!row) fail("save");
  refresh(store.slug);
  redirect(`${dashboard}?saved=item`);
}

export async function removeOnlineStoreProductAction(form: FormData) {
  const ctx=await manager();
  const store=await storefront(ctx);
  const id=field(form,"id");
  const {error}=await ctx.supabase.from("online_store_items").delete()
    .eq("id",id).eq("organization_id",ctx.organizationId);
  if(error) fail("save");
  refresh(store.slug);
  redirect(`${dashboard}?saved=removed`);
}
