-- Catálogo semilla global (plantillas). Se copia a cada familia nueva vía
-- seed_family_catalog(); estas filas nunca se referencian directamente desde
-- una familia, solo se leen para copiar.
insert into category_templates (nombre, orden) values
  ('Granos y cereales', 1),
  ('Lácteos y huevos', 2),
  ('Carnes', 3),
  ('Despensa', 4),
  ('Aseo del hogar', 5),
  ('Limpieza', 6)
on conflict (nombre) do nothing;

insert into product_templates (category_template_id, nombre, unidad_default)
select ct.id, v.nombre, v.unidad::unit_type
from category_templates ct
join (
  values
    ('Granos y cereales', 'Arroz', 'kg'),
    ('Granos y cereales', 'Pasta', 'paquete'),
    ('Granos y cereales', 'Harina', 'kg'),
    ('Granos y cereales', 'Avena', 'paquete'),

    ('Lácteos y huevos', 'Leche', 'unidad'),
    ('Lácteos y huevos', 'Huevos', 'cubeta'),
    ('Lácteos y huevos', 'Queso', 'kg'),
    ('Lácteos y huevos', 'Mantequilla', 'unidad'),

    ('Carnes', 'Pollo', 'kg'),
    ('Carnes', 'Carne de res', 'kg'),
    ('Carnes', 'Cerdo', 'kg'),
    ('Carnes', 'Pescado', 'kg'),

    ('Despensa', 'Café', 'paquete'),
    ('Despensa', 'Azúcar', 'kg'),
    ('Despensa', 'Sal', 'paquete'),
    ('Despensa', 'Aceite', 'unidad'),

    ('Aseo del hogar', 'Papel higiénico', 'paquete'),
    ('Aseo del hogar', 'Servilletas', 'paquete'),
    ('Aseo del hogar', 'Bolsas de basura', 'paquete'),

    ('Limpieza', 'Detergente', 'unidad'),
    ('Limpieza', 'Jabón de platos', 'unidad'),
    ('Limpieza', 'Cloro', 'unidad'),
    ('Limpieza', 'Desinfectante', 'unidad')
) as v(categoria, nombre, unidad) on v.categoria = ct.nombre
where not exists (
  select 1 from product_templates pt
  where pt.category_template_id = ct.id and pt.nombre = v.nombre
);
