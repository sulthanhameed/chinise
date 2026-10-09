-- =============================================================================
-- Khang Dimsum — core schema (Supabase / PostgreSQL)
-- Replaces the earlier MongoDB models: Users, Products, Categories, Orders,
-- Payments, Reviews, Tracking. Auth is handled by Supabase Auth (JWT).
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------- enums ------------------------------------------------------------
do $$ begin
  create type public.order_status as enum ('received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('upi', 'card', 'wallet', 'cod');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_provider as enum ('cod', 'razorpay', 'stripe', 'paypal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- ---------- tables -----------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  address     text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  emoji       text not null default '🥢',
  image_url   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  category_id  uuid not null references public.categories (id) on delete restrict,
  name         text not null,
  description  text not null default '',
  ingredients  text[] not null default '{}',
  price        numeric(10, 2) not null check (price >= 0),
  image_url    text,
  rating       numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  review_count int not null default 0,
  is_available boolean not null default true,
  is_featured  boolean not null default false,
  is_top       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_code       text not null unique default ('KH' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  user_id          uuid references auth.users (id) on delete set null,
  customer_name    text not null,
  customer_phone   text not null,
  customer_email   text,
  delivery_address text not null,
  notes            text,
  subtotal         numeric(10, 2) not null,
  tax              numeric(10, 2) not null,
  delivery_fee     numeric(10, 2) not null,
  total            numeric(10, 2) not null,
  status           public.order_status not null default 'received',
  payment_method   public.payment_method not null,
  payment_status   public.payment_status not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  product_name  text not null,
  unit_price    numeric(10, 2) not null,
  quantity      int not null check (quantity > 0 and quantity <= 50),
  line_total    numeric(10, 2) not null
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.payments (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid not null references public.orders (id) on delete cascade,
  provider             public.payment_provider not null,
  provider_order_id    text,
  provider_payment_id  text,
  amount               numeric(10, 2) not null,
  currency             text not null default 'INR',
  status               public.payment_status not null default 'pending',
  raw                  jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists payments_order_idx on public.payments (order_id);

create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid references public.products (id) on delete cascade,
  user_id      uuid references auth.users (id) on delete set null,
  author_name  text not null,
  rating       int not null check (rating between 1 and 5),
  comment      text not null default '',
  created_at   timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews (product_id);

create table if not exists public.tracking_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists tracking_order_idx on public.tracking_events (order_id, created_at);

-- ---------- helper functions -------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
drop trigger if exists payments_touch on public.payments;
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

-- is_admin() is SECURITY DEFINER so policies can check role without recursion
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Auto-create a profile for every new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep product rating + review_count in sync with reviews
create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid := coalesce(new.product_id, old.product_id);
begin
  if pid is not null then
    update public.products p
       set rating = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.product_id = pid), 0),
           review_count = (select count(*) from public.reviews r where r.product_id = pid)
     where p.id = pid;
  end if;
  return null;
end $$;

drop trigger if exists reviews_rating_sync on public.reviews;
create trigger reviews_rating_sync after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- Tracking timeline: first event on order creation, another on every status change
create or replace function public.log_order_tracking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.tracking_events (order_id, status, note) values (new.id, new.status, 'Order received');
  elsif new.status is distinct from old.status then
    insert into public.tracking_events (order_id, status, note)
    values (new.id, new.status,
      case new.status
        when 'preparing' then 'Our chefs are preparing your food'
        when 'out_for_delivery' then 'Your order is on the way'
        when 'delivered' then 'Delivered. Enjoy your meal!'
        when 'cancelled' then 'Order cancelled'
        else 'Order received'
      end);
  end if;
  return null;
end $$;

drop trigger if exists orders_tracking_log on public.orders;
create trigger orders_tracking_log after insert or update of status on public.orders
  for each row execute function public.log_order_tracking();

-- Public-safe tracking lookup by order code (no table access needed for anon)
create or replace function public.get_order_tracking(p_code text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'order_code', o.order_code,
    'status', o.status,
    'payment_status', o.payment_status,
    'total', o.total,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'events', coalesce((
      select json_agg(json_build_object('status', t.status, 'note', t.note, 'created_at', t.created_at)
                      order by t.created_at)
      from public.tracking_events t where t.order_id = o.id
    ), '[]'::json)
  )
  from public.orders o
  where upper(o.order_code) = upper(trim(p_code))
  limit 1;
$$;

grant execute on function public.get_order_tracking(text) to anon, authenticated;

-- Admin-only dashboard stats
create or replace function public.admin_dashboard_stats()
returns json language sql stable security definer set search_path = public as $$
  select case when not public.is_admin() then null else json_build_object(
    'orders_today', (select count(*) from public.orders where created_at >= date_trunc('day', now())),
    'revenue_paid', (select coalesce(sum(total), 0) from public.orders where payment_status = 'paid'),
    'open_orders', (select count(*) from public.orders where status not in ('delivered', 'cancelled')),
    'customers', (select count(*) from public.profiles where role = 'customer')
  ) end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;

-- ---------- row level security -----------------------------------------------
alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.payments        enable row level security;
alter table public.reviews         enable row level security;
alter table public.tracking_events enable row level security;

-- profiles
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (
    (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()))
    or public.is_admin()
  );

-- categories + products: anyone reads, only admins write
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select using (true);
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select using (true);
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- orders: customers see their own; admins see/update all. Inserts go through
-- the create-order edge function (service role) so prices are server-validated.
drop policy if exists orders_owner_read on public.orders;
create policy orders_owner_read on public.orders for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

drop policy if exists tracking_read on public.tracking_events;
create policy tracking_read on public.tracking_events for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- reviews: public read, logged-in users write their own, admins moderate
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews for select using (true);
drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews for insert
  with check (user_id = auth.uid());
drop policy if exists reviews_delete_own_or_admin on public.reviews;
create policy reviews_delete_own_or_admin on public.reviews for delete
  using (user_id = auth.uid() or public.is_admin());

-- Column-level grants: anon/authenticated may read catalog; no direct writes on
-- payments / tracking (service role only).
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.reviews to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items, public.payments, public.tracking_events to authenticated;
grant insert on public.reviews to authenticated;
grant delete on public.reviews to authenticated;
grant all on public.categories, public.products to authenticated;
