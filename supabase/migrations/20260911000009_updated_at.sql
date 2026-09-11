-- updated_at para las tablas del flujo de compra (local-first): la capa de
-- sincronización lo usa para resolver conflictos con "gana la última
-- escritura" al reconciliar lo local (Dexie) con lo remoto.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'products', 'stores',
    'shopping_lists', 'list_items',
    'purchases', 'purchase_items'
  ]
  loop
    execute format('alter table %I add column updated_at timestamptz not null default now();', t);
    execute format('create trigger %I before update on %I for each row execute function set_updated_at();', t || '_set_updated_at', t);
  end loop;
end;
$$;
