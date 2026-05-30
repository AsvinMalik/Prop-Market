create table if not exists public.market_rates (
  id uuid primary key default gen_random_uuid(),
  locality text not null unique,
  min_price integer not null,
  max_price integer not null,
  unit text not null default 'sqft',
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.market_rates enable row level security;

drop policy if exists "Market rates are readable by everyone" on public.market_rates;
create policy "Market rates are readable by everyone"
on public.market_rates
for select
using (true);

insert into public.market_rates (locality, min_price, max_price, unit, notes)
values
  ('Model Town', 16400, 16400, 'sqft', 'Imported baseline market dataset'),
  ('Sector 21', 20000, 20000, 'sqft', 'Imported baseline market dataset'),
  ('Sector 25', 8750, 11050, 'sqft', 'Imported baseline market dataset'),
  ('Sector 27', 4900, 8000, 'sqft', 'Imported baseline market dataset'),
  ('Sector 35', 4900, 8000, 'sqft', 'Imported baseline market dataset'),
  ('Omaxe City', 8333, 8333, 'sqft', 'Imported baseline market dataset'),
  ('Maina', 3500, 5600, 'sqft', 'Imported baseline market dataset')
on conflict (locality) do update
set
  min_price = excluded.min_price,
  max_price = excluded.max_price,
  unit = excluded.unit,
  notes = excluded.notes;
