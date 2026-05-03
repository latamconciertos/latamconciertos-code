-- Push campaigns table — stores admin-composed push notification campaigns
-- (title, body, audience filter, concert link) and their send results.

create table if not exists public.push_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  url text,
  concert_id uuid references public.concerts(id) on delete set null,
  -- audience JSON: { type: 'all' } | { type: 'country', countryId } | { type: 'artist', artistId }
  audience jsonb not null default '{"type":"all"}'::jsonb,
  status text not null default 'draft' check (status in ('draft','sending','sent','failed')),
  recipient_count int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_push_campaigns_created_by on public.push_campaigns(created_by);
create index if not exists idx_push_campaigns_created_at on public.push_campaigns(created_at desc);

alter table public.push_campaigns enable row level security;

-- Admins manage campaigns. Everyone else cannot read/write.
create policy "admins_manage_push_campaigns_select"
  on public.push_campaigns for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "admins_manage_push_campaigns_insert"
  on public.push_campaigns for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "admins_manage_push_campaigns_update"
  on public.push_campaigns for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "admins_manage_push_campaigns_delete"
  on public.push_campaigns for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
