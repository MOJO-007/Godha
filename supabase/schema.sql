create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  price numeric(10, 2) not null check (price > 0),
  image text not null,
  category text not null,
  description text not null default '',
  pack_size text not null default '',
  ingredients text not null default '',
  allergens text not null default '',
  is_available boolean not null default true,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  max_order_quantity integer not null default 10 check (max_order_quantity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.products enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_catalog_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_catalog_admin() from public;
grant execute on function public.is_catalog_admin() to authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Catalog admins can manage products" on public.products;
create policy "Catalog admins can manage products"
  on public.products for all
  to authenticated
  using (public.is_catalog_admin())
  with check (public.is_catalog_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view product images" on storage.objects;
create policy "Anyone can view product images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

drop policy if exists "Catalog admins can upload product images" on storage.objects;
create policy "Catalog admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_catalog_admin());

drop policy if exists "Catalog admins can update product images" on storage.objects;
create policy "Catalog admins can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_catalog_admin())
  with check (bucket_id = 'product-images' and public.is_catalog_admin());

drop policy if exists "Catalog admins can delete product images" on storage.objects;
create policy "Catalog admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_catalog_admin());
