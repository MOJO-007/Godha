alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'dispatched'));

grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;

drop policy if exists "Catalog admins can view orders" on public.orders;
create policy "Catalog admins can view orders"
  on public.orders for select
  to authenticated
  using (public.is_catalog_admin());

drop policy if exists "Catalog admins can dispatch paid orders" on public.orders;
create policy "Catalog admins can dispatch paid orders"
  on public.orders for update
  to authenticated
  using (public.is_catalog_admin() and status = 'paid')
  with check (public.is_catalog_admin() and status = 'dispatched');
