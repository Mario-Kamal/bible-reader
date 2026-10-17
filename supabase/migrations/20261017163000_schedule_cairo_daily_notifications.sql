DO $$
DECLARE
  existing_job RECORD;
BEGIN
  FOR existing_job IN
    SELECT jobid
    FROM cron.job
    WHERE jobname IN (
      'daily-prophecy-generation',
      'daily-verse-generation',
      'daily-topic-generation'
    )
  LOOP
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'daily-chapter-generation-cairo-summer',
  '5 21 * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/generate-daily-prophecy',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

SELECT cron.schedule(
  'daily-chapter-generation-cairo-winter',
  '5 22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/generate-daily-prophecy',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

SELECT cron.schedule(
  'daily-chapter-notification-cairo-summer',
  '0 22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/send-daily-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('kind', 'chapter')
  );
  $$
);

SELECT cron.schedule(
  'daily-chapter-notification-cairo-winter',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/send-daily-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('kind', 'chapter')
  );
  $$
);

SELECT cron.schedule(
  'daily-verse-generation-cairo-summer',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/get-daily-verse',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

SELECT cron.schedule(
  'daily-verse-generation-cairo-winter',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/get-daily-verse',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);

SELECT cron.schedule(
  'daily-verse-notification-cairo-summer',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/send-daily-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('kind', 'verse')
  );
  $$
);

SELECT cron.schedule(
  'daily-verse-notification-cairo-winter',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/send-daily-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('kind', 'verse')
  );
  $$
);
