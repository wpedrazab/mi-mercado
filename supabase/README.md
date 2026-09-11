# Supabase — modelo de datos y RLS

## Aplicar las migraciones

No se probaron contra una instancia real (este entorno no tiene Docker ni Postgres local), así que revísalas al aplicarlas la primera vez. Dos formas:

**A. Panel de Supabase (SQL Editor)** — pega y ejecuta cada archivo de `migrations/` en orden numérico (`20260911000001_...` → `20260911000008_...`).

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

## Decisiones y desvíos respecto al borrador del doc de contexto

- **`purchases.shopping_list_id`**: no estaba en el borrador de `CONTEXTO-PARA-CLAUDE-CODE.md`. Se agregó (nullable) porque el flujo de "avisar productos aún sin comprar" al cerrar necesita saber *qué* lista está surtiendo cada compra, y el doc permite varias compras `en_curso` simultáneas por familia.
- **Mutaciones privilegiadas de `profiles`** (`rol`, `family_id`, `activo`, `email`) están bloqueadas por un trigger para cualquier sesión autenticada normal; solo pasan a través de `transfer_principal`, `remove_family_member`, `set_profile_active`, o una sesión con `rol = 'admin'`. Así se garantiza en un solo lugar la regla de "nunca sin principal" y "traspasa antes de salir/desactivar".
- El trigger de arriba asume que las funciones `SECURITY DEFINER` quedan con dueño `postgres` (lo normal si las migraciones se corren desde el SQL Editor o `supabase db push` con el rol por defecto del proyecto). Si tu proyecto usa otro rol de owner, hay que ajustar el `current_user <> 'postgres'` en `20260911000004_profiles_trigger.sql`.
- Los templates (`category_templates` / `product_templates`) son de solo lectura para cualquier autenticado y de escritura solo para el admin; se copian (no se referencian) a cada familia nueva vía `seed_family_catalog(family_id)`.
- Bucket de Storage `facturas`: privado, ruta `{family_id}/{purchase_id}/{archivo}`, políticas por prefijo de carpeta.

## Qué falta (fuera de alcance de este paso)

- La función Edge/cliente que realmente invita usuarios (`auth.admin.inviteUserByEmail` con `user_metadata: { nombre, family_id, rol }`) — corresponde al paso de Autenticación / Panel de administrador del roadmap, no al modelo de datos.
- Autohospedar Fredoka/Nunito (pendiente desde el scaffold).
