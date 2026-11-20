"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireActiveOrganization} from "@/lib/organizations/active-organization";
export async function assignMissingPaymentCustomerAction(formData:FormData){
 const {supabase,organizationId,role}=await requireActiveOrganization();
 const paymentId=String(formData.get("payment_id")||"");
 const customerId=String(formData.get("customer_id")||"");
 const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!["OWNER","ADMIN","MANAGER"].includes(role)||!valid.test(paymentId)||!valid.test(customerId))
  redirect("/app/payments?error=customer_assignment");
 const {error}=await supabase.rpc("assign_missing_payment_customer",{
  p_organization_id:organizationId,p_payment_id:paymentId,p_customer_id:customerId
 });
 if(error)redirect("/app/payments/"+paymentId+"?error=customer_assignment");
 revalidatePath("/app/payments");revalidatePath("/app/sales");revalidatePath("/app/customers");
 revalidatePath("/app/payments/"+paymentId);
 redirect("/app/payments/"+paymentId+"?updated=customer");
}
