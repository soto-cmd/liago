"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const origin = window.location.origin;
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    const requestedNext = params.get("next");
    const next = requestedNext || (invite ? `/onboarding?invite=${encodeURIComponent(invite)}` : "/onboarding");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Cuenta creada. Revisa tu correo para confirmar el registro.");
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <Input name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Contraseña</label>
        <Input name="password" type="password" minLength={8} autoComplete="new-password" required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Repetir contraseña</label>
        <Input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required />
      </div>

      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      <Button className="w-full" disabled={loading}>
        {loading ? "Creando..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
