-- Mismo problema que 20260911000010 pero para service_role: que un rol
-- tenga BYPASSRLS no lo exime del permiso base de SQL sobre la tabla —
-- son cosas independientes. Las Edge Functions (create-family,
-- invite-member) usan un cliente con la service-role key para
-- auth.admin.inviteUserByEmail y para chequear si un correo ya existe en
-- profiles; sin este GRANT, ese segundo chequeo fallaba con
-- "permission denied for table profiles" (visto en los logs reales de
-- create-family).
grant select, insert, update, delete on families to service_role;
grant select, insert, update, delete on profiles to service_role;
grant select, insert, update, delete on category_templates to service_role;
grant select, insert, update, delete on product_templates to service_role;
grant select, insert, update, delete on categories to service_role;
grant select, insert, update, delete on products to service_role;
grant select, insert, update, delete on stores to service_role;
grant select, insert, update, delete on shopping_lists to service_role;
grant select, insert, update, delete on list_items to service_role;
grant select, insert, update, delete on purchases to service_role;
grant select, insert, update, delete on purchase_items to service_role;
