-- Traspaso atómico del rol de principal dentro de una misma familia.
-- Solo lo puede invocar el principal actual de esa familia, o el administrador.
create or replace function transfer_principal(p_family_id uuid, p_new_principal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role user_role;
  v_caller_family uuid;
  v_target profiles;
begin
  select rol, family_id into v_caller_role, v_caller_family from profiles where id = auth.uid();

  if not (v_caller_role = 'admin' or (v_caller_role = 'principal' and v_caller_family = p_family_id)) then
    raise exception 'Solo el principal de la familia o un administrador pueden traspasar el rol.';
  end if;

  select * into v_target from profiles where id = p_new_principal_id;
  if v_target.id is null or v_target.family_id is distinct from p_family_id or not v_target.activo then
    raise exception 'El nuevo principal debe ser un miembro activo de la misma familia.';
  end if;

  update profiles set rol = 'miembro' where family_id = p_family_id and rol = 'principal';
  update profiles set rol = 'principal' where id = p_new_principal_id;
end;
$$;

grant execute on function transfer_principal(uuid, uuid) to authenticated;

-- Quita a un miembro de la familia (family_id -> null). Los registros que ya
-- creó (listas, compras, etc.) se quedan con la familia, no con el perfil.
-- No se puede quitar así al principal: primero hay que traspasar el rol.
create or replace function remove_family_member(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role user_role;
  v_caller_family uuid;
  v_target profiles;
begin
  select rol, family_id into v_caller_role, v_caller_family from profiles where id = auth.uid();
  select * into v_target from profiles where id = p_profile_id;

  if v_target.id is null then
    raise exception 'Perfil no encontrado.';
  end if;

  if not (
    v_caller_role = 'admin'
    or (v_caller_role = 'principal' and v_caller_family = v_target.family_id)
    or auth.uid() = p_profile_id
  ) then
    raise exception 'No autorizado para quitar a este miembro de la familia.';
  end if;

  if v_target.rol = 'principal' then
    raise exception 'Traspasa el rol de principal antes de salir o de quitar a este miembro.';
  end if;

  update profiles set family_id = null where id = p_profile_id;
end;
$$;

grant execute on function remove_family_member(uuid) to authenticated;

-- Activa/desactiva un usuario sin tocar su familia. Tampoco aquí se puede
-- desactivar al principal sin haber traspasado el rol antes.
create or replace function set_profile_active(p_profile_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role user_role;
  v_caller_family uuid;
  v_target profiles;
begin
  select rol, family_id into v_caller_role, v_caller_family from profiles where id = auth.uid();
  select * into v_target from profiles where id = p_profile_id;

  if v_target.id is null then
    raise exception 'Perfil no encontrado.';
  end if;

  if not (
    v_caller_role = 'admin'
    or (v_caller_role = 'principal' and v_caller_family = v_target.family_id)
  ) then
    raise exception 'No autorizado para cambiar el estado de este perfil.';
  end if;

  if v_target.rol = 'principal' and p_active = false then
    raise exception 'Traspasa el rol de principal antes de desactivar a este usuario.';
  end if;

  update profiles set activo = p_active where id = p_profile_id;
end;
$$;

grant execute on function set_profile_active(uuid, boolean) to authenticated;

-- Copia las plantillas semilla (categorías y productos base) a una familia
-- recién creada. Copiadas, no compartidas por referencia: desde ese momento
-- son filas propias de la familia.
create or replace function seed_family_catalog(p_family_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_map jsonb := '{}'::jsonb;
  v_tmpl category_templates;
  v_new_category_id uuid;
begin
  if not (app_is_admin() or app_family_id() = p_family_id) then
    raise exception 'No autorizado para sembrar el catálogo de esta familia.';
  end if;

  for v_tmpl in select * from category_templates order by orden loop
    insert into categories (family_id, nombre)
    values (p_family_id, v_tmpl.nombre)
    returning id into v_new_category_id;

    v_map := v_map || jsonb_build_object(v_tmpl.id::text, v_new_category_id::text);
  end loop;

  insert into products (family_id, category_id, nombre, unidad_default)
  select p_family_id, (v_map ->> pt.category_template_id::text)::uuid, pt.nombre, pt.unidad_default
  from product_templates pt;
end;
$$;

grant execute on function seed_family_catalog(uuid) to authenticated;
