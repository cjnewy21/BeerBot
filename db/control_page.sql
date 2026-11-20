-- ============================================================
-- Bartender Bot — drink controls (control.html)
--
-- Run this ONCE in the Supabase SQL Editor, AFTER schema.sql.
-- It is safe to run again (e.g. to change the PIN).
--
-- BEFORE RUNNING: replace CHANGE-ME-PIN below with your own PIN.
-- Use at least 6 characters; a short word + numbers is good.
-- The PIN is stored only as a hash, and never in the website code.
-- ============================================================

-- ---- Live drink settings ------------------------------------
-- The website reads these on every page load. config.js values
-- are only used as a fallback if the database can't be reached.

alter table drinks add column if not exists available          boolean not null default true;
alter table drinks add column if not exists time_limit_enabled boolean not null default false;
alter table drinks add column if not exists available_from     time;
alter table drinks add column if not exists available_to       time;

-- Make sure every drink in config.js has a row (orders need it too)
insert into drinks (id, name, style, notes) values
  ('1919-rootbeer', '1919',      'Root Beer',   'Smooth, Vanilla, Non-Alcoholic'),
  ('bud-light',     'Bud Light', 'Light Lager', 'Refreshing, clean, 4.2%')
on conflict (id) do nothing;

-- Availability and time limits are NOT set here. New columns start
-- as "available, no time limit"; set them on control.html. Re-running
-- this file (e.g. to change the PIN) never changes drink settings.

-- Anyone may READ drink settings (the menu is public anyway).
-- Nobody may change them directly; changes go through the
-- PIN-checked function below.
drop policy if exists "anon can read drinks" on drinks;
create policy "anon can read drinks"
  on drinks
  for select
  to anon, authenticated
  using (true);

-- ---- Control PIN --------------------------------------------

create extension if not exists pgcrypto with schema extensions;

create table if not exists control_settings (
  id       int  primary key default 1 check (id = 1),
  pin_hash text not null
);

-- RLS on with no policies = the website can never read this table
alter table control_settings enable row level security;
revoke all on control_settings from anon, authenticated;

insert into control_settings (id, pin_hash)
values (1, extensions.crypt('CHANGE-ME-PIN', extensions.gen_salt('bf')))
on conflict (id) do update set pin_hash = excluded.pin_hash;

-- ---- Functions the control page calls -----------------------

create or replace function check_control_pin(p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ok boolean;
begin
  select exists (
    select 1 from control_settings
     where id = 1 and pin_hash = extensions.crypt(p_pin, pin_hash)
  ) into ok;
  if not ok then
    perform pg_sleep(1);   -- slow down PIN guessing
  end if;
  return ok;
end;
$$;

create or replace function update_drink_settings(
  p_pin                text,
  p_drink_id           text,
  p_available          boolean,
  p_time_limit_enabled boolean,
  p_available_from     time,
  p_available_to       time
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not check_control_pin(p_pin) then
    raise exception 'Incorrect PIN';
  end if;

  update drinks
     set available          = p_available,
         time_limit_enabled = p_time_limit_enabled,
         available_from     = p_available_from,
         available_to       = p_available_to
   where id = p_drink_id;

  if not found then
    raise exception 'Drink "%" is not in the database', p_drink_id;
  end if;
end;
$$;

revoke execute on function check_control_pin(text) from public;
revoke execute on function update_drink_settings(text, text, boolean, boolean, time, time) from public;
grant  execute on function check_control_pin(text) to anon, authenticated;
grant  execute on function update_drink_settings(text, text, boolean, boolean, time, time) to anon, authenticated;
