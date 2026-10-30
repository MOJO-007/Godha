insert into public.products (id, name, price, image, category, pack_size, is_active)
values
  ('1', 'Puliyogre Gojju', 500, '/products/puliyogre.jpeg', 'Gojju', '1 kg', true),
  ('2', 'Chutney Powder', 600, '/products/chutneyPowder.jpeg', 'Powders', '1 kg', true),
  ('3', 'Peanut Chutney Powder', 700, '/products/peanutPowder.jpeg', 'Powders', '1 kg', true),
  ('4', 'Bisibele bath Powder', 199, '/products/bisibeleBathPowder.jpeg', 'Powders', '', true),
  ('5', 'Vangibath Powder', 600, '/products/vangibathPowder.jpeg', 'Powders', '1 kg', true),
  ('6', 'Rasam Powder', 800, '/products/rasamPowder.jpeg', 'Powders', '1 kg', true),
  ('7', 'Sambhar Powder', 800, '/products/sambharPowder.jpeg', 'Powders', '1 kg', true),
  ('8', 'Dry Fruits Laddoo', 1200, '/products/dryFruitsLaddoo.jpeg', 'Sweets', '1 kg', true),
  ('9', 'Kodbale', 400, '/products/kodbale.jpeg', 'Snacks', '1 kg', true),
  ('10', 'Maddur Vade', 20, '/products/maddurVade.jpeg', 'Snacks', '1 piece', true)
on conflict (id) do update
set name = excluded.name,
    price = excluded.price,
    image = excluded.image,
    category = excluded.category,
    pack_size = excluded.pack_size,
    is_active = excluded.is_active;
