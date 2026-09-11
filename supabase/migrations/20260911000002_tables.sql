-- Plantillas semilla (globales, no llevan family_id — se copian, no se referencian)
create table category_templates (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null default 0
);

create table product_templates (
  id uuid primary key default gen_random_uuid(),
  category_template_id uuid not null references category_templates(id) on delete cascade,
  nombre text not null,
  unidad_default unit_type not null default 'unidad'
);

create table families (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  estado family_status not null default 'activa',
  created_at timestamptz not null default now()
);

-- id coincide con auth.users.id (ver trigger handle_new_user)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nombre text not null,
  rol user_role not null default 'miembro',
  family_id uuid references families(id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index profiles_family_id_idx on profiles(family_id);

create table categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now(),
  unique (family_id, nombre)
);

create index categories_family_id_idx on categories(family_id);

create table products (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  nombre text not null,
  unidad_default unit_type not null default 'unidad',
  created_at timestamptz not null default now(),
  unique (family_id, nombre)
);

create index products_family_id_idx on products(family_id);
create index products_category_id_idx on products(category_id);

create table stores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now(),
  unique (family_id, nombre)
);

create index stores_family_id_idx on stores(family_id);

create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  fecha date not null default current_date,
  estado shopping_list_status not null default 'activa',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index shopping_lists_family_id_idx on shopping_lists(family_id);

create table list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references shopping_lists(id) on delete cascade,
  product_id uuid not null references products(id),
  cantidad numeric(10, 3) not null check (cantidad > 0),
  unidad unit_type not null,
  created_at timestamptz not null default now()
);

create index list_items_list_id_idx on list_items(list_id);

-- Nota: shopping_list_id no estaba en el borrador original del doc de contexto;
-- se agrega para poder calcular "productos de la lista aún sin comprar" al cerrar
-- una compra, ya que varias compras en_curso pueden coexistir en la misma familia.
create table purchases (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  shopping_list_id uuid references shopping_lists(id),
  store_id uuid not null references stores(id),
  fecha_compra date not null default current_date,
  moneda currency_code not null,
  tasa_cambio numeric(12, 4) not null check (tasa_cambio > 0),
  presupuesto_usd numeric(12, 2) check (presupuesto_usd >= 0),
  estado purchase_status not null default 'en_curso',
  creada_por uuid not null references profiles(id),
  factura_path text,
  created_at timestamptz not null default now()
);

create index purchases_family_id_idx on purchases(family_id);
create index purchases_shopping_list_id_idx on purchases(shopping_list_id);
create index purchases_store_id_idx on purchases(store_id);

create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id uuid not null references products(id),
  cantidad numeric(10, 3) not null check (cantidad > 0),
  unidad unit_type not null,
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  precio_unitario_usd numeric(12, 4) not null check (precio_unitario_usd >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  subtotal_usd numeric(12, 4) not null check (subtotal_usd >= 0),
  fuera_de_lista boolean not null default false,
  created_at timestamptz not null default now()
);

create index purchase_items_purchase_id_idx on purchase_items(purchase_id);
