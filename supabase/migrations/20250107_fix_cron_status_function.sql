-- Migration para corrigir a função get_hitss_cron_status
-- Data: 2025-01-07
-- Descrição: Corrige a função para usar apenas colunas existentes na tabela cron.job

-- Recriar função get_hitss_cron_status com colunas corretas
CREATE OR REPLACE FUNCTION get_hitss_cron_status()
RETURNS JSON
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'job_name', j.jobname,
            'schedule', j.schedule,
            'command', j.command,
            'active', j.active,
            'jobid', j.jobid
        )
    ) INTO result
    FROM cron.job j
    WHERE j.jobname LIKE '%hitss%'
    ORDER BY j.jobname;
    
    -- Se não houver jobs, retornar array vazio
    IF result IS NULL THEN
        result := '[]'::json;
    END IF;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'error', true,
        'message', SQLERRM,
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_hitss_cron_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_hitss_cron_status() TO service_role;
GRANT EXECUTE ON FUNCTION get_hitss_cron_status() TO anon;

-- Comentário
COMMENT ON FUNCTION get_hitss_cron_status() IS 'Retorna o status dos cron jobs relacionados à automação HITSS usando apenas colunas existentes';