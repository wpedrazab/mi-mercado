-- Renombrar una familia: el principal de esa familia (o el admin) puede
-- cambiar el nombre, pero NO el estado (activa/inactiva) — eso sigue
-- reservado a families_update (solo admin, en 20260911000006_rls.sql).
create or replace function rename_family(p_family_id uuid, p_nombre text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role user_role;
  v_caller_family uuid;
begin
  select rol, family_id into v_caller_role, v_caller_family from profiles where id = auth.uid();

  if not (v_caller_role = 'admin' or (v_caller_role = 'principal' and v_caller_family = p_family_id)) then
    raise exception 'Solo el principal de la familia o un administrador pueden renombrarla.';
  end if;

  if p_nombre is null or length(trim(p_nombre)) = 0 then
    raise exception 'El nombre no puede estar vacío.';
  end if;

  update families set nombre = trim(p_nombre) where id = p_family_id;
end;
$$;

grant execute on function rename_family(uuid, text) to authenticated;
