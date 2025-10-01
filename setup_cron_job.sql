-- Script para configurar cron job da automação DRE
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se pg_cron está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Função para chamar a Edge Function
CREATE OR REPLACE FUNCTION call_dre_automation()
RETURNS TEXT AS $$
DECLARE
    response TEXT;
    project_url TEXT := 'https://oomhhhfahdvavnhlbioa.supabase.co';
    service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';
BEGIN
    -- Fazer chamada HTTP para a Edge Function
    SELECT content INTO response
    FROM http((
        'POST',
        project_url || '/functions/v1/execute-dre-automation',
        ARRAY[http_header('Authorization', 'Bearer ' || service_role_key)],
        'application/json',
        '{}'
    ));
    
    RETURN 'Automação DRE executada: ' || COALESCE(response, 'sem resposta');
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Erro na automação DRE: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Configurar o cron job para executar diariamente às 8h (horário UTC)
-- Remove job existente se houver
SELECT cron.unschedule('dre-automation-daily') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'dre-automation-daily'
);

-- Criar novo job
SELECT cron.schedule(
    'dre-automation-daily',
    '0 8 * * 1-5',  -- Segunda a sexta às 8h UTC (5h BRT)
    'SELECT call_dre_automation();'
);

-- 4. Verificar status do cron job
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    active,
    created_at
FROM cron.job 
WHERE jobname = 'dre-automation-daily';

-- 5. Testar execução manual
SELECT call_dre_automation();

-- 6. Verificar logs de execução (últimas 10 execuções)
SELECT 
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details 
WHERE command LIKE '%call_dre_automation%'
ORDER BY start_time DESC 
LIMIT 10;