"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

const base = "/app/subscriptions";

function read(form: FormData, name: string) { return String(form.get(name) ?? "").trim(); }

export async function saveManagedSubscriptionAction(form: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER","ADMIN","MANAGER"].includes(role)) redirect(`${base}?error=permissions`);
  const id = read(form,"id");
  const customerId = read(form,"customer_id");
  const provider = "Google One";
  const planName = read(form,"plan_name");
  const managedEmail = read(form,"managed_email").toLowerCase();
  const monthlyPrice = Number(read(form,"monthly_price"));
  const renewalDay = Number(read(form,"renewal_day"));
  const storageRaw = read(form,"storage_gb");
  const costRaw = read(form,"monthly_cost");
  const storageGB = storageRaw ? Number(storageRaw) : null;
  const monthlyCost = costRaw ? Number(costRaw) : null;
  const status = read(form,"status") || "ACTIVE";
  const period = read(form,"last_confirmed_period") || null;
  const unpaidPeriod = read(form,"next_unpaid_period") || null;
  const paidAt = read(form,"last_confirmed_payment_date") || null;
  const notes = read(form,"notes").slice(0,1500) || null;
  const validPeriod = (v: string | null) => v === null || /^20\d{2}-(0[1-9]|1[0-2])$/.test(v);
  const validDate = paidAt === null || /^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(paidAt);
  if (!customerId || !planName || planName.length>120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managedEmail) ||
      managedEmail.length>254 || !Number.isFinite(monthlyPrice) || monthlyPrice < 0 ||
      !Number.isInteger(renewalDay) || renewalDay<1 || renewalDay>31 ||
      (storageGB !== null && (!Number.isInteger(storageGB) || storageGB<1)) ||
      (monthlyCost !== null && (!Number.isFinite(monthlyCost) || monthlyCost<0)) ||
      !["ACTIVE","PAUSED","CANCELED"].includes(status) ||
      !validPeriod(period) || !validPeriod(unpaidPeriod) || !validDate) {
    redirect(`${base}?error=invalid`);
  }
  const { data: customer } = await supabase.from("customers").select("id")
    .eq("organization_id",organizationId).eq("id",customerId).is("deleted_at",null).maybeSingle();
  if (!customer) redirect(`${base}?error=customer`);
  const payload = {
    provider,customer_id:customerId,plan_name:planName,managed_email:managedEmail,
    monthly_price:monthlyPrice,monthly_cost:monthlyCost,storage_gb:storageGB,
    renewal_day:renewalDay,status,last_confirmed_period:period,
    last_confirmed_payment_date:paidAt,next_unpaid_period:unpaidPeriod,
    notes,updated_at:new Date().toISOString()
  };
  let error;
  if (id) {
    const result = await supabase.from("managed_subscriptions").update(payload)
      .eq("id",id).eq("organization_id",organizationId).select("id").maybeSingle();
    error = result.error || (!result.data ? new Error("Not found") : null);
  } else {
    const result = await supabase.from("managed_subscriptions")
      .insert({...payload,organization_id:organizationId});
    error=result.error;
  }
  if (error) redirect(`${base}?error=save`);
  revalidatePath(base);
  redirect(`${base}?saved=1`);
}
