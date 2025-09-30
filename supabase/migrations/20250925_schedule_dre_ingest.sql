-- 2025-09-25: Agendamento do dre-ingest via pg_cron + http_post
-- Requisitos: extensão "pg_cron" e "pg_net" habilitadas, e parâmetro app.settings.service_role_key

-- Garantir extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função para chamar Edge Function dre-ingest
CREATE OR REPLACE FUNCTION public.call_dre_ingest()
RETURNS TEXT AS $$
DECLARE
  project_url TEXT := current_setting('app.settings.project_url', true);
  service_role_key TEXT := current_setting('app.settings.service_role_key', true);
BEGIN
  IF project_url IS NULL OR service_role_key IS NULL THEN
    RAISE EXCEPTION 'Parâmetros app.settings.project_url/service_role_key não configurados';
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/dre-ingest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );

  RETURN 'dre-ingest chamado.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agendar job diário às 08:00 em dias úteis
SELECT cron.schedule(
  'dre-ingest-daily',
  '0 8 * * 1-5',
  $$SELECT public.call_dre_ingest();$$
);

COMMENT ON FUNCTION public.call_dre_ingest IS 'Chama a Edge Function dre-ingest via HTTP (pg_net)';
