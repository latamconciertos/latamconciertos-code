-- Enable pg_cron and pg_net if not already enabled
-- (these need to be enabled from Supabase Dashboard > Database > Extensions)

-- Daily cron at 8:00 AM Colombia time (UTC-5 = 13:00 UTC)
SELECT cron.schedule(
  'notify-deadlines-daily',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/notify-deadlines',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
