-- ============================================================
-- Bartender Bot — Supabase database setup
--
-- Run this ONCE in the Supabase SQL Editor:
--   1. Go to your Supabase project dashboard.
--   2. In the left sidebar, click "SQL Editor".
--   3. Click "+ New query".
--   4. Paste this entire file.
--   5. Click "Run" (or press Ctrl+Enter).
--
-- The SQL Editor runs as the service role, which bypasses Row
-- Level Security — so the policies created below only affect
-- traffic coming from your website (which uses the anon key).
-- ============================================================

-- ---- Tables ------------------------------------------------

create table if not exists drinks (
  id    text primary key,
  name  text not null,
  style text,
  notes text
);

create table if not exists stations (
  id          int  primary key,
  name        text not null,
  description text
);

create table if not exists orders (
  id          bigint primary key generated always as identity,
  station_id  int  not null references stations(id),
  drink_id    text not null references drinks(id),
  status      text not null default 'pending',
  created_at  timestamptz not null default now()
);

-- Speeds up the robot's "give me pending orders" query
create index if not exists orders_status_idx on orders (status, created_at);

-- ---- Row Level Security ------------------------------------
-- RLS is what keeps the public anon key safe in your website
-- code. We explicitly grant the minimum needed.
--
-- The website uses the anon key, which is allowed to INSERT
-- into orders. Nothing else. It cannot read, update, or delete
-- orders. It cannot touch drinks or stations.
--
-- The robot side (Node-RED on the ctrlX) will use the service
-- role key, which BYPASSES RLS entirely. That key never goes
-- in the website code.

alter table drinks   enable row level security;
alter table stations enable row level security;
alter table orders   enable row level security;

-- The one and only public capability: insert an order.
drop policy if exists "anon can insert orders" on orders;
create policy "anon can insert orders"
  on orders
  for insert
  to anon
  with check (true);

-- ---- Seed data ---------------------------------------------
-- These rows must match the entries in assets/config.js
-- (the frontend uses the same IDs as foreign keys).

insert into drinks (id, name, style, notes) values
  ('ipa',   'IPA',   'India Pale Ale', 'Hoppy, citrus, 6.5%'),
  ('lager', 'Lager', 'Pilsner',        'Crisp, clean, 4.8%')
on conflict (id) do nothing;

insert into stations (id, name, description) values
  (1, 'Station 1', 'Main bar')
on conflict (id) do nothing;

-- When you add stations to config.js, also add matching rows
-- here, e.g.:
-- insert into stations (id, name, description) values
--   (2, 'Station 2', 'Patio'),
--   (3, 'Station 3', 'Lounge'),
--   (4, 'Station 4', 'Back deck'),
--   (5, 'Station 5', 'VIP')
-- on conflict (id) do nothing;
