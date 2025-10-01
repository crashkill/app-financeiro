-- Migração para configurar cron job da automação DRE
-- Data: 2024-12-07
-- Descrição: Configura pg_cron para executar a automação DRE diariamente às 8h

-- Nota: pg_cron já está habilitado no Supabase, não precisa criar a extensão

-- Função para obter segredos do Vault
CREATE OR REPLACE FUNCTION get_vault_secret(secret_name TEXT)
RETURNS TEXT AS $$
DECLARE
    secret_value TEXT;
BEGIN
    -- Tentar buscar o segredo do vault
    BEGIN
        SELECT decrypted_secret INTO secret_value
        FROM vault.decrypted_secrets
        WHERE name = secret_name
        LIMIT 1;
    EXCEPTION
        WHEN OTHERS THEN
            -- Se houver erro, retornar NULL
            secret_value := NULL;
    END;
    
    RETURN secret_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para chamar a Edge Function execute-dre-automation via HTTP
CREATE OR REPLACE FUNCTION call_dre_automation()
RETURNS TEXT AS $$
DECLARE
    response TEXT;
    project_url TEXT;
    service_role_key TEXT;
    http_response http_response;
BEGIN
    -- Usar valores hardcoded para teste (substituir pelos valores reais)
    project_url := 'https://oomhhhfahdvavnhlbioa.supabase.co';
    service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';
    
    -- Log de configuração
    INSERT INTO dre_execution_logs (execution_id, step, status, message)
    VALUES (
        'config_' || extract(epoch from now())::text,
        'CONFIG',
        'INFO',
        'Usando configuração hardcoded para teste - URL: ' || project_url
    );
    
    -- Fazer chamada HTTP para a Edge Function execute-dre-automation
    SELECT * INTO http_response
    FROM http((
        'POST',
        project_url || '/functions/v1/execute-dre-automation',
        ARRAY[http_header('Authorization', 'Bearer ' || service_role_key)],
        'application/json',
        '{}'
    ));
    
    response := http_response.content;
    
    -- Log da execução
    INSERT INTO dre_execution_logs (execution_id, step, status, message)
    VALUES (
        'cron_' || extract(epoch from now())::text,
        'CRON_EXECUTION',
        CASE 
            WHEN http_response.status = 200 THEN 'SUCESSO'
            ELSE 'ERRO'
        END,
        'Cron job executado - Status HTTP: ' || http_response.status || ' - Response: ' || COALESCE(response, 'sem resposta')
    );
    
    RETURN 'Automação DRE executada via cron - Status: ' || http_response.status || ' - ' || COALESCE(response, 'sem resposta');
    
EXCEPTION WHEN OTHERS THEN
    -- Log de erro
    INSERT INTO dre_execution_logs (execution_id, step, status, message)
    VALUES (
        'cron_error_' || extract(epoch from now())::text,
        'CRON_EXECUTION',
        'ERRO',
        'Erro na execução do cron job DRE: ' || SQLERRM
    );
    
    RETURN 'Erro na automação DRE: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para configurar o cron job DRE
CREATE OR REPLACE FUNCTION setup_dre_cron_job()
RETURNS TEXT AS $$
DECLARE
    job_name TEXT := 'dre-automation-daily';
    cron_schedule TEXT := '0 8 * * 1-5'; -- Segunda a sexta às 08:00
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
    job_command := 'SELECT call_dre_automation();';
    
    -- Agendar novo job
    PERFORM cron.schedule(job_name, cron_schedule, job_command);
    
    -- Log da configuração
    INSERT INTO dre_execution_logs (execution_id, step, status, message)
    VALUES (
        'setup_' || extract(epoch from now())::text,
        'CRON_SETUP',
        'SUCESSO',
        'Cron job DRE configurado - Nome: ' || job_name || ' - Schedule: ' || cron_schedule
    );
    
    RETURN 'Cron job "' || job_name || '" configurado para executar ' || cron_schedule;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar status dos cron jobs DRE
CREATE OR REPLACE FUNCTION get_dre_cron_status()
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
    WHERE j.jobname LIKE '%dre%'
    ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql;

-- Função para desabilitar o cron job DRE
CREATE OR REPLACE FUNCTION disable_dre_cron_job()
RETURNS TEXT AS $$
DECLARE
    job_name TEXT := 'dre-automation-daily';
BEGIN
    -- Remover job
    PERFORM cron.unschedule(job_name);
    
    -- Log da desabilitação
    INSERT INTO dre_execution_logs (execution_id, step, status, message)
    VALUES (
        'disable_' || extract(epoch from now())::text,
        'CRON_DISABLE',
        'SUCESSO',
        'Cron job DRE desabilitado - Nome: ' || job_name
    );
    
    RETURN 'Cron job "' || job_name || '" foi desabilitado';
END;
$$ LANGUAGE plpgsql;

-- Função para executar teste manual da automação DRE
CREATE OR REPLACE FUNCTION test_dre_automation()
RETURNS TEXT AS $$
BEGIN
    -- Log do teste
    INSERT INTO dre_execution_logs (execution_id, step, status, message)
    VALUES (
        'test_' || extract(epoch from now())::text,
        'MANUAL_TEST',
        'INICIADO',
        'Teste manual da automação DRE iniciado'
    );
    
    -- Executar a função de automação
    RETURN call_dre_automation();
END;
$$ LANGUAGE plpgsql;

-- Executar configuração do cron job DRE
SELECT setup_dre_cron_job();

-- Verificar se foi configurado corretamente
SELECT * FROM get_dre_cron_status();

-- Comentários para documentação
COMMENT ON FUNCTION call_dre_automation() IS 'Função para chamar a Edge Function execute-dre-automation via HTTP';
COMMENT ON FUNCTION setup_dre_cron_job() IS 'Configura o cron job para executar a automação DRE diariamente às 8h';
COMMENT ON FUNCTION get_dre_cron_status() IS 'Retorna o status dos cron jobs relacionados à automação DRE';
COMMENT ON FUNCTION disable_dre_cron_job() IS 'Desabilita o cron job da automação DRE';
COMMENT ON FUNCTION test_dre_automation() IS 'Executa teste manual da automação DRE';

-- Instruções para uso
/*
PARA USAR O CRON JOB DRE:

1. Verificar status atual:
SELECT * FROM get_dre_cron_status();

2. Executar teste manual:
SELECT test_dre_automation();

3. Reconfigurar se necessário:
SELECT setup_dre_cron_job();

4. Desabilitar se necessário:
SELECT disable_dre_cron_job();

5. Verificar logs de execução:
SELECT * FROM dre_execution_logs 
WHERE step IN ('CRON_EXECUTION', 'CRON_SETUP', 'MANUAL_TEST') 
ORDER BY created_at DESC 
LIMIT 10;

O cron job está configurado para executar:
- Segunda a sexta-feira às 8:00 AM
- Chama a Edge Function execute-dre-automation
- Registra logs na tabela dre_execution_logs
*/