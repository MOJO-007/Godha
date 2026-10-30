
# Godha Food Products

## Product catalog management

The storefront reads active products from Supabase when configured. Without Supabase credentials, it uses the local catalog in `src/data/Products.ts`. The private `/admin` page lets the catalog administrator add, edit, hide, and restore products. Hiding a product keeps its record for future order history.

Customers do not need accounts. The admin page supports sign-in only; do not enable public sign-ups.

### One-time Supabase setup

1. Create a Supabase project and open its SQL Editor.
2. Run `supabase/schema.sql`, then run `supabase/seed.sql` to add the current products. If you already set up the earlier catalog schema, run all migrations in `supabase/migrations/` in filename order.
3. In Supabase Authentication settings, disable new user sign-ups. In Authentication → Users, manually create the catalog administrator account.
4. Copy that user's UUID and register it in the SQL Editor:

   ```sql
   insert into public.admin_users (user_id)
   values ('PASTE-ADMIN-USER-UUID-HERE');
   ```

5. Copy the project URL and the public anon/publishable key from Supabase API settings. Put them in a local `.env.local` file (see `.env.example`) and set the same values as Vercel project environment variables:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```

6. Redeploy Vercel and open `/admin` on the deployed site to manage the catalog.

The admin form also manages descriptions, pack size/net quantity, ingredients, allergens, in-stock availability, optional stock count, and a per-product maximum quantity per order. An out-of-stock product remains visible on the storefront, but customers cannot add it to their cart. Leave the stock count blank to show that inventory is not being tracked.

Click a product image or name to open its details dialog, review stock, and select the order quantity from a dropdown. Product names omit their pack quantities; set the actual pack size separately in `/admin`.

The cart's Checkout button opens `/checkout`, where customers can review unit price × quantity = line total, adjust quantities, and enter their name and delivery address. Submitting opens WhatsApp with the itemized order; this is still a manual order confirmation flow and does not collect payment.

The anon/publishable key is intended to be present in the browser. Row Level Security in `supabase/schema.sql` limits public access to reading active products and product images; only user IDs in `admin_users` can change products or upload images. Never put a Supabase `service_role` key in this frontend or in a `VITE_` variable.

### Local development

```sh
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local` before starting the dev server to use Supabase. Without it, the existing local catalog remains available.
