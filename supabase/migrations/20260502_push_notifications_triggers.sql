-- Push notification triggers — fire Web Push to interested users when key
-- accreditation events happen.
--
-- Uses pg_net to call the push-send Edge Function asynchronously.
-- Re-uses the app.settings.* values already configured for the deadline cron.

-- Helper: enqueue a push for a single user via pg_net (fire-and-forget HTTP).
create or replace function public.send_user_push(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_url text default null,
  p_tag text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_key text;
begin
  -- Skip if user has no active subscriptions (cheap pre-check)
  if not exists (
    select 1 from public.push_subscriptions
    where user_id = p_user_id and is_active = true
  ) then
    return;
  end if;

  v_url := current_setting('app.settings.supabase_url', true);
  v_key := current_setting('app.settings.service_role_key', true);
  if v_url is null or v_key is null then
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/push-send',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'userId', p_user_id,
      'payload', jsonb_build_object(
        'title', p_title,
        'body',  p_body,
        'url',   coalesce(p_url, '/admin/operations'),
        'tag',   p_tag
      )
    )
  );
end;
$$;

-- Status-change message in Spanish
create or replace function public.accreditation_status_message(p_status text)
returns text
language sql
immutable
as $$
  select case p_status
    when 'pending' then 'Acreditación pasó a Pendiente'
    when 'submitted' then '📤 Acreditación enviada'
    when 'approved' then '✅ Acreditación aprobada'
    when 'rejected' then '❌ Acreditación rechazada'
    when 'expired' then '⏱ Acreditación vencida'
    when 'draft' then 'Acreditación movida a Borrador'
    else 'Acreditación actualizada'
  end;
$$;

-- Trigger function: on accreditations UPDATE, notify creator + team if status changed
create or replace function public.notify_accreditation_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_title text;
  v_body text;
begin
  -- Only fire when status actually changed
  if new.status is distinct from old.status then
    v_title := public.accreditation_status_message(new.status);
    v_body := new.event_name;

    -- Notify creator
    if new.created_by is not null then
      perform public.send_user_push(
        new.created_by,
        v_title,
        v_body,
        '/admin/operations',
        'accreditation-' || new.id::text
      );
    end if;

    -- Notify all assigned team members (excluding the creator if already notified)
    for v_user_id in
      select distinct user_id from public.event_team_assignments
      where accreditation_id = new.id
        and (new.created_by is null or user_id <> new.created_by)
    loop
      perform public.send_user_push(
        v_user_id,
        v_title,
        v_body,
        '/admin/operations',
        'accreditation-' || new.id::text
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_accreditation_status_change on public.accreditations;
create trigger trg_notify_accreditation_status_change
  after update on public.accreditations
  for each row
  execute function public.notify_accreditation_status_change();

-- Trigger function: on team assignment INSERT, notify the newly assigned user
create or replace function public.notify_team_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_name text;
begin
  select event_name into v_event_name
  from public.accreditations
  where id = new.accreditation_id;

  if v_event_name is null then
    return new;
  end if;

  perform public.send_user_push(
    new.user_id,
    '🎟️ Te asignaron a una acreditación',
    v_event_name,
    '/admin/operations',
    'team-assignment-' || new.id::text
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_team_assignment on public.event_team_assignments;
create trigger trg_notify_team_assignment
  after insert on public.event_team_assignments
  for each row
  execute function public.notify_team_assignment();
