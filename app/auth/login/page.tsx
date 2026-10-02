import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Accede al espacio privado de tu empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-neutral-500">Cargando...</p>}>
            <LoginForm />
          </Suspense>
          <p className="mt-4 text-center text-sm">
            <Link className="underline" href="/auth/forgot-password">
              Olvidé mi contraseña
            </Link>
          </p>
          <p className="mt-4 text-center text-sm text-neutral-500">
            ¿No tienes cuenta?{" "}
            <Link className="font-medium text-neutral-950 underline" href="/auth/sign-up">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
