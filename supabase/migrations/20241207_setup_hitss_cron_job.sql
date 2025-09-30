-- Migração para configurar cron job da automação HITSS
-- Data: 2024-12-06
-- Descrição: Configura pg_cron para executar a automação HITSS diariamente

-- Verificar se pg_cron está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Função para chamar a Edge Function via HTTP
CREATE OR REPLACE FUNCTION call_hitss_automation()
RETURNS TEXT AS $$
DECLARE
    response TEXT;
    project_url TEXT;
    service_role_key TEXT;
BEGIN
    -- Obter valores diretamente do Vault
    SELECT vault.decrypted_secrets ->> 'NEXT_PUBLIC_SUPABASE_URL' INTO project_url
    FROM vault.decrypted_secrets
    WHERE vault.decrypted_secrets ? 'NEXT_PUBLIC_SUPABASE_URL';
    
    SELECT vault.decrypted_secrets ->> 'SUPABASE_SERVICE_ROLE_KEY' INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE vault.decrypted_secrets ? 'SUPABASE_SERVICE_ROLE_KEY';
    
    -- Verificar se os valores foram obtidos
    IF project_url IS NULL THEN
        project_url := 'https://oomhhhfahdvavnhlbioa.supabase.co';
    END IF;
    
    IF service_role_key IS NULL THEN
        RAISE EXCEPTION 'service_role_key não encontrado no Vault. Verifique se o segredo SUPABASE_SERVICE_ROLE_KEY está configurado.';
    END IF;
    
    -- Fazer chamada HTTP para a Edge Function
    SELECT content INTO response
    FROM http((
        'POST',
        project_url || '/functions/v1/hitss-automation',
        ARRAY[http_header('Authorization', 'Bearer ' || service_role_key)],
        'application/json',
        '{}'
    ));
    
    -- Log da execução
    INSERT INTO hitss_automation_logs (execution_id, level, message, context)
    VALUES (
        gen_random_uuid(),
        'info',
        'Cron job executado com sucesso',
        jsonb_build_object(
            'response', response,
            'timestamp', NOW(),
            'trigger', 'pg_cron'
        )
    );
    
    RETURN 'Automação HITSS executada via cron: ' || COALESCE(response, 'sem resposta');
    
EXCEPTION WHEN OTHERS THEN
    -- Log de erro
    INSERT INTO hitss_automation_logs (execution_id, level, message, context)
    VALUES (
        gen_random_uuid(),
        'error',
        'Erro na execução do cron job: ' || SQLERRM,
        jsonb_build_object(
            'error_code', SQLSTATE,
            'error_message', SQLERRM,
            'timestamp', NOW(),
            'trigger', 'pg_cron'
        )
    );
    
    RETURN 'Erro na automação HITSS: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para configurar o cron job
CREATE OR REPLACE FUNCTION setup_hitss_cron_job()
RETURNS TEXT AS $$
DECLARE
    job_name TEXT := 'hitss-automation-daily';
    cron_schedule TEXT := '0 8 * * *'; -- Diariamente às 08:00
    job_command TEXT;
    job_exists BOOLEAN;
BEGIN
    -- Verificar se job já existe
    SELECT EXISTS(
        SELECT 1 FROM cron.job WHERE jobname = job_name
    ) INTO job_exists;
    
    -- Remover job existente se houver
    IF job_exists THEN
        PERFORM cron.unschedule(job_name);
    END IF;
    
    -- Comando para executar
    job_command := 'SELECT call_hitss_automation();';
    
    -- Agendar novo job
    PERFORM cron.schedule(job_name, cron_schedule, job_command);
    
    -- Log da configuração
    INSERT INTO hitss_automation_logs (execution_id, level, message, context)
    VALUES (
        gen_random_uuid(),
        'info',
        'Cron job configurado com sucesso',
        jsonb_build_object(
            'job_name', job_name,
            'schedule', cron_schedule,
            'command', job_command,
            'configured_at', NOW()
        )
    );
    
    RETURN 'Cron job "' || job_name || '" configurado para executar ' || cron_schedule;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar status dos cron jobs
CREATE OR REPLACE FUNCTION get_hitss_cron_status()
RETURNS TABLE (
    job_name TEXT,
    schedule TEXT,
    command TEXT,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.jobname::TEXT,
        j.schedule::TEXT,
        j.command::TEXT,
        j.active
    FROM cron.job j
    WHERE j.jobname LIKE '%hitss%'
    ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql;

-- Função para desabilitar o cron job
CREATE OR REPLACE FUNCTION disable_hitss_cron_job()
RETURNS TEXT AS $$
DECLARE
    job_name TEXT := 'hitss-automation-daily';
BEGIN
    -- Remover job
    PERFORM cron.unschedule(job_name);
    
    -- Log da desabilitação
    INSERT INTO hitss_automation_logs (execution_id, level, message, context)
    VALUES (
        gen_random_uuid(),
        'info',
        'Cron job desabilitado',
        jsonb_build_object(
            'job_name', job_name,
            'disabled_at', NOW()
        )
    );
    
    RETURN 'Cron job "' || job_name || '" foi desabilitado';
END;
$$ LANGUAGE plpgsql;

-- Executar configuração do cron job
SELECT setup_hitss_cron_job();

-- Verificar se foi configurado corretamente
SELECT * FROM get_hitss_cron_status();

-- Comentários para documentação
COMMENT ON FUNCTION call_hitss_automation() IS 'Função para chamar a Edge Function de automação HITSS via HTTP';
COMMENT ON FUNCTION setup_hitss_cron_job() IS 'Configura o cron job para executar a automação HITSS diariamente';
COMMENT ON FUNCTION get_hitss_cron_status() IS 'Retorna o status dos cron jobs relacionados à automação HITSS';
COMMENT ON FUNCTION disable_hitss_cron_job() IS 'Desabilita o cron job da automação HITSS';

-- Instruções para configuração manual (se necessário)
/*
PARA CONFIGURAR MANUALMENTE:

1. Configurar variáveis do projeto:
ALTER DATABASE postgres SET app.project_url = 'https://seu-projeto.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = 'sua_service_role_key';

2. Executar setup:
SELECT setup_hitss_cron_job();

3. Verificar status:
SELECT * FROM get_hitss_cron_status();

4. Testar execução manual:
SELECT call_hitss_automation();

5. Para desabilitar:
SELECT disable_hitss_cron_job();
*/