# Supabase — modelo de datos y RLS

## Aplicar las migraciones

Ya se probaron contra un proyecto real (ver el bug de GRANT más abajo, ya corregido). Dos formas:

**A. Panel de Supabase (SQL Editor)** — pega y ejecuta cada archivo de `migrations/` en orden numérico (`20260911000001_...` → `20260911000010_...`).

**B. Supabase CLI**, si vinculas el proyecto:
```bash
npx supabase login
npx supabase link --project-ref <tu-project-ref>
npx supabase db push
```

Si algo falla al aplicar, pégame el error exacto y lo corregimos.

## Bootstrap del primer administrador

No hay forma de invitar al primer admin desde la app (nadie más existe todavía). Paso manual, una sola vez:
1. En el dashboard de Supabase → Authentication → crea el usuario del admin (su propio correo, separado del familiar).
2. En SQL Editor: `update profiles set rol = 'admin', family_id = null where email = 'admin@tudominio.com';`
   (Ejecutar desde el SQL Editor corre como `postgres`, así que el trigger de campos privilegiados lo permite.)

A partir de ahí, el admin invita desde el panel de administrador (pantalla `PanelAdmin`) al usuario principal de cada familia — eso ya sí queda cubierto por `auth.admin.inviteUserByEmail` + el trigger `handle_new_user`.

## Edge Functions (`supabase/functions/`)

`create-family` (panel de administrador) e `invite-member` (gestión de familia) son las únicas piezas que necesitan la **service-role key** — `auth.admin.inviteUserByEmail` no se puede llamar desde el navegador. No se pudieron probar en este entorno (no hay Deno instalado ni proyecto Supabase enlazado), así que revísalas con cuidado al desplegar.

Cada función abre dos clientes de Supabase distintos:
- uno "como quien llama" (con el `Authorization` header que manda el navegador) — decide si la operación está permitida vía RLS/perfil, igual que cualquier llamada normal del cliente;
- uno con la service-role key — **solo** para `auth.admin.inviteUserByEmail` y para chequear de antemano si el correo ya tiene cuenta (`profiles` no es visible entre familias para nadie que no sea admin).

Desplegar (con el proyecto ya enlazado, ver arriba):
```bash
npx supabase functions deploy create-family
npx supabase functions deploy invite-member
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente en todo Edge Function — no hay que configurar secretos a mano.

## Bug real encontrado al conectar contra un proyecto real (2026-09-11)

Las migraciones 1-9 se probaron solo contra respuestas simuladas (nunca contra Postgres real) hasta conectar este proyecto de verdad. Ahí salió un bug serio: **faltaba el `GRANT` base de las tablas al rol `authenticated`**. RLS es un filtro *adicional* sobre el permiso de SQL estándar, no un sustituto — sin `GRANT SELECT/INSERT/UPDATE/DELETE ... TO authenticated`, Postgres rechaza la operación con "permission denied" antes de llegar a evaluar ninguna policy. Síntoma real: el login en Supabase Auth funcionaba perfecto (`last_sign_in_at` se actualizaba), pero la app se quedaba pegada en la pantalla de login porque `fetchOwnProfile` fallaba en silencio.

Corregido en `20260911000010_grants.sql`. Si aplicaste las migraciones 1-9 antes de esa fecha, corre esa migración nueva (o el `GRANT` a mano) en tu proyecto.

## Decisiones y desvíos respecto al borrador del doc de contexto

- **`purchases.shopping_list_id`**: no estaba en el borrador de `CONTEXTO-PARA-CLAUDE-CODE.md`. Se agregó (nullable) porque el flujo de "avisar productos aún sin comprar" al cerrar necesita saber *qué* lista está surtiendo cada compra, y el doc permite varias compras `en_curso` simultáneas por familia.
- **Mutaciones privilegiadas de `profiles`** (`rol`, `family_id`, `activo`, `email`) están bloqueadas por un trigger para cualquier sesión autenticada normal; solo pasan a través de `transfer_principal`, `remove_family_member`, `set_profile_active`, o una sesión con `rol = 'admin'`. Así se garantiza en un solo lugar la regla de "nunca sin principal" y "traspasa antes de salir/desactivar".
- El trigger de arriba asume que las funciones `SECURITY DEFINER` quedan con dueño `postgres` (lo normal si las migraciones se corren desde el SQL Editor o `supabase db push` con el rol por defecto del proyecto). Si tu proyecto usa otro rol de owner, hay que ajustar el `current_user <> 'postgres'` en `20260911000004_profiles_trigger.sql`.
- Los templates (`category_templates` / `product_templates`) son de solo lectura para cualquier autenticado y de escritura solo para el admin; se copian (no se referencian) a cada familia nueva vía `seed_family_catalog(family_id)`.
- Bucket de Storage `facturas`: privado, ruta `{family_id}/{purchase_id}/{archivo}`, políticas por prefijo de carpeta.

## Qué falta (fuera de alcance de este paso)

- "Invitación pendiente" en la pantalla de gestión de familia (mockup 4): requeriría exponer `auth.users.last_sign_in_at` de alguna forma (RPC o Edge Function); se dejó fuera para no ampliar el alcance.
- Impersonar de verdad al usuario principal desde "Acceder (soporte)": el admin entra a la misma pantalla de gestión de familia con su propia sesión (ya tiene acceso vía RLS), no se generó una sesión/magic link a nombre del principal.
- Autohospedar Fredoka/Nunito (pendiente desde el scaffold).
