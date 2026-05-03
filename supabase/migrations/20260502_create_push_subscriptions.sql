-- Push subscriptions table — stores per-device subscriptions for Web Push notifications.
-- Each row represents one device that has opted in to receive push from the app.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  device_label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  -- An endpoint is unique per browser/device. If the same browser re-subscribes,
  -- we update the existing row instead of creating a duplicate.
  unique (endpoint)
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- Users can manage only their own subscriptions
create policy "users_own_subscriptions_select"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

create policy "users_own_subscriptions_insert"
  on public.push_subscriptions
  for insert
  with check (auth.uid() = user_id);

create policy "users_own_subscriptions_update"
  on public.push_subscriptions
  for update
  using (auth.uid() = user_id);

create policy "users_own_subscriptions_delete"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);
