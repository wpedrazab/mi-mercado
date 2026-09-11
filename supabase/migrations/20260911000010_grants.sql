-- Las políticas RLS son un filtro adicional sobre el permiso base de SQL,
-- no un sustituto: sin GRANT, Postgres rechaza la operación con
-- "permission denied" antes de llegar a evaluar ninguna policy. Esto se
-- detectó en producción (login exitoso en Supabase Auth, pero el perfil
-- nunca cargaba) porque hasta ahora todas las pruebas de este proyecto
-- corrieron contra un backend simulado, no contra Postgres real.
--
-- Se otorga la base amplia (select/insert/update/delete) al rol
-- `authenticated`; la restricción fina (quién puede hacer qué sobre qué
-- fila) sigue siendo enteramente responsabilidad de las policies ya
-- creadas en 20260911000006_rls.sql — igual que ya pasaba con las 4
-- funciones RPC de 20260911000005, que sí tenían su GRANT EXECUTE propio.
grant select, insert, update, delete on families to authenticated;
grant select, insert, update, delete on profiles to authenticated;
grant select, insert, update, delete on category_templates to authenticated;
grant select, insert, update, delete on product_templates to authenticated;
grant select, insert, update, delete on categories to authenticated;
grant select, insert, update, delete on products to authenticated;
grant select, insert, update, delete on stores to authenticated;
grant select, insert, update, delete on shopping_lists to authenticated;
grant select, insert, update, delete on list_items to authenticated;
grant select, insert, update, delete on purchases to authenticated;
grant select, insert, update, delete on purchase_items to authenticated;
