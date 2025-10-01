-- Migration para corrigir a função call_hitss_automation usando chave direta
-- Data: 2025-01-07
-- Descrição: Modifica a função para usar a service_role_key diretamente

-- Recriar função call_hitss_automation com chave direta
CREATE OR REPLACE FUNCTION call_hitss_automation()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    response TEXT;
    project_url TEXT := 'https://oomhhhfahdvavnhlbioa.supabase.co';
    service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';
    http_response http_response;
BEGIN
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

-- Conceder permissões
GRANT EXECUTE ON FUNCTION call_hitss_automation() TO authenticated;
GRANT EXECUTE ON FUNCTION call_hitss_automation() TO service_role;

-- Comentário
COMMENT ON FUNCTION call_hitss_automation() IS 'Função para chamar a Edge Function de automação HITSS via HTTP com chave service_role direta';