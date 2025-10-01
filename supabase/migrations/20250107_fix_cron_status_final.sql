-- Migration final para corrigir a função get_hitss_cron_status
-- Data: 2025-01-07
-- Descrição: Corrige a função com consulta SQL simplificada

-- Recriar função get_hitss_cron_status com consulta corrigida
CREATE OR REPLACE FUNCTION get_hitss_cron_status()
RETURNS JSON
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
    result JSON;
    job_record RECORD;
    jobs_array JSON[] := '{}';
BEGIN
    -- Buscar jobs relacionados ao HITSS
    FOR job_record IN 
        SELECT 
            jobname,
            schedule,
            command,
            active,
            jobid
        FROM cron.job 
        WHERE jobname LIKE '%hitss%'
        ORDER BY jobname
    LOOP
        jobs_array := jobs_array || json_build_object(
            'job_name', job_record.jobname,
            'schedule', job_record.schedule,
            'command', job_record.command,
            'active', job_record.active,
            'jobid', job_record.jobid
        );
    END LOOP;
    
    -- Converter array para JSON
    SELECT array_to_json(jobs_array) INTO result;
    
    -- Se não houver jobs, retornar array vazio
    IF result IS NULL THEN
        result := '[]'::json;
    END IF;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'error', true,
        'message', SQLERRM,
        'code', SQLSTATE,
        'detail', 'Erro ao consultar cron jobs'
    );
END;
$$ LANGUAGE plpgsql;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_hitss_cron_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_hitss_cron_status() TO service_role;
GRANT EXECUTE ON FUNCTION get_hitss_cron_status() TO anon;

-- Comentário
COMMENT ON FUNCTION get_hitss_cron_status() IS 'Retorna o status dos cron jobs relacionados à automação HITSS com consulta corrigida';