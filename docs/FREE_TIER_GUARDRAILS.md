# Reglas de consumo — LiaGo

Estas reglas son obligatorias para proteger los planes gratuitos de Vercel y Supabase.

## Regla principal

Todo cambio debe diseñarse con el menor consumo razonable de builds, funciones, consultas, almacenamiento y transferencia. Si una función puede resolverse de forma estática, local, cacheada o por evento, no debe implementarse con polling, tiempo real permanente ni llamadas repetitivas.

## Vercel

1. No generar un deploy por cada ajuste pequeño. Agrupar cambios y publicar una sola vez cuando el bloque esté terminado.
2. Los Preview Deployments deben permanecer desactivados salvo necesidad puntual de prueba.
3. Evitar funciones serverless para contenido que pueda ser estático.
4. Evitar `force-dynamic` salvo que sea estrictamente necesario.
5. Preferir Server Components para lectura y Client Components solo donde exista interacción real.
6. No crear endpoints API para lógica que pueda resolverse con Server Actions existentes o acceso directo seguro a Supabase.
7. No usar cron jobs frecuentes. Cualquier tarea programada debe justificar su frecuencia y usar la menor frecuencia posible.
8. No implementar polling agresivo. Como regla general, no consultar automáticamente con intervalos menores a 60 segundos y preferir actualización manual o por evento.
9. Mantener assets pequeños y locales cuando sea posible. Evitar imágenes pesadas y transformaciones innecesarias.
10. No activar servicios de observabilidad, analítica avanzada o integraciones que generen consumo adicional sin una necesidad concreta.

## Supabase

1. Nunca usar `select('*')` en listados de producción si solo se necesitan algunas columnas.
2. Todos los listados deben paginarse. No cargar tablas completas en una sola consulta.
3. Filtrar siempre por `organization_id` y por los campos necesarios para reducir filas transferidas.
4. Mantener índices en claves foráneas y columnas usadas frecuentemente en filtros u ordenamientos.
5. No habilitar Realtime de forma global. Solo usarlo en pantallas donde el tiempo real tenga valor real y cerrar la suscripción al salir.
6. No usar Edge Functions si la misma operación puede resolverse de forma segura con Server Actions o SQL/RPC ya existente.
7. Evitar consultas duplicadas en una misma navegación. Reutilizar datos ya cargados cuando sea seguro.
8. Evitar escrituras automáticas por cada render o navegación. Los registros de actividad deben agruparse o limitarse a eventos relevantes.
9. Los archivos deben tener límites de tamaño y, cuando aplique, compresión antes de subir a Storage.
10. Mantener RLS activa en tablas expuestas y optimizar llamadas como `auth.uid()` usando `(select auth.uid())` dentro de políticas cuando corresponda.
11. No eliminar índices solo porque figuren como no utilizados durante una etapa temprana del proyecto; revisar primero el patrón real de consultas.

## Caché y modo offline

1. El Service Worker debe cachear el shell y assets estáticos, no respuestas privadas sensibles.
2. Nunca cachear tokens, sesiones, datos personales sensibles ni respuestas autenticadas completas en Cache Storage.
3. Para trabajo offline, guardar solo los datos mínimos necesarios y sincronizar por lote al recuperar conexión.
4. Evitar sincronizaciones periódicas cuando no haya cambios pendientes.

## Desarrollo y despliegue

1. Preparar cambios en rama sin preview automático.
2. Ejecutar build local o CI una sola vez al cerrar el bloque de cambios.
3. Corregir todos los errores antes de fusionar a `main`.
4. Fusionar a `main` únicamente cuando el conjunto esté listo para producción.
5. Después del deploy, revisar errores de runtime y consumo antes de iniciar otro ciclo.

## Límites de diseño recomendados

- Listados: 25–50 filas por página por defecto.
- Búsquedas: usar debounce de 300–500 ms.
- Polling: evitar; si es imprescindible, mínimo 60 s salvo caso crítico documentado.
- Cargas de archivos: comprimir imágenes y definir tamaño máximo antes de subir.
- Reportes pesados: generar bajo demanda, no en cada apertura de pantalla.
- Dashboards: preferir agregaciones SQL y una sola consulta por bloque de métricas.

## Hallazgos de la revisión del 5 de octubre de 2026

- Supabase reportó una clave foránea sin índice de cobertura en `public.invitation_redemptions.organization_id`.
- Supabase reportó varias políticas RLS que recalculan funciones `auth.*` por fila y pueden optimizarse con subconsultas `select`.
- Existen políticas permisivas múltiples en algunas tablas; deben consolidarse con cuidado para mejorar rendimiento sin alterar permisos.
- Los índices marcados como no utilizados no deben eliminarse todavía porque LiaGo está en etapa temprana y el volumen de uso real aún es bajo.

Estas reglas deben revisarse antes de introducir cualquier función que implique sincronización continua, Realtime, cron, cargas grandes, reportes masivos o nuevos servicios externos.
