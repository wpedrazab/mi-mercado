create extension if not exists pgcrypto;

create type family_status as enum ('activa', 'inactiva');
create type user_role as enum ('admin', 'principal', 'miembro');
create type unit_type as enum ('kg', 'g', 'l', 'ml', 'unidad', 'paquete', 'cubeta');
create type currency_code as enum ('VES', 'USD', 'COP');
create type shopping_list_status as enum ('activa', 'convertida');
create type purchase_status as enum ('en_curso', 'cerrada');
