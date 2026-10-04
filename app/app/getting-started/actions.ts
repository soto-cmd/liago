"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";

export async function setOnboardingStepAction(step: number) {
  const { supabase, userId } = await requireUser();
  const safeStep = Math.max(1, Math.min(6, Number(step) || 1));
  await supabase.from("onboarding_progress").upsert({
    user_id: userId,
    current_step: safeStep,
    skipped: false,
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/app");
  revalidatePath("/app/getting-started");
}

export async function completeOnboardingAction() {
  const { supabase, userId } = await requireUser();
  await supabase.from("onboarding_progress").upsert({
    user_id: userId,
    current_step: 6,
    completed: true,
    skipped: false,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/app");
  revalidatePath("/app/getting-started");
}

export async function skipOnboardingAction() {
  const { supabase, userId } = await requireUser();
  await supabase.from("onboarding_progress").upsert({
    user_id: userId,
    skipped: true,
    skipped_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/app");
  revalidatePath("/app/getting-started");
}

export async function restartOnboardingAction() {
  const { supabase, userId } = await requireUser();
  await supabase.from("onboarding_progress").upsert({
    user_id: userId,
    current_step: 1,
    completed: false,
    skipped: false,
    completed_at: null,
    skipped_at: null,
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/app");
  revalidatePath("/app/getting-started");
}
