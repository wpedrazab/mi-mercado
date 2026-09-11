-- Crea la fila de profiles automáticamente cuando se crea el auth.users
-- correspondiente (invitación desde el panel de administrador o gestión
-- de familia). nombre/rol/family_id llegan en user_metadata de la invitación;
-- rol por defecto 'miembro' si no se especifica.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, nombre, rol, family_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', new.email),
    coalesce((new.raw_user_meta_data ->> 'rol')::user_role, 'miembro'),
    nullif(new.raw_user_meta_data ->> 'family_id', '')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- rol, family_id, activo y email de profiles son campos privilegiados: solo
-- se cambian desde las funciones administrativas de
-- 20260911000005_family_management_functions.sql (que se ejecutan como el
-- owner de la función, visible aquí como current_user = 'postgres') o desde
-- una sesión con rol de administrador de plataforma (soporte a cualquier
-- familia). Una sesión normal ('principal'/'miembro') nunca las cambia con
-- un UPDATE directo, solo a través de esas funciones.
create or replace function protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user <> 'postgres' and not app_is_admin() then
    if new.rol is distinct from old.rol
      or new.family_id is distinct from old.family_id
      or new.activo is distinct from old.activo
      or new.email is distinct from old.email
    then
      raise exception 'rol, family_id, activo y email solo se cambian mediante transfer_principal, remove_family_member, set_profile_active, o por un administrador.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileged_fields
  before update on profiles
  for each row execute function protect_privileged_profile_fields();
