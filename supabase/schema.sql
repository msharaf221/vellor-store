-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Creates the tables, security rules, stock handling and the image bucket.

create table if not exists categories (
  id text primary key,
  name text not null,
  sort int default 0
);

create table if not exists products (
  id text primary key,
  cat text references categories(id) on update cascade on delete set null,
  name text not null,
  en text default '',
  descr text default '',
  price int not null default 0,
  img jsonb not null default '{}'::jsonb,       -- {"colour name": "image url or image file name"}
  sizes jsonb not null default '[]'::jsonb,
  stock int,                                     -- null = unlimited
  featured boolean not null default false,
  badge text default '',
  active boolean not null default true,
  sort int not null default 0,
  updated timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  ref text,
  created timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','confirmed','shipped','delivered','cancelled')),
  name text, phone text, gov text, addr text,
  pay text,
  items jsonb not null default '[]'::jsonb,
  sub int default 0, ship int default 0, total int default 0,
  note text default ''
);

create table if not exists settings (
  key text primary key,
  value jsonb
);

alter table categories enable row level security;
alter table products   enable row level security;
alter table orders     enable row level security;
alter table settings   enable row level security;

-- Visitors (anon): read the catalogue and settings, and place orders. Nothing else.
create policy "public read categories" on categories for select to anon, authenticated using (true);
create policy "public read products"   on products   for select to anon using (active = true);
create policy "public read settings"   on settings   for select to anon, authenticated using (true);
create policy "public place order"     on orders     for insert to anon with check (status = 'new');

-- The signed-in admin (authenticated): full access.
create policy "admin all categories" on categories for all to authenticated using (true) with check (true);
create policy "admin all products"   on products   for all to authenticated using (true) with check (true);
create policy "admin all orders"     on orders     for all to authenticated using (true) with check (true);
create policy "admin all settings"   on settings   for all to authenticated using (true) with check (true);

-- Stock: subtract when an order arrives, give back when it is cancelled.
create or replace function adjust_stock() returns trigger language plpgsql security definer set search_path = public as $$
declare it jsonb;
begin
  if (tg_op = 'INSERT') then
    for it in select * from jsonb_array_elements(new.items) loop
      update products set stock = greatest(0, stock - coalesce((it->>'q')::int, 1)) where id = it->>'id' and stock is not null;
    end loop;
  elsif (tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled') then
    for it in select * from jsonb_array_elements(new.items) loop
      update products set stock = stock + coalesce((it->>'q')::int, 1) where id = it->>'id' and stock is not null;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists orders_stock on orders;
create trigger orders_stock after insert or update on orders for each row execute function adjust_stock();

-- Image bucket (public read, only the admin can upload).
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict (id) do nothing;
create policy "public read product images" on storage.objects for select using (bucket_id = 'products');
create policy "admin upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'products');
create policy "admin update product images" on storage.objects for update to authenticated using (bucket_id = 'products');
create policy "admin delete product images" on storage.objects for delete to authenticated using (bucket_id = 'products');

-- Starter categories and the products currently in products.js are loaded from the admin app
-- (open /admin/ after switching on, then add your categories and products there).
