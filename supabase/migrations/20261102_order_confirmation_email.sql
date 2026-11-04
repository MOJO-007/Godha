alter table public.orders
  add column if not exists customer_email text,
  add column if not exists confirmation_email_sent_at timestamptz;
