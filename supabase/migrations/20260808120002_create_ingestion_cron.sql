-- Ingestion cron: Mondays and Thursdays 8:00 AM Colombia (13:00 UTC).
-- Secrets (anon JWT + trigger secret) live in Supabase Vault, not in this file.
-- The managed Postgres denies ALTER DATABASE ... SET, so GUCs can't be used here; Vault is the path.

create or replace function public.trigger_ingestion_runner()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url    text := 'https://ybvfsxsapsshhtqpvukr.supabase.co';
  v_anon   text;
  v_secret text;
begin
  select decrypted_secret into v_anon
    from vault.decrypted_secrets where name = 'project_anon_key' limit 1;
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'ingest_trigger_secret' limit 1;
  if v_anon is null or v_secret is null then
    return;
  end if;

  -- apikey = JWT anon (para que el gateway enrute); authToken en el body = INGEST_TRIGGER_SECRET.
  -- El gateway nuevo rechaza las claves sb_ en headers y elimina headers custom, por eso va en el body.
  perform net.http_post(
    url := v_url || '/functions/v1/ingest-runner',
    headers := jsonb_build_object(
      'apikey', v_anon,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'cron', 'authToken', v_secret)
  );
end;
$$;

SELECT cron.schedule(
  'ingest-sources-biweekly',
  '0 13 * * 1,4',
  $$ SELECT public.trigger_ingestion_runner(); $$
);
