
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

The cart's Checkout button opens `/checkout`, where customers can review unit price × quantity = line total, adjust quantities, and enter their name, email, and delivery address. Razorpay checkout creates the order through Supabase Edge Functions; the server recalculates prices from the active catalog, verifies the payment signature and captured amount, saves the paid order, and sends a confirmation email through Resend. After payment, customers can also send the saved order details to WhatsApp.

The `/admin` page also lists orders for catalog administrators. Paid orders can be marked as dispatched; order access is restricted to administrator accounts by row-level security.

The anon/publishable key is intended to be present in the browser. Row Level Security in `supabase/schema.sql` limits public access to reading active products and product images; only user IDs in `admin_users` can change products or upload images. Never put a Supabase `service_role` key or the Razorpay key secret in this frontend or in a `VITE_` variable.

### Razorpay test payments

1. Apply `supabase/migrations/20261031_razorpay_orders.sql` to create the private order table and `supabase/migrations/20261101_admin_order_management.sql` to enable the admin order view and dispatch status.
2. Apply `supabase/migrations/20261102_order_confirmation_email.sql` to store the customer email and confirmation delivery status.
3. Verify `godha.in` as a sending domain in Resend, then set the Resend API key and sender address as Supabase Edge Function secrets:

   ```sh
   supabase secrets set RESEND_API_KEY=your_resend_api_key RESEND_FROM_EMAIL=orders@godha.in
   ```

4. Set the Razorpay test Key ID and Key Secret as Supabase Edge Function secrets (do not put the secret in `.env` or share it in chat):

   ```sh
   supabase secrets set RAZORPAY_KEY_ID=your_test_key_id RAZORPAY_KEY_SECRET=your_test_key_secret
   ```

5. Deploy both payment functions:

   ```sh
   supabase functions deploy create-razorpay-order
   supabase functions deploy verify-razorpay-payment
   ```

6. Ensure the site has its Supabase project URL and anon key configured, then redeploy the site. The payment form confirms the order only after the backend confirms the Razorpay payment is captured.

Use the test keys and Razorpay's test payment details while validating. When going live, replace the Edge Function secrets with the live Key ID and Key Secret.

### Local development

```sh
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local` before starting the dev server to use Supabase. Without it, the existing local catalog remains available.
