-- Funciones auxiliares para las políticas RLS. SECURITY DEFINER + fijar
-- search_path evita tanto la recursión de RLS sobre profiles (la función
-- lee profiles con los privilegios del owner, sin volver a pasar por las
-- policies) como la inyección de search_path.

create or replace function app_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select rol from profiles where id = auth.uid();
$$;

create or replace function app_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from profiles where id = auth.uid();
$$;

create or replace function app_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app_role() = 'admin', false);
$$;

-- true solo si el usuario actual pertenece a una familia y esa familia está activa
create or replace function app_family_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select f.estado = 'activa' from families f where f.id = app_family_id()),
    false
  );
$$;
