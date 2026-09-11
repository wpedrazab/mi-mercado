-- Bucket privado de facturas/tickets. Convención de ruta:
-- {family_id}/{purchase_id}/{archivo}
insert into storage.buckets (id, name, public)
values ('facturas', 'facturas', false)
on conflict (id) do nothing;

-- Ya viene habilitado por defecto en un proyecto Supabase estándar; se deja
-- explícito por si se corre en un self-host donde no sea el caso (idempotente).
alter table storage.objects enable row level security;

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
