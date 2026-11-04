create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  customer_name text not null,
  customer_address text not null,
  items jsonb not null,
  amount integer not null check (amount > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant all on public.orders to service_role;
