-- Migration para corrigir permissões do pg_cron
-- Data: 2025-01-07
-- Descrição: Concede permissões necessárias para o schema cron e funções relacionadas

-- Garantir que pg_cron está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Conceder permissões para o schema cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT USAGE ON SCHEMA cron TO service_role;
GRANT USAGE ON SCHEMA cron TO authenticated;

-- Conceder permissões para as tabelas do cron
GRANT SELECT ON cron.job TO postgres;
GRANT SELECT ON cron.job TO service_role;
GRANT SELECT ON cron.job TO authenticated;

GRANT SELECT ON cron.job_run_details TO postgres;
GRANT SELECT ON cron.job_run_details TO service_role;
GRANT SELECT ON cron.job_run_details TO authenticated;

-- Conceder permissões para executar funções do cron
GRANT EXECUTE ON FUNCTION cron.schedule(text, text, text) TO postgres;
GRANT EXECUTE ON FUNCTION cron.schedule(text, text, text) TO service_role;

GRANT EXECUTE ON FUNCTION cron.unschedule(text) TO postgres;
GRANT EXECUTE ON FUNCTION cron.unschedule(text) TO service_role;

-- Atualizar a função get_hitss_cron_status com SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_hitss_cron_status()
RETURNS TABLE (
    job_name TEXT,
    schedule TEXT,
    command TEXT,
    active BOOLEAN,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.jobname::TEXT,
        j.schedule::TEXT,
        j.command::TEXT,
        j.active,
        j.last_run,
        j.next_run
    FROM cron.job j
    WHERE j.jobname LIKE '%hitss%'
    ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql;

-- Atualizar a função call_hitss_automation com melhor tratamento de erros
CREATE OR REPLACE FUNCTION call_hitss_automation()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    response TEXT;
    project_url TEXT := 'https://oomhhhfahdvavnhlbioa.supabase.co';
    service_role_key TEXT;
    http_response http_response;
BEGIN
    -- Tentar obter service_role_key do Vault
    BEGIN
        SELECT vault.decrypted_secrets ->> 'SUPABASE_SERVICE_ROLE_KEY' INTO service_role_key
        FROM vault.decrypted_secrets
        WHERE vault.decrypted_secrets ? 'SUPABASE_SERVICE_ROLE_KEY'
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        -- Se o Vault não estiver disponível, usar valor padrão (deve ser configurado)
        service_role_key := NULL;
    END;
    
    -- Verificar se temos a chave necessária
    IF service_role_key IS NULL OR service_role_key = '' THEN
        RAISE EXCEPTION 'SUPABASE_SERVICE_ROLE_KEY não encontrado. Configure no Vault ou nas variáveis do projeto.';
    END IF;
    
    -- Fazer chamada HTTP para a Edge Function
    SELECT * INTO http_response
    FROM http((
        'POST',
        project_url || '/functions/v1/hitss-automation',
        ARRAY[
            http_header('Authorization', 'Bearer ' || service_role_key),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        '{}'
    ));
    
    -- Extrair conteúdo da resposta
    response := http_response.content;
    
    -- Log da execução bem-sucedida
    INSERT INTO hitss_automation_logs (execution_id, level, message, context)
    VALUES (
        gen_random_uuid(),
        'info',
        'Cron job executado com sucesso',
        jsonb_build_object(
            'response', response,
            'status_code', http_response.status,
            'timestamp', NOW(),
            'trigger', 'pg_cron'
        )
    );
    
    RETURN 'Automação HITSS executada via cron. Status: ' || http_response.status || '. Resposta: ' || COALESCE(response, 'sem resposta');
    
EXCEPTION WHEN OTHERS THEN
    -- Log de erro detalhado
    INSERT INTO hitss_automation_logs (execution_id, level, message, context)
    VALUES (
        gen_random_uuid(),
        'error',
        'Erro na execução do cron job: ' || SQLERRM,
        jsonb_build_object(
            'error_code', SQLSTATE,
            'error_message', SQLERRM,
            'error_detail', SQLSTATE,
            'timestamp', NOW(),
            'trigger', 'pg_cron'
        )
    );
    
    RETURN 'Erro na automação HITSS: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Atualizar função setup_hitss_cron_job com SECURITY DEFINER
CREATE OR REPLACE FUNCTION setup_hitss_cron_job()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public, cron
AS $$
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

-- Conceder permissões de execução para as funções
GRANT EXECUTE ON FUNCTION get_hitss_cron_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_hitss_cron_status() TO service_role;
GRANT EXECUTE ON FUNCTION get_hitss_cron_status() TO anon;

GRANT EXECUTE ON FUNCTION call_hitss_automation() TO authenticated;
GRANT EXECUTE ON FUNCTION call_hitss_automation() TO service_role;

GRANT EXECUTE ON FUNCTION setup_hitss_cron_job() TO authenticated;
GRANT EXECUTE ON FUNCTION setup_hitss_cron_job() TO service_role;

-- Reconfigurar o cron job com as novas permissões
SELECT setup_hitss_cron_job();

-- Verificar se foi configurado corretamente
SELECT * FROM get_hitss_cron_status();

-- Comentários
COMMENT ON FUNCTION get_hitss_cron_status() IS 'Retorna o status dos cron jobs relacionados à automação HITSS com permissões adequadas';
COMMENT ON FUNCTION call_hitss_automation() IS 'Função para chamar a Edge Function de automação HITSS via HTTP com tratamento de erros melhorado';
COMMENT ON FUNCTION setup_hitss_cron_job() IS 'Configura o cron job para executar a automação HITSS diariamente com permissões adequadas';