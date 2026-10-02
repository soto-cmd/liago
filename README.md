# LiaGo — Fase 1

Base técnica de LiaGo, una plataforma de gestión multiempresa inspirada en la experiencia de Cecilia Comercial.

## Incluye

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- componentes base compatibles con shadcn/ui
- Supabase Auth con SSR y cookies
- `proxy.ts` para refresco de sesión
- organizaciones multi-tenant
- membresías y roles
- sucursales preparadas
- suscripción FREE automática
- auditoría de cambios de tablas núcleo
- Row Level Security
- grants explícitos para proyectos Supabase nuevos
- onboarding de empresa
- recuperación y actualización de contraseña
- cierre de sesión
- selector seguro entre varias empresas del mismo usuario
- dashboard inicial

## No incluye todavía

Clientes, productos, ventas, deudas, pagos, caja, compras, proveedores y reportes. Esos módulos corresponden a las fases siguientes.

## 1. Crear un proyecto Supabase nuevo

No reutilices la base general donde vive Cecilia y otros proyectos.

## 2. Crear la migración oficial con Supabase CLI

No renombres manualmente un archivo dentro de `supabase/migrations`.

Ejecuta:

```bash
supabase migration new phase1_core
```

Copia el contenido de:

```text
supabase/sql/phase1_core.sql
```

al archivo de migración que genere la CLI.

Luego aplica la migración siguiendo tu flujo normal de Supabase.

## 3. Configurar variables

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completa:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
```

Usa una publishable key. No pongas service role en variables `NEXT_PUBLIC_*`.

## 4. Configurar Auth

En Supabase:

- habilita Email/Password;
- activa confirmación de email si quieres verificación obligatoria;
- agrega `http://localhost:3000/auth/callback` como redirect URL en desarrollo;
- agrega el dominio real de Vercel cuando lo publiques.

## 5. Instalar y ejecutar

```bash
npm install
npm run dev
```

## 6. Flujo

1. Usuario se registra.
2. Confirma el email.
3. Entra por `/auth/callback`.
4. Crea su primera empresa en `/onboarding`.
5. El RPC `create_organization` crea organización + membresía OWNER en una transacción.
6. El trigger crea automáticamente la suscripción FREE.
7. RLS limita los datos a las organizaciones de las que el usuario es miembro.

## Seguridad

- El frontend nunca decide por sí solo qué filas pertenecen al usuario.
- RLS vive en la base.
- La sesión SSR usa cookies.
- Las páginas autenticadas no usan ISR.
- `service_role` no aparece en el cliente.
- Las funciones auxiliares `SECURITY DEFINER` viven en el schema privado y no están expuestas directamente.
- `create_organization` usa `SECURITY INVOKER`.
