-- Schedule daily prophecy generation at 6:00 AM UTC
SELECT cron.schedule(
  'daily-prophecy-generation',
  '0 6 * * *',  -- Every day at 6:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/generate-daily-prophecy',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('scheduled', true)
    ) as request_id;
  $$
);

-- Schedule daily verse at 6:30 AM UTC
SELECT cron.schedule(
  'daily-verse-generation',
  '30 6 * * *',  -- Every day at 6:30 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/get-daily-verse',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('scheduled', true)
    ) as request_id;
  $$
);

-- Schedule daily topic at 7:00 AM UTC
SELECT cron.schedule(
  'daily-topic-generation',
  '0 7 * * *',  -- Every day at 7:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/get-daily-topic',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('scheduled', true)
    ) as request_id;
  $$
);
