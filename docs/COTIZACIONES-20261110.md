# Cotizaciones en Liago — 10/11/2026

Implementación **exclusiva en Liago**, repositorio `soto-cmd/liago`. No modificar el Apps Script de A&M, ni sus hojas, PDF o recibos.

## Funcionalidad
- Menú `Cotizaciones` -> `/app/quotations`.
- Clientes tomados de `public.customers` de la empresa activa, con búsqueda por nombre, teléfono o código.
- Servicios y productos desde `public.products`, precios editables por cotización.
- Numeración atómica e independiente por empresa en `quotation_counters`.
- Formulario con conceptos, subtotal, anticipo previsto, saldo, fecha del evento, lugar y observaciones.
- Historial de cotizaciones y vista de impresión A4 / guardar PDF desde navegador.
- Cotizar **no** crea venta, deuda, recibo ni asiento de caja.
- Datos protegidos con RLS y permisos de miembros de la empresa activa.

## A&M: migración de datos (solo lectura del sistema original)
Fuente: planilla `Sistema de Cotizaciones y Recibos - A&M Estudio Fotográfico`. Al 10/11/2026:
- Importados los 119 registros de clientes de origen por medio de SQL, deduplicados por nombre/código, con datos visibles válidos. No guardar `#ERROR!` como teléfono.
- Importados 11 servicios catalogados activos en la planilla, con precios en cero cuando estaban vacíos; conservar los servicios ya existentes en Liago.
- Conservado el prefijo original del cliente `CLI-...`.
- El último número real comprobado en las cotizaciones de origen era **242**. El contador de la empresa A&M en Liago se inició en **243**, comprobado contra Configuración.
- No se copiaron aún los documentos históricos de cotización ni recibos a Liago; permanecen disponibles en el sistema de origen. No presentar el historial de Liago como un historial total previo a migración.

## Activación
- Migración SQL `supabase/sql/011_quotations.sql` ya aplicada en el proyecto Supabase LiaGo (`jyjpfhsaauuqrymtukpy`) el 10/11/2026.
- Repositorio y rama preparados para revisión y despliegue.
- El proyecto `liago` no apareció en los proyectos Vercel vinculados a las tres cuentas disponibles: no afirmar que se desplegó ni tocar un proyecto Vercel no identificado.
- Verificar compilación de Next.js en CI/preview antes de integrar a main.
- Verificar edición de clientes, emisión de primera cotización 243, PDF, logo original, permisos entre empresas y uso en celular.

## Observaciones
- A&M tiene un logo existente en `public/am-estudio-logo.svg`, utilizado solo como fallback de impresión si la organización A&M no tiene logo configurado.
- Este PDF es una **cotización**, no una factura tributaria.
- Si se requieren estados, edición, aprobación y conversión a venta, hacerlo como extensión posterior; no reutilizar la lógica de ventas para crear una transacción al guardar el presupuesto.
