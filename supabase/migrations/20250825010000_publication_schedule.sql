-- Create table: publication_schedule
-- This migration defines the schema expected by AutomaticPublicationService in the app code.
-- Columns inferred from src/lib/services/automaticPublicationService.ts

-- Enable required extension for gen_random_uuid if not present
create extension if not exists pgcrypto;

-- ENUM-like constraints using CHECK for portability
create table if not exists public.publication_schedule (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null check (content_type in ('article','news')),
  scheduled_for timestamptz not null,
  timezone text not null,
  status text not null default 'scheduled' check (status in ('scheduled','published','cancelled','failed')),
  auto_publish boolean not null default true,
  publish_channels text[] not null default '{"web"}'::text[],
  recurring_pattern text null,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Useful indexes
create index if not exists idx_publication_schedule_status on public.publication_schedule (status);
create index if not exists idx_publication_schedule_scheduled_for on public.publication_schedule (scheduled_for);
create index if not exists idx_publication_schedule_content on public.publication_schedule (content_type, content_id);

-- RLS: enable and allow service role full access, authenticated read/limited write if needed
alter table public.publication_schedule enable row level security;

-- Policies (adjust to your security model). For now, conservative read for authenticated users.
-- Service role (backend) should bypass RLS via Supabase service key.

drop policy if exists "Allow authenticated read publication_schedule" on public.publication_schedule;
create policy "Allow authenticated read publication_schedule"
  on public.publication_schedule
  for select
  to authenticated
  using (true);

-- Optional: allow authenticated insert/update if your app writes from client
-- drop policy if exists "Allow authenticated insert publication_schedule" on public.publication_schedule;
-- create policy "Allow authenticated insert publication_schedule"
--   on public.publication_schedule
--   for insert
--   to authenticated
--   with check (true);

-- drop policy if exists "Allow authenticated update publication_schedule" on public.publication_schedule;
-- create policy "Allow authenticated update publication_schedule"
--   on public.publication_schedule
--   for update
--   to authenticated
--   using (true)
--   with check (true);

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_publication_schedule_updated_at on public.publication_schedule;
create trigger trg_publication_schedule_updated_at
before update on public.publication_schedule
for each row execute procedure public.set_updated_at();
