"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export async function createOrganizationAction(formData: FormData) {
  const { supabase } = await requireUser();

  const name = String(formData.get("name") || "").trim();
  const legalName = String(formData.get("legalName") || "").trim();
  const taxId = String(formData.get("taxId") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const country = String(formData.get("country") || "PY").trim().toUpperCase();
  const currency = String(formData.get("currency") || "PYG").trim().toUpperCase();
  const primaryColor = String(formData.get("primaryColor") || "#171717").trim();

  if (!name) {
    redirect("/onboarding?error=missing_name");
  }

  const { error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_legal_name: legalName || null,
    p_tax_id: taxId || null,
    p_phone: phone || null,
    p_whatsapp: whatsapp || null,
    p_email: email || null,
    p_address: address || null,
    p_city: city || null,
    p_country: country,
    p_currency: currency,
    p_primary_color: primaryColor,
  });

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/app");
}
