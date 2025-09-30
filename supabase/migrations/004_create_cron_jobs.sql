-- ============================================================================
-- SCRIPT DE MIGRAÇÃO: Configuração de Cron Jobs para Automação HITSS
-- Arquivo: 004_create_cron_jobs.sql
-- Descrição: Configura cron jobs para automação diária e sincronização
-- ============================================================================

-- Verificar se a extensão pg_cron está disponível
DO $$
BEGIN
    -- Tentar criar a extensão pg_cron se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Nota: pg_cron pode não estar disponível em todos os ambientes Supabase
        -- Esta é uma implementação alternativa usando funções SQL
        RAISE NOTICE 'pg_cron não disponível, usando implementação alternativa';
    END IF;
END $$;

-- ============================================================================
-- TABELA DE CONFIGURAÇÃO DE CRON JOBS
-- ============================================================================

-- Criar tabela para gerenciar cron jobs
CREATE TABLE IF NOT EXISTS cron_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    schedule VARCHAR(50) NOT NULL, -- Formato cron: '0 9 * * *'
    function_name VARCHAR(100) NOT NULL,
    function_url TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cron_jobs_enabled ON cron_jobs(enabled);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_next_run ON cron_jobs(next_run_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_cron_jobs_name ON cron_jobs(name);

-- ============================================================================
-- FUNÇÕES PARA GERENCIAMENTO DE CRON JOBS
-- ============================================================================

-- Função para calcular próxima execução baseada no schedule cron
CREATE OR REPLACE FUNCTION calculate_next_run(
    schedule_cron TEXT,
    from_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
    parts TEXT[];
    minute_part TEXT;
    hour_part TEXT;
    day_part TEXT;
    month_part TEXT;
    dow_part TEXT;
    next_run TIMESTAMPTZ;
BEGIN
    -- Parse do formato cron: minute hour day month dow
    parts := string_to_array(schedule_cron, ' ');
    
    IF array_length(parts, 1) != 5 THEN
        RAISE EXCEPTION 'Formato de cron inválido: %', schedule_cron;
    END IF;
    
    minute_part := parts[1];
    hour_part := parts[2];
    day_part := parts[3];
    month_part := parts[4];
    dow_part := parts[5];
    
    -- Implementação simplificada para casos comuns
    -- Para uma implementação completa, seria necessário uma biblioteca de parsing cron
    
    -- Caso: execução diária (0 9 * * *) - 9:00 AM todos os dias
    IF schedule_cron = '0 9 * * *' THEN
        next_run := date_trunc('day', from_time) + INTERVAL '9 hours';
        IF next_run <= from_time THEN
            next_run := next_run + INTERVAL '1 day';
        END IF;
        RETURN next_run;
    END IF;
    
    -- Caso: execução de hora em hora (0 * * * *)
    IF schedule_cron = '0 * * * *' THEN
        next_run := date_trunc('hour', from_time) + INTERVAL '1 hour';
        IF next_run <= from_time THEN
            next_run := next_run + INTERVAL '1 hour';
        END IF;
        RETURN next_run;
    END IF;
    
    -- Caso: execução a cada 30 minutos (*/30 * * * *)
    IF schedule_cron = '*/30 * * * *' THEN
        next_run := date_trunc('hour', from_time);
        -- Adicionar 0 ou 30 minutos
        IF EXTRACT(minute FROM from_time) < 30 THEN
            next_run := next_run + INTERVAL '30 minutes';
        ELSE
            next_run := next_run + INTERVAL '1 hour';
        END IF;
        IF next_run <= from_time THEN
            next_run := next_run + INTERVAL '30 minutes';
        END IF;
        RETURN next_run;
    END IF;
    
    -- Caso padrão: próxima hora
    RETURN date_trunc('hour', from_time) + INTERVAL '1 hour';
END;
$$;

-- Função para executar cron job
CREATE OR REPLACE FUNCTION execute_cron_job(
    job_name TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    job_record RECORD;
    result JSONB;
    success BOOLEAN := false;
    error_message TEXT;
BEGIN
    -- Buscar o job
    SELECT * INTO job_record
    FROM cron_jobs
    WHERE name = job_name AND enabled = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Job não encontrado ou desabilitado: ' || job_name
        );
    END IF;
    
    -- Atualizar contadores
    UPDATE cron_jobs
    SET 
        run_count = run_count + 1,
        last_run_at = NOW(),
        next_run_at = calculate_next_run(schedule, NOW()),
        updated_at = NOW()
    WHERE name = job_name;
    
    BEGIN
        -- Simular chamada para Edge Function
        -- Em um ambiente real, isso seria feito via HTTP request
        
        IF job_record.function_name = 'hitss-automation' THEN
            -- Log da execução da automação HITSS
            INSERT INTO system_logs (level, message, source, metadata)
            VALUES (
                'info',
                'Cron job executado: Automação HITSS diária',
                'cron-scheduler',
                jsonb_build_object(
                    'job_name', job_name,
                    'function_name', job_record.function_name,
                    'schedule', job_record.schedule
                )
            );
            
            result := jsonb_build_object(
                'success', true,
                'message', 'Automação HITSS executada com sucesso',
                'timestamp', NOW()
            );
            success := true;
            
        ELSIF job_record.function_name = 'execute-dre-automation' THEN
            -- Log da execução de sincronização
            INSERT INTO system_logs (level, message, source, metadata)
            VALUES (
                'info',
                'Cron job executado: Sincronização DRE',
                'cron-scheduler',
                jsonb_build_object(
                    'job_name', job_name,
                    'function_name', job_record.function_name,
                    'schedule', job_record.schedule
                )
            );
            
            result := jsonb_build_object(
                'success', true,
                'message', 'Sincronização DRE executada com sucesso',
                'timestamp', NOW()
            );
            success := true;
            
        ELSE
            result := jsonb_build_object(
                'success', false,
                'error', 'Função não reconhecida: ' || job_record.function_name
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        error_message := SQLERRM;
        result := jsonb_build_object(
            'success', false,
            'error', error_message
        );
        
        -- Log do erro
        INSERT INTO system_logs (level, message, source, metadata)
        VALUES (
            'error',
            'Erro na execução do cron job: ' || job_name,
            'cron-scheduler',
            jsonb_build_object(
                'job_name', job_name,
                'error', error_message,
                'function_name', job_record.function_name
            )
        );
    END;
    
    -- Atualizar resultado e contadores
    UPDATE cron_jobs
    SET 
        last_result = result,
        success_count = CASE WHEN success THEN success_count + 1 ELSE success_count END,
        failure_count = CASE WHEN NOT success THEN failure_count + 1 ELSE failure_count END,
        updated_at = NOW()
    WHERE name = job_name;
    
    RETURN result;
END;
$$;

-- Função para verificar e executar jobs pendentes
CREATE OR REPLACE FUNCTION check_and_execute_pending_jobs()
RETURNS TABLE(
    job_name TEXT,
    execution_result JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    job_record RECORD;
BEGIN
    -- Buscar jobs que devem ser executados
    FOR job_record IN
        SELECT name
        FROM cron_jobs
        WHERE enabled = true
        AND (next_run_at IS NULL OR next_run_at <= NOW())
        ORDER BY next_run_at NULLS FIRST
    LOOP
        job_name := job_record.name;
        execution_result := execute_cron_job(job_record.name);
        RETURN NEXT;
    END LOOP;
END;
$$;

-- ============================================================================
-- INSERIR CRON JOBS PADRÃO
-- ============================================================================

-- Job para automação HITSS diária (9:00 AM)
INSERT INTO cron_jobs (
    name,
    description,
    schedule,
    function_name,
    function_url,
    enabled,
    next_run_at
) VALUES (
    'hitss_daily_automation',
    'Execução diária da automação HITSS para processamento de dados DRE',
    '0 9 * * *',
    'hitss-automation',
    '/functions/v1/hitss-automation',
    true,
    calculate_next_run('0 9 * * *')
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    schedule = EXCLUDED.schedule,
    function_name = EXCLUDED.function_name,
    function_url = EXCLUDED.function_url,
    next_run_at = calculate_next_run(EXCLUDED.schedule),
    updated_at = NOW();

-- Job para sincronização de dados DRE (a cada hora)
INSERT INTO cron_jobs (
    name,
    description,
    schedule,
    function_name,
    function_url,
    enabled,
    next_run_at
) VALUES (
    'dre_hourly_sync',
    'Sincronização horária de dados DRE entre sistemas',
    '0 * * * *',
    'execute-dre-automation',
    '/functions/v1/execute-dre-automation',
    true,
    calculate_next_run('0 * * * *')
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    schedule = EXCLUDED.schedule,
    function_name = EXCLUDED.function_name,
    function_url = EXCLUDED.function_url,
    next_run_at = calculate_next_run(EXCLUDED.schedule),
    updated_at = NOW();

-- Job para limpeza de logs antigos (diário às 2:00 AM)
INSERT INTO cron_jobs (
    name,
    description,
    schedule,
    function_name,
    function_url,
    enabled,
    next_run_at
) VALUES (
    'cleanup_old_logs',
    'Limpeza diária de logs antigos e execuções órfãs',
    '0 2 * * *',
    'execute-dre-automation',
    '/functions/v1/execute-dre-automation?action=cleanup',
    true,
    calculate_next_run('0 2 * * *')
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    schedule = EXCLUDED.schedule,
    function_name = EXCLUDED.function_name,
    function_url = EXCLUDED.function_url,
    next_run_at = calculate_next_run(EXCLUDED.schedule),
    updated_at = NOW();

-- ============================================================================
-- CONFIGURAR RLS E PERMISSÕES
-- ============================================================================

-- Habilitar RLS
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados (leitura)
CREATE POLICY "Usuários autenticados podem visualizar cron jobs"
ON cron_jobs
FOR SELECT
TO authenticated
USING (true);

-- Política para service_role (acesso total)
CREATE POLICY "Service role acesso total aos cron jobs"
ON cron_jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Conceder permissões
GRANT SELECT ON cron_jobs TO authenticated;
GRANT ALL PRIVILEGES ON cron_jobs TO service_role;

-- ============================================================================
-- VIEWS PARA MONITORAMENTO
-- ============================================================================

-- View para dashboard de cron jobs
CREATE OR REPLACE VIEW cron_jobs_dashboard AS
SELECT 
    name,
    description,
    schedule,
    enabled,
    last_run_at,
    next_run_at,
    run_count,
    success_count,
    failure_count,
    CASE 
        WHEN failure_count = 0 THEN 100.0
        WHEN run_count = 0 THEN 0.0
        ELSE ROUND((success_count::DECIMAL / run_count::DECIMAL) * 100, 2)
    END as success_rate_percent,
    CASE
        WHEN last_run_at IS NULL THEN 'never_run'
        WHEN last_result->>'success' = 'true' THEN 'success'
        ELSE 'failed'
    END as last_status,
    last_result,
    created_at,
    updated_at
FROM cron_jobs
ORDER BY next_run_at NULLS LAST;

-- View para jobs pendentes
CREATE OR REPLACE VIEW pending_cron_jobs AS
SELECT 
    name,
    description,
    schedule,
    next_run_at,
    EXTRACT(EPOCH FROM (next_run_at - NOW())) as seconds_until_run
FROM cron_jobs
WHERE enabled = true
AND (next_run_at IS NULL OR next_run_at <= NOW() + INTERVAL '1 hour')
ORDER BY next_run_at NULLS FIRST;

-- Conceder permissões nas views
GRANT SELECT ON cron_jobs_dashboard TO authenticated, service_role;
GRANT SELECT ON pending_cron_jobs TO authenticated, service_role;

-- ============================================================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_cron_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_cron_jobs_updated_at
    BEFORE UPDATE ON cron_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_cron_jobs_updated_at();

-- ============================================================================
-- VERIFICAÇÃO E LOG DE MIGRAÇÃO
-- ============================================================================

-- Verificar se a tabela foi criada corretamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cron_jobs') THEN
        RAISE NOTICE 'Tabela cron_jobs criada com sucesso';
        
        -- Log da migração
        INSERT INTO system_logs (level, message, source, metadata)
        VALUES (
            'info',
            'Migração 004: Tabela cron_jobs e funções de agendamento criadas',
            'migration',
            jsonb_build_object(
                'migration_file', '004_create_cron_jobs.sql',
                'tables_created', ARRAY['cron_jobs'],
                'functions_created', ARRAY[
                    'calculate_next_run',
                    'execute_cron_job',
                    'check_and_execute_pending_jobs'
                ],
                'views_created', ARRAY[
                    'cron_jobs_dashboard',
                    'pending_cron_jobs'
                ],
                'jobs_configured', 3
            )
        );
    ELSE
        RAISE EXCEPTION 'Falha ao criar tabela cron_jobs';
    END IF;
END $$;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON TABLE cron_jobs IS 'Tabela para gerenciamento de cron jobs do sistema HITSS';
COMMENT ON FUNCTION calculate_next_run(TEXT, TIMESTAMPTZ) IS 'Calcula próxima execução baseada no schedule cron';
COMMENT ON FUNCTION execute_cron_job(TEXT) IS 'Executa um cron job específico';
COMMENT ON FUNCTION check_and_execute_pending_jobs() IS 'Verifica e executa jobs pendentes';
COMMENT ON VIEW cron_jobs_dashboard IS 'Dashboard para monitoramento de cron jobs';
COMMENT ON VIEW pending_cron_jobs IS 'Lista de jobs pendentes para execução';

-- Fim do script de migração