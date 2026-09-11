-- Bucket privado de facturas/tickets. Convención de ruta:
-- {family_id}/{purchase_id}/{archivo}
insert into storage.buckets (id, name, public)
values ('facturas', 'facturas', false)
on conflict (id) do nothing;

-- No se toca "alter table storage.objects enable row level security": en
-- Supabase hospedado esa tabla es propiedad de supabase_storage_admin, no de
-- postgres, así que ese ALTER falla con "must be owner of table objects"
-- (visto en la práctica al aplicar esta migración). RLS ya viene activado
-- ahí por defecto — solo hace falta crear las políticas.

create policy facturas_select on storage.objects
  for select
  using (
    bucket_id = 'facturas'
    and (app_is_admin() or (storage.foldername(name))[1] = app_family_id()::text)
  );

create policy facturas_insert on storage.objects
  for insert
  with check (
    bucket_id = 'facturas'
    and (app_is_admin() or ((storage.foldername(name))[1] = app_family_id()::text and app_family_active()))
  );

create policy facturas_update on storage.objects
  for update
  using (
    bucket_id = 'facturas'
    and (app_is_admin() or ((storage.foldername(name))[1] = app_family_id()::text and app_family_active()))
  )
  with check (
    bucket_id = 'facturas'
    and (app_is_admin() or ((storage.foldername(name))[1] = app_family_id()::text and app_family_active()))
  );

create policy facturas_delete on storage.objects
  for delete
  using (
    bucket_id = 'facturas'
    and (app_is_admin() or ((storage.foldername(name))[1] = app_family_id()::text and app_family_active()))
  );
