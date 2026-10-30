alter table public.products
  add column if not exists max_order_quantity integer not null default 10
  check (max_order_quantity > 0);

update public.products
set
  name = case id
    when '1' then 'Puliyogre Gojju'
    when '2' then 'Chutney Powder'
    when '3' then 'Peanut Chutney Powder'
    when '5' then 'Vangibath Powder'
    when '6' then 'Rasam Powder'
    when '7' then 'Sambhar Powder'
    when '8' then 'Dry Fruits Laddoo'
    when '9' then 'Kodbale'
    when '10' then 'Maddur Vade'
    else regexp_replace(name, '\s*\((1[Kk][Gg]|1[Pp]cs)\)$', '')
  end,
  pack_size = case
    when nullif(btrim(pack_size), '') is not null then pack_size
    when id in ('1', '2', '3', '5', '6', '7', '8', '9') then '1 kg'
    when id = '10' then '1 piece'
    else pack_size
  end
where id in ('1', '2', '3', '5', '6', '7', '8', '9', '10');
