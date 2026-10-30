alter table public.products
  add column if not exists description text not null default '',
  add column if not exists pack_size text not null default '',
  add column if not exists ingredients text not null default '',
  add column if not exists allergens text not null default '',
  add column if not exists is_available boolean not null default true;
