-- ===== families =====
alter table families enable row level security;

create policy families_select on families
  for select
  using (
    app_is_admin()
    or (id = app_family_id() and estado = 'activa')
  );

-- Solo el administrador crea familias y cambia su estado (activa/inactiva).
create policy families_insert on families
  for insert
  with check (app_is_admin());

create policy families_update on families
  for update
  using (app_is_admin())
  with check (app_is_admin());

-- ===== profiles =====
alter table profiles enable row level security;

-- Cualquiera ve su propio perfil; los miembros de una familia activa se ven
-- entre sí; el admin ve todo (incluida gente sin family_id o de familias inactivas,
-- para poder dar soporte).
create policy profiles_select on profiles
  for select
  using (
    id = auth.uid()
    or app_is_admin()
    or (family_id = app_family_id() and app_family_active())
  );

-- La fila la crea únicamente el trigger handle_new_user (se ejecuta como el
-- owner de la función); ninguna sesión autenticada inserta profiles directo.
create policy profiles_insert on profiles
  for insert
  with check (false);

-- Cada quien edita su propia fila; el admin puede editar cualquiera (soporte).
-- Los campos privilegiados (rol, family_id, activo, email) quedan bloqueados
-- por el trigger de la migración anterior salvo que se use transfer_principal
-- / remove_family_member / set_profile_active, o que la sesión sea admin.
create policy profiles_update on profiles
  for update
  using (id = auth.uid() or app_is_admin())
  with check (id = auth.uid() or app_is_admin());

-- ===== category_templates / product_templates =====
-- Catálogo semilla global: de lectura libre (se usa al crear una familia),
-- solo el administrador lo mantiene.
alter table category_templates enable row level security;
alter table product_templates enable row level security;

create policy category_templates_select on category_templates
  for select using (true);

create policy category_templates_write on category_templates
  for all using (app_is_admin()) with check (app_is_admin());

create policy product_templates_select on product_templates
  for select using (true);

create policy product_templates_write on product_templates
  for all using (app_is_admin()) with check (app_is_admin());

-- ===== catálogos por familia: categories, products, stores =====
-- Mismo patrón en las tres: todos los miembros de una familia activa leen y
-- escriben por igual (doc: "todos ven y editan por igual"); el admin, todo.
alter table categories enable row level security;
create policy categories_all on categories
  for all
  using (app_is_admin() or (family_id = app_family_id() and app_family_active()))
  with check (app_is_admin() or (family_id = app_family_id() and app_family_active()));

alter table products enable row level security;
create policy products_all on products
  for all
  using (app_is_admin() or (family_id = app_family_id() and app_family_active()))
  with check (app_is_admin() or (family_id = app_family_id() and app_family_active()));

alter table stores enable row level security;
create policy stores_all on stores
  for all
  using (app_is_admin() or (family_id = app_family_id() and app_family_active()))
  with check (app_is_admin() or (family_id = app_family_id() and app_family_active()));

-- ===== shopping_lists / list_items =====
alter table shopping_lists enable row level security;
create policy shopping_lists_all on shopping_lists
  for all
  using (app_is_admin() or (family_id = app_family_id() and app_family_active()))
  with check (app_is_admin() or (family_id = app_family_id() and app_family_active()));

alter table list_items enable row level security;
create policy list_items_all on list_items
  for all
  using (
    app_is_admin()
    or exists (
      select 1 from shopping_lists sl
      where sl.id = list_items.list_id
        and sl.family_id = app_family_id()
        and app_family_active()
    )
  )
  with check (
    app_is_admin()
    or exists (
      select 1 from shopping_lists sl
      where sl.id = list_items.list_id
        and sl.family_id = app_family_id()
        and app_family_active()
    )
  );

-- ===== purchases / purchase_items =====
alter table purchases enable row level security;
create policy purchases_all on purchases
  for all
  using (app_is_admin() or (family_id = app_family_id() and app_family_active()))
  with check (app_is_admin() or (family_id = app_family_id() and app_family_active()));

alter table purchase_items enable row level security;
create policy purchase_items_all on purchase_items
  for all
  using (
    app_is_admin()
    or exists (
      select 1 from purchases p
      where p.id = purchase_items.purchase_id
        and p.family_id = app_family_id()
        and app_family_active()
    )
  )
  with check (
    app_is_admin()
    or exists (
      select 1 from purchases p
      where p.id = purchase_items.purchase_id
        and p.family_id = app_family_id()
        and app_family_active()
    )
  );
