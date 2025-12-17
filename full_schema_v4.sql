-- =====================================================
-- MIGRAÇÃO 001: Criação da Tabela DRE HITSS
-- Data: 15 de Janeiro de 2025
-- Objetivo: Criar estrutura da tabela dre_hitss com índices e permissões
-- =====================================================

-- Criar tabela principal dre_hitss
CREATE TABLE IF NOT EXISTS public.dre_hitss (
    id BIGSERIAL PRIMARY KEY,
    execution_id TEXT NOT NULL,
    conta TEXT,
    descricao TEXT,
    valor DECIMAL(15,2),
    tipo TEXT,
    periodo TEXT,
    empresa TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários da tabela
COMMENT ON TABLE public.dre_hitss IS 'Tabela para armazenar dados do DRE HITSS automatizado';
COMMENT ON COLUMN public.dre_hitss.id IS 'Chave primária auto-incremento';
COMMENT ON COLUMN public.dre_hitss.execution_id IS 'ID único da execução da automação';
COMMENT ON COLUMN public.dre_hitss.conta IS 'Código da conta contábil';
COMMENT ON COLUMN public.dre_hitss.descricao IS 'Descrição da conta contábil';
COMMENT ON COLUMN public.dre_hitss.valor IS 'Valor monetário da conta';
COMMENT ON COLUMN public.dre_hitss.tipo IS 'Tipo da conta (RECEITA/DESPESA)';
COMMENT ON COLUMN public.dre_hitss.periodo IS 'Período de referência dos dados';
COMMENT ON COLUMN public.dre_hitss.empresa IS 'Nome da empresa';
COMMENT ON COLUMN public.dre_hitss.created_at IS 'Timestamp de criação do registro';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_dre_hitss_execution_id ON public.dre_hitss(execution_id);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_empresa ON public.dre_hitss(empresa);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_periodo ON public.dre_hitss(periodo);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_created_at ON public.dre_hitss(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_tipo ON public.dre_hitss(tipo);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_conta ON public.dre_hitss(conta);

-- Índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_dre_hitss_empresa_periodo ON public.dre_hitss(empresa, periodo);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_execution_tipo ON public.dre_hitss(execution_id, tipo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.dre_hitss ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados (leitura e escrita)
CREATE POLICY "Usuários autenticados podem acessar dre_hitss" ON public.dre_hitss
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para service_role (acesso total)
CREATE POLICY "Service role acesso total dre_hitss" ON public.dre_hitss
    FOR ALL USING (auth.role() = 'service_role');

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dre_hitss TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dre_hitss TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.dre_hitss_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.dre_hitss_id_seq TO service_role;

-- Conceder permissões para anon (apenas leitura)
GRANT SELECT ON public.dre_hitss TO anon;

-- Verificar se a tabela foi criada corretamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dre_hitss' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela dre_hitss criada com sucesso!';
    ELSE
        RAISE EXCEPTION 'Erro ao criar tabela dre_hitss';
    END IF;
END $$;

-- Log da migração
-- =====================================================
-- MIGRAÇÃO 002: Criação da Tabela Automation Executions
-- Data: 15 de Janeiro de 2025
-- Objetivo: Criar tabela de controle de execuções da automação HITSS
-- =====================================================

-- Criar tabela de controle de execuções
CREATE TABLE IF NOT EXISTS public.automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    execution_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários da tabela
COMMENT ON TABLE public.automation_executions IS 'Tabela para controle de execuções da automação HITSS';
COMMENT ON COLUMN public.automation_executions.id IS 'Identificador único da execução (UUID)';
COMMENT ON COLUMN public.automation_executions.status IS 'Status da execução: running, completed, failed';
COMMENT ON COLUMN public.automation_executions.started_at IS 'Timestamp de início da execução';
COMMENT ON COLUMN public.automation_executions.completed_at IS 'Timestamp de conclusão da execução';
COMMENT ON COLUMN public.automation_executions.records_processed IS 'Número de registros processados com sucesso';
COMMENT ON COLUMN public.automation_executions.records_failed IS 'Número de registros que falharam no processamento';
COMMENT ON COLUMN public.automation_executions.error_message IS 'Mensagem de erro em caso de falha';
COMMENT ON COLUMN public.automation_executions.execution_details IS 'Detalhes da execução em formato JSON';
COMMENT ON COLUMN public.automation_executions.created_at IS 'Timestamp de criação do registro';
COMMENT ON COLUMN public.automation_executions.updated_at IS 'Timestamp da última atualização';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON public.automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_started_at ON public.automation_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_executions_completed_at ON public.automation_executions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_executions_created_at ON public.automation_executions(created_at DESC);

-- Índice composto para consultas de monitoramento
CREATE INDEX IF NOT EXISTS idx_automation_executions_status_started ON public.automation_executions(status, started_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_automation_executions_updated_at
    BEFORE UPDATE ON public.automation_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados (leitura e escrita)
CREATE POLICY "Usuários autenticados podem acessar automation_executions" ON public.automation_executions
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para service_role (acesso total)
CREATE POLICY "Service role acesso total automation_executions" ON public.automation_executions
    FOR ALL USING (auth.role() = 'service_role');

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_executions TO service_role;

-- Conceder permissões para anon (apenas leitura)
GRANT SELECT ON public.automation_executions TO anon;

-- Criar view para monitoramento das execuções
CREATE OR REPLACE VIEW public.automation_executions_summary AS
SELECT 
    status,
    COUNT(*) as total_executions,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
    SUM(records_processed) as total_records_processed,
    SUM(records_failed) as total_records_failed,
    MAX(started_at) as last_execution
FROM public.automation_executions
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY status;

-- Conceder permissões na view
GRANT SELECT ON public.automation_executions_summary TO authenticated;
GRANT SELECT ON public.automation_executions_summary TO service_role;
GRANT SELECT ON public.automation_executions_summary TO anon;

-- Função para limpeza de execuções antigas (manter apenas 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_executions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.automation_executions 
    WHERE started_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se a tabela foi criada corretamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_executions' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela automation_executions criada com sucesso!';
    ELSE
        RAISE EXCEPTION 'Erro ao criar tabela automation_executions';
    END IF;
END $$;

-- Log da migração
-- =====================================================
-- MIGRAÇÃO 003: Criação da Tabela System Logs
-- Data: 15 de Janeiro de 2025
-- Objetivo: Criar tabela para logs e monitoramento do sistema
-- =====================================================

-- Criar tabela de logs do sistema
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    message TEXT NOT NULL,
    source VARCHAR(100) NOT NULL, -- Edge Function ou serviço que gerou o log
    execution_id UUID, -- Referência para automation_executions
    metadata JSONB, -- Dados adicionais do log
    user_id UUID, -- ID do usuário (se aplicável)
    ip_address INET, -- Endereço IP da requisição
    user_agent TEXT, -- User agent da requisição
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários da tabela
COMMENT ON TABLE public.system_logs IS 'Tabela para armazenar logs do sistema e monitoramento';
COMMENT ON COLUMN public.system_logs.id IS 'Identificador único do log (UUID)';
COMMENT ON COLUMN public.system_logs.level IS 'Nível do log: DEBUG, INFO, WARN, ERROR, FATAL';
COMMENT ON COLUMN public.system_logs.message IS 'Mensagem do log';
COMMENT ON COLUMN public.system_logs.source IS 'Fonte que gerou o log (Edge Function, serviço, etc.)';
COMMENT ON COLUMN public.system_logs.execution_id IS 'ID da execução relacionada (FK para automation_executions)';
COMMENT ON COLUMN public.system_logs.metadata IS 'Metadados adicionais em formato JSON';
COMMENT ON COLUMN public.system_logs.user_id IS 'ID do usuário que gerou o log';
COMMENT ON COLUMN public.system_logs.ip_address IS 'Endereço IP da requisição';
COMMENT ON COLUMN public.system_logs.user_agent IS 'User agent da requisição';
COMMENT ON COLUMN public.system_logs.created_at IS 'Timestamp de criação do log';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON public.system_logs(source);
CREATE INDEX IF NOT EXISTS idx_system_logs_execution_id ON public.system_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_system_logs_level_created ON public.system_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_source_level ON public.system_logs(source, level);
CREATE INDEX IF NOT EXISTS idx_system_logs_execution_level ON public.system_logs(execution_id, level);

-- Índice GIN para busca em metadata JSONB
CREATE INDEX IF NOT EXISTS idx_system_logs_metadata_gin ON public.system_logs USING GIN (metadata);

-- Adicionar foreign key para automation_executions
ALTER TABLE public.system_logs 
ADD CONSTRAINT fk_system_logs_execution_id 
FOREIGN KEY (execution_id) 
REFERENCES public.automation_executions(id) 
ON DELETE SET NULL;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados (leitura e escrita)
CREATE POLICY "Usuários autenticados podem acessar system_logs" ON public.system_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para service_role (acesso total)
CREATE POLICY "Service role acesso total system_logs" ON public.system_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_logs TO service_role;

-- Conceder permissões para anon (apenas leitura de logs INFO e acima)
GRANT SELECT ON public.system_logs TO anon;

-- Criar view para dashboard de monitoramento
CREATE OR REPLACE VIEW public.system_logs_dashboard AS
SELECT 
    level,
    source,
    COUNT(*) as total_logs,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as logs_last_hour,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as logs_last_24h,
    MAX(created_at) as last_log_time
FROM public.system_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY level, source
ORDER BY level, source;

-- Conceder permissões na view
GRANT SELECT ON public.system_logs_dashboard TO authenticated;
GRANT SELECT ON public.system_logs_dashboard TO service_role;
GRANT SELECT ON public.system_logs_dashboard TO anon;

-- Criar view para logs de erro recentes
CREATE OR REPLACE VIEW public.recent_error_logs AS
SELECT 
    id,
    level,
    message,
    source,
    execution_id,
    metadata,
    created_at
FROM public.system_logs
WHERE level IN ('ERROR', 'FATAL')
    AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 100;

-- Conceder permissões na view
GRANT SELECT ON public.recent_error_logs TO authenticated;
GRANT SELECT ON public.recent_error_logs TO service_role;
GRANT SELECT ON public.recent_error_logs TO anon;

-- Função para inserir logs de forma simplificada
CREATE OR REPLACE FUNCTION log_message(
    p_level VARCHAR(10),
    p_message TEXT,
    p_source VARCHAR(100),
    p_execution_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.system_logs (level, message, source, execution_id, metadata)
    VALUES (p_level, p_message, p_source, p_execution_id, p_metadata)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Manter logs de ERROR e FATAL por 90 dias
    -- Manter logs de WARN por 30 dias
    -- Manter logs de INFO e DEBUG por 7 dias
    
    DELETE FROM public.system_logs 
    WHERE 
        (level IN ('ERROR', 'FATAL') AND created_at < NOW() - INTERVAL '90 days')
        OR (level = 'WARN' AND created_at < NOW() - INTERVAL '30 days')
        OR (level IN ('INFO', 'DEBUG') AND created_at < NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    PERFORM log_message('INFO', 
        'Limpeza automática de logs executada. Registros removidos: ' || deleted_count,
        'cleanup_old_logs',
        NULL,
        jsonb_build_object('deleted_count', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de logs
CREATE OR REPLACE FUNCTION get_log_statistics(days_back INTEGER DEFAULT 7)
RETURNS TABLE(
    level VARCHAR(10),
    source VARCHAR(100),
    count BIGINT,
    first_occurrence TIMESTAMPTZ,
    last_occurrence TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.level,
        sl.source,
        COUNT(*) as count,
        MIN(sl.created_at) as first_occurrence,
        MAX(sl.created_at) as last_occurrence
    FROM public.system_logs sl
    WHERE sl.created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY sl.level, sl.source
    ORDER BY sl.level, count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se a tabela foi criada corretamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela system_logs criada com sucesso!';
        
        -- Inserir log inicial
        PERFORM log_message('INFO', 'Sistema de logs inicializado com sucesso', 'migration_003');
    ELSE
        RAISE EXCEPTION 'Erro ao criar tabela system_logs';
    END IF;
END $$;

-- Log da migração
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
            'ERROR', 'Job não encontrado ou desabilitado: ' || job_name
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
                'INFO',
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
                'INFO',
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
                'ERROR', 'Função não reconhecida: ' || job_record.function_name
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        error_message := SQLERRM;
        result := jsonb_build_object(
            'success', false,
            'ERROR', error_message
        );
        
        -- Log do erro
        INSERT INTO system_logs (level, message, source, metadata)
        VALUES (
            'ERROR',
            'Erro na execução do cron job: ' || job_name,
            'cron-scheduler',
            jsonb_build_object(
                'job_name', job_name,
                'ERROR', error_message,
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
            'INFO',
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
-- Criação das tabelas necessárias para as Edge Functions

-- Tabela para armazenar transações financeiras
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_conta VARCHAR(50) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    data_transacao DATE NOT NULL,
    departamento VARCHAR(100),
    centro_custo VARCHAR(100),
    natureza VARCHAR(50) NOT NULL CHECK (natureza IN ('Receita', 'Custo', 'Despesa')),
    resumo_conta TEXT,
    descricao TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar dados de DRE
CREATE TABLE IF NOT EXISTS dados_dre (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_conta VARCHAR(50) NOT NULL,
    nome_conta VARCHAR(200) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    situacao VARCHAR(50) DEFAULT 'Ativo',
    agrupamento VARCHAR(100),
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar profissionais
CREATE TABLE IF NOT EXISTS profissionais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    departamento VARCHAR(100),
    cargo VARCHAR(100),
    salario DECIMAL(10,2),
    data_admissao DATE,
    status VARCHAR(50) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Licença', 'Demitido')),
    tipo_contrato VARCHAR(50) CHECK (tipo_contrato IN ('CLT', 'PJ', 'Terceirizado', 'Estagiário')),
    id_externo VARCHAR(100),
    dados_externos JSONB,
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sincronizado_em TIMESTAMP WITH TIME ZONE
);

-- Tabela para armazenar previsões financeiras
CREATE TABLE IF NOT EXISTS previsoes_financeiras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo_previsao VARCHAR(50) NOT NULL CHECK (tipo_previsao IN ('revenue', 'cost', 'profit', 'cashflow', 'comprehensive')),
    algoritmo VARCHAR(50) NOT NULL,
    periodos_previstos JSONB NOT NULL,
    confianca DECIMAL(5,4),
    pontos_dados_historicos INTEGER,
    metadados JSONB,
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evento VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(100),
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    usuario_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar uploads de arquivos
CREATE TABLE IF NOT EXISTS uploads_arquivos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(50) NOT NULL,
    tamanho_arquivo BIGINT,
    tipo_upload VARCHAR(50) NOT NULL CHECK (tipo_upload IN ('dre', 'financeiro', 'profissionais')),
    status VARCHAR(50) DEFAULT 'processando' CHECK (status IN ('processando', 'concluido', 'erro')),
    registros_processados INTEGER DEFAULT 0,
    registros_com_erro INTEGER DEFAULT 0,
    erros JSONB,
    metadados JSONB,
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processado_em TIMESTAMP WITH TIME ZONE
);

-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50),
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes_financeiras(data_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_natureza ON transacoes_financeiras(natureza);
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario ON transacoes_financeiras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_codigo_conta ON transacoes_financeiras(codigo_conta);

CREATE INDEX IF NOT EXISTS idx_dre_periodo ON dados_dre(ano, mes);
CREATE INDEX IF NOT EXISTS idx_dre_codigo_conta ON dados_dre(codigo_conta);
CREATE INDEX IF NOT EXISTS idx_dre_usuario ON dados_dre(usuario_id);

CREATE INDEX IF NOT EXISTS idx_profissionais_email ON profissionais(email);
CREATE INDEX IF NOT EXISTS idx_profissionais_status ON profissionais(status);
CREATE INDEX IF NOT EXISTS idx_profissionais_departamento ON profissionais(departamento);
CREATE INDEX IF NOT EXISTS idx_profissionais_id_externo ON profissionais(id_externo);

CREATE INDEX IF NOT EXISTS idx_previsoes_tipo ON previsoes_financeiras(tipo_previsao);
CREATE INDEX IF NOT EXISTS idx_previsoes_criado_por ON previsoes_financeiras(criado_por);
CREATE INDEX IF NOT EXISTS idx_previsoes_criado_em ON previsoes_financeiras(criado_em);

CREATE INDEX IF NOT EXISTS idx_auditoria_evento ON logs_auditoria(evento);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela ON logs_auditoria(tabela_afetada);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON logs_auditoria(timestamp);

CREATE INDEX IF NOT EXISTS idx_uploads_tipo ON uploads_arquivos(tipo_upload);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads_arquivos(status);
CREATE INDEX IF NOT EXISTS idx_uploads_usuario ON uploads_arquivos(usuario_id);

-- Triggers para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON transacoes_financeiras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dre_updated_at BEFORE UPDATE ON dados_dre
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profissionais_updated_at BEFORE UPDATE ON profissionais
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes_sistema
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações padrão
INSERT INTO configuracoes_sistema (chave, valor, descricao, categoria) VALUES
('forecast_default_algorithm', '"linear_regression"', 'Algoritmo padrão para previsões financeiras', 'forecast'),
('forecast_default_periods', '12', 'Número padrão de períodos para previsão', 'forecast'),
('forecast_confidence_level', '0.95', 'Nível de confiança padrão para intervalos', 'forecast'),
('upload_max_file_size', '52428800', 'Tamanho máximo de arquivo em bytes (50MB)', 'upload'),
('sync_batch_size', '100', 'Tamanho do lote para sincronização de profissionais', 'sync'),
('audit_retention_days', '365', 'Dias de retenção para logs de auditoria', 'audit')
ON CONFLICT (chave) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE dados_dre ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE previsoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads_arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (usuários só podem ver seus próprios dados)
CREATE POLICY "Usuários podem ver suas próprias transações" ON transacoes_financeiras
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver seus próprios dados DRE" ON dados_dre
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver seus próprios profissionais" ON profissionais
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver suas próprias previsões" ON previsoes_financeiras
    FOR ALL USING (auth.uid() = criado_por);

CREATE POLICY "Usuários podem ver seus próprios logs" ON logs_auditoria
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver seus próprios uploads" ON uploads_arquivos
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver configurações do sistema" ON configuracoes_sistema
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem atualizar configurações" ON configuracoes_sistema
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Comentários nas tabelas
COMMENT ON TABLE transacoes_financeiras IS 'Armazena todas as transações financeiras do sistema';
COMMENT ON TABLE dados_dre IS 'Armazena dados do Demonstrativo de Resultado do Exercício';
COMMENT ON TABLE profissionais IS 'Armazena informações dos profissionais da empresa';
COMMENT ON TABLE previsoes_financeiras IS 'Armazena previsões financeiras geradas pelo sistema';
COMMENT ON TABLE logs_auditoria IS 'Armazena logs de auditoria de todas as operações do sistema';
COMMENT ON TABLE uploads_arquivos IS 'Armazena informações sobre uploads de arquivos processados';
COMMENT ON TABLE configuracoes_sistema IS 'Armazena configurações globais do sistema';
-- Migração para criar tabelas da automação HITSS
-- Data: 2024-12-06
-- Descrição: Cria tabelas para armazenar dados importados da HITSS e logs de execução

-- Habilitar extensão pg_cron se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Tabela para armazenar dados importados da HITSS
CREATE TABLE IF NOT EXISTS hitss_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  categoria VARCHAR(255) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('debito', 'credito')),
  row_number INTEGER,
  execution_id UUID,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de execução da automação
CREATE TABLE IF NOT EXISTS hitss_automation_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID UNIQUE NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  file_downloaded BOOLEAN DEFAULT FALSE,
  file_name VARCHAR(255),
  file_size BIGINT,
  records_processed INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  execution_time INTEGER, -- em millisegundos
  errors JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs detalhados da automação
CREATE TABLE IF NOT EXISTS hitss_automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID,
  level VARCHAR(10) NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR')),
  message TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_hitss_data_data ON hitss_data(data);
CREATE INDEX IF NOT EXISTS idx_hitss_data_execution_id ON hitss_data(execution_id);
CREATE INDEX IF NOT EXISTS idx_hitss_data_categoria ON hitss_data(categoria);
CREATE INDEX IF NOT EXISTS idx_hitss_data_tipo ON hitss_data(tipo);
CREATE INDEX IF NOT EXISTS idx_hitss_data_imported_at ON hitss_data(imported_at);

CREATE INDEX IF NOT EXISTS idx_hitss_executions_execution_id ON hitss_automation_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_hitss_executions_timestamp ON hitss_automation_executions(timestamp);
CREATE INDEX IF NOT EXISTS idx_hitss_executions_success ON hitss_automation_executions(success);

CREATE INDEX IF NOT EXISTS idx_hitss_logs_execution_id ON hitss_automation_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_hitss_logs_level ON hitss_automation_logs(level);
CREATE INDEX IF NOT EXISTS idx_hitss_logs_timestamp ON hitss_automation_logs(timestamp);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hitss_data_updated_at 
    BEFORE UPDATE ON hitss_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar logs antigos (manter apenas últimos 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_hitss_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar logs de execução mais antigos que 30 dias
    DELETE FROM hitss_automation_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Deletar execuções mais antigas que 90 dias (manter histórico por mais tempo)
    DELETE FROM hitss_automation_executions 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas da automação
CREATE OR REPLACE FUNCTION get_hitss_automation_stats()
RETURNS TABLE (
    total_executions BIGINT,
    successful_executions BIGINT,
    failed_executions BIGINT,
    total_records_imported BIGINT,
    last_execution TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE success = true) as successful_executions,
        COUNT(*) FILTER (WHERE success = false) as failed_executions,
        COALESCE(SUM(records_imported), 0) as total_records_imported,
        MAX(timestamp) as last_execution,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as success_rate
    FROM hitss_automation_executions;
END;
$$ LANGUAGE plpgsql;

-- Configurar job do pg_cron para executar a automação diariamente às 08:00
-- Nota: Este job será configurado após o deploy da Edge Function
-- SELECT cron.schedule('hitss-automation-daily', '0 8 * * *', 
--   'SELECT net.http_post(
--     url := ''https://your-project.supabase.co/functions/v1/hitss-automation'',
--     headers := jsonb_build_object(''Authorization'', ''Bearer '' || current_setting(''app.service_role_key''))
--   );'
-- );

-- Configurar job de limpeza de logs (executar semanalmente aos domingos às 02:00)
SELECT cron.schedule(
    'hitss-logs-cleanup', 
    '0 2 * * 0', 
    'SELECT cleanup_old_hitss_logs();'
);

-- Comentários para documentação
COMMENT ON TABLE hitss_data IS 'Dados financeiros importados da plataforma HITSS';
COMMENT ON TABLE hitss_automation_executions IS 'Log de execuções da automação HITSS';
COMMENT ON TABLE hitss_automation_logs IS 'Logs detalhados da automação HITSS';

COMMENT ON COLUMN hitss_data.tipo IS 'Tipo da transação: debito ou credito';
COMMENT ON COLUMN hitss_data.execution_id IS 'ID da execução que importou este registro';
COMMENT ON COLUMN hitss_automation_executions.execution_time IS 'Tempo de execução em millisegundos';
COMMENT ON COLUMN hitss_automation_logs.context IS 'Contexto adicional do log em formato JSON';

-- Conceder permissões para roles anon e authenticated
GRANT SELECT ON hitss_data TO anon, authenticated;
GRANT SELECT ON hitss_automation_executions TO anon, authenticated;
GRANT SELECT ON hitss_automation_logs TO anon, authenticated;

-- Permissões para service_role (usado pela Edge Function)
GRANT ALL PRIVILEGES ON hitss_data TO service_role;
GRANT ALL PRIVILEGES ON hitss_automation_executions TO service_role;
GRANT ALL PRIVILEGES ON hitss_automation_logs TO service_role;

-- RLS (Row Level Security) - configurar conforme necessário
ALTER TABLE hitss_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitss_automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitss_automation_logs ENABLE ROW LEVEL SECURITY;

-- Política básica para permitir leitura para usuários autenticados
CREATE POLICY "Allow read access for authenticated users" ON hitss_data
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON hitss_automation_executions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON hitss_automation_logs
    FOR SELECT TO authenticated USING (true);

-- Política para service_role ter acesso total
CREATE POLICY "Allow all access for service_role" ON hitss_data
    FOR ALL TO service_role USING (true);

CREATE POLICY "Allow all access for service_role" ON hitss_automation_executions
    FOR ALL TO service_role USING (true);

CREATE POLICY "Allow all access for service_role" ON hitss_automation_logs
    FOR ALL TO service_role USING (true);
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
        'INFO',
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
        'ERROR',
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
        'INFO',
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
        'INFO',
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
-- Migration: Create dre_hitss table with complete structure
-- Created: 2024-12-20
-- Description: Creates the dre_hitss table with all indexes, constraints, and triggers

-- Create the main table
create table if not exists public.dre_hitss ( 
   id serial not null, 
   upload_batch_id uuid not null, 
   file_name text not null, 
   uploaded_at timestamp without time zone null default now(), 
   tipo character varying(20) not null, 
   natureza character varying(20) not null, 
   descricao text not null, 
   valor numeric(15, 2) not null, 
   data text not null, 
   categoria text null, 
   observacao text null, 
   lancamento numeric(15, 2) not null, 
   projeto text null, 
   periodo character varying(10) null, 
   denominacao_conta text null, 
   conta_resumo text null, 
   linha_negocio text null, 
   relatorio text null, 
   raw_data jsonb null, 
   created_at timestamp without time zone null default now(), 
   updated_at timestamp without time zone null default now(), 
   constraint dre_hitss_pkey primary key (id), 
   constraint dre_hitss_natureza_check check ( 
     ( 
       (natureza)::text = any ( 
         array[ 
           ('RECEITA'::character varying)::text, 
           ('CUSTO'::character varying)::text 
         ] 
       ) 
     ) 
   ), 
   constraint dre_hitss_tipo_check check ( 
     ( 
       (tipo)::text = any ( 
         array[ 
           ('receita'::character varying)::text, 
           ('despesa'::character varying)::text 
         ] 
       ) 
     ) 
   ) 
 ) tablespace pg_default; 

-- Create indexes for performance optimization
create index if not exists idx_dre_batch on public.dre_hitss using btree (upload_batch_id) tablespace pg_default; 
create index if not exists idx_dre_conta_resumo on public.dre_hitss using btree (conta_resumo) tablespace pg_default; 
create index if not exists idx_dre_hitss_batch on public.dre_hitss using btree (upload_batch_id) tablespace pg_default; 
create index if not exists idx_dre_hitss_conta_resumo on public.dre_hitss using btree (conta_resumo) tablespace pg_default; 
create index if not exists idx_dre_hitss_data on public.dre_hitss using btree (data) tablespace pg_default; 
create index if not exists idx_dre_hitss_financeiro on public.dre_hitss using btree (tipo, natureza, periodo, projeto) tablespace pg_default; 
create index if not exists idx_dre_hitss_natureza on public.dre_hitss using btree (natureza) tablespace pg_default; 
create index if not exists idx_dre_hitss_periodo on public.dre_hitss using btree (periodo) tablespace pg_default; 
create index if not exists idx_dre_hitss_projeto on public.dre_hitss using btree (projeto) tablespace pg_default; 
create index if not exists idx_dre_hitss_tipo on public.dre_hitss using btree (tipo) tablespace pg_default; 
create index if not exists idx_dre_hitss_valor on public.dre_hitss using btree (valor) tablespace pg_default 
 where (valor <> (0)::numeric); 
create index if not exists idx_dre_natureza on public.dre_hitss using btree (natureza) tablespace pg_default; 
create index if not exists idx_dre_periodo on public.dre_hitss using btree (periodo) tablespace pg_default; 
create index if not exists idx_dre_projeto on public.dre_hitss using btree (projeto) tablespace pg_default; 
create index if not exists idx_dre_tipo on public.dre_hitss using btree (tipo) tablespace pg_default; 

-- Create audit trigger (assuming log_audit_event function exists)
-- Note: This will only work if the log_audit_event function is already created
do $$
begin
  if exists (select 1 from pg_proc where proname = 'log_audit_event') then
    execute 'create trigger audit_dre_hitss 
             after insert or delete or update on dre_hitss 
             for each row execute function log_audit_event()';
  end if;
end $$;

-- Add table and column comments
comment on table public.dre_hitss is 'Tabela para armazenar dados do DRE (Demonstrativo de Resultado do Exercício) da HITSS';
comment on column public.dre_hitss.upload_batch_id is 'ID do lote de upload para rastreamento';
comment on column public.dre_hitss.tipo is 'Tipo do lançamento: receita ou despesa';
comment on column public.dre_hitss.natureza is 'Natureza do lançamento: RECEITA ou CUSTO';
comment on column public.dre_hitss.valor is 'Valor monetário do lançamento';
comment on column public.dre_hitss.lancamento is 'Valor do lançamento contábil';
comment on column public.dre_hitss.raw_data is 'Dados brutos em formato JSON para auditoria';

-- Enable Row Level Security (RLS)
alter table public.dre_hitss enable row level security;

-- Create basic RLS policies
create policy "Enable read access for authenticated users" on public.dre_hitss
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.dre_hitss
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.dre_hitss
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.dre_hitss
  for delete using (auth.role() = 'authenticated');
-- Adicionar colunas necessárias para o arquivo DRE HITSS
-- Baseado no mapeamento em MAPEAMENTO.md

ALTER TABLE dre_hitss 
ADD COLUMN IF NOT EXISTS relatorio VARCHAR(255),
ADD COLUMN IF NOT EXISTS cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS linha_negocio VARCHAR(255),
ADD COLUMN IF NOT EXISTS responsavel_area VARCHAR(255),
ADD COLUMN IF NOT EXISTS responsavel_delivery VARCHAR(255),
ADD COLUMN IF NOT EXISTS responsavel_devengado VARCHAR(255),
ADD COLUMN IF NOT EXISTS id_homs VARCHAR(255),
ADD COLUMN IF NOT EXISTS codigo_projeto VARCHAR(255),
ADD COLUMN IF NOT EXISTS filial_faturamento VARCHAR(255),
ADD COLUMN IF NOT EXISTS imposto VARCHAR(255),
ADD COLUMN IF NOT EXISTS conta_resumo VARCHAR(255),
ADD COLUMN IF NOT EXISTS denominacao_conta TEXT,
ADD COLUMN IF NOT EXISTS id_recurso VARCHAR(255),
ADD COLUMN IF NOT EXISTS recurso VARCHAR(255),
ADD COLUMN IF NOT EXISTS lancamento NUMERIC,
ADD COLUMN IF NOT EXISTS periodo VARCHAR(255);

-- Comentários para documentar as colunas
COMMENT ON COLUMN dre_hitss.relatorio IS 'Relatório de origem dos dados';
COMMENT ON COLUMN dre_hitss.cliente IS 'Nome do cliente';
COMMENT ON COLUMN dre_hitss.linha_negocio IS 'Linha de negócio';
COMMENT ON COLUMN dre_hitss.responsavel_area IS 'Responsável pela área';
COMMENT ON COLUMN dre_hitss.responsavel_delivery IS 'Responsável pelo delivery';
COMMENT ON COLUMN dre_hitss.responsavel_devengado IS 'Responsável pelo devengado';
COMMENT ON COLUMN dre_hitss.id_homs IS 'ID HOMS';
COMMENT ON COLUMN dre_hitss.codigo_projeto IS 'Código do projeto';
COMMENT ON COLUMN dre_hitss.filial_faturamento IS 'Filial de faturamento';
COMMENT ON COLUMN dre_hitss.imposto IS 'Informações de imposto';
COMMENT ON COLUMN dre_hitss.conta_resumo IS 'Resumo da conta';
COMMENT ON COLUMN dre_hitss.denominacao_conta IS 'Denominação da conta';
COMMENT ON COLUMN dre_hitss.id_recurso IS 'ID do recurso';
COMMENT ON COLUMN dre_hitss.recurso IS 'Nome do recurso';
COMMENT ON COLUMN dre_hitss.lancamento IS 'Valor do lançamento';
COMMENT ON COLUMN dre_hitss.periodo IS 'Período de referência';

-- Atualizar comentário da tabela
COMMENT ON TABLE dre_hitss IS 'Tabela DRE HITSS com estrutura completa para dados do arquivo Excel';
-- Limpar dados simulados da tabela dre_hitss
-- Para permitir inserção dos dados reais do arquivo Excel

DELETE FROM dre_hitss;

-- Reset da sequência se houver
-- (não aplicável para UUID, mas mantemos para compatibilidade)

-- Comentário sobre a operação
COMMENT ON TABLE dre_hitss IS 'Tabela DRE HITSS limpa e pronta para dados reais do arquivo Excel';
-- Limpar tabela dre_hitss para remover dados simulados
-- Data: 2024-12-20
-- Descrição: Remove todos os dados simulados da tabela dre_hitss para preparar para inserção dos dados reais do Excel

-- Deletar todos os registros da tabela dre_hitss
DELETE FROM dre_hitss;

-- Resetar a sequência se necessário (não aplicável para UUID)
-- Como usamos UUID, não há necessidade de resetar sequência

-- Comentário: Tabela limpa e pronta para receber dados reais do arquivo Excel dre_hitss_1758504595588.xlsx
-- Configurar Supabase Vault para gerenciar segredos
-- Esta migração habilita o Supabase Vault e cria funções para gerenciar segredos

-- Habilitar a extensão Supabase Vault
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Verificar se a view decrypted_secrets existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'vault' 
        AND table_name = 'decrypted_secrets'
    ) THEN
        RAISE NOTICE 'Supabase Vault configurado com sucesso. View vault.decrypted_secrets disponível.';
    ELSE
        RAISE NOTICE 'Erro: View vault.decrypted_secrets não encontrada após habilitar extensão.';
    END IF;
END $$;

-- Criar função para inserir segredos de forma segura
CREATE OR REPLACE FUNCTION public.insert_secret(
    secret_name TEXT,
    secret_value TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário tem permissão (service_role)
    IF current_setting('role') != 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: apenas service_role pode inserir segredos';
    END IF;
    
    -- Usar a função nativa do Vault para criar o segredo
    RETURN vault.create_secret(secret_value, secret_name);
END;
$$;

-- Criar função para recuperar segredos
CREATE OR REPLACE FUNCTION public.get_secret(
    secret_name TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    secret_value TEXT;
BEGIN
    -- Verificar se o usuário tem permissão (service_role)
    IF current_setting('role') != 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: apenas service_role pode acessar segredos';
    END IF;
    
    -- Buscar o segredo descriptografado
    SELECT decrypted_secret INTO secret_value
    FROM vault.decrypted_secrets
    WHERE name = secret_name;
    
    RETURN secret_value;
END;
$$;

-- Criar função para atualizar segredos
CREATE OR REPLACE FUNCTION public.update_secret(
    secret_name TEXT,
    new_secret_value TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    secret_id UUID;
    rows_affected INTEGER;
BEGIN
    -- Verificar se o usuário tem permissão (service_role)
    IF current_setting('role') != 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: apenas service_role pode atualizar segredos';
    END IF;
    
    -- Buscar o ID do segredo
    SELECT id INTO secret_id
    FROM vault.secrets
    WHERE name = secret_name;
    
    IF secret_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar o segredo
    UPDATE vault.secrets 
    SET secret = new_secret_value, updated_at = CURRENT_TIMESTAMP
    WHERE id = secret_id;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$;

-- Criar função para deletar segredos
CREATE OR REPLACE FUNCTION public.delete_secret(
    secret_name TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    -- Verificar se o usuário tem permissão (service_role)
    IF current_setting('role') != 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: apenas service_role pode deletar segredos';
    END IF;
    
    DELETE FROM vault.secrets WHERE name = secret_name;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$;

-- Criar função para listar todos os segredos (sem valores)
CREATE OR REPLACE FUNCTION public.list_secrets()
RETURNS TABLE(
    id UUID,
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário tem permissão (service_role)
    IF current_setting('role') != 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: apenas service_role pode listar segredos';
    END IF;
    
    RETURN QUERY
    SELECT s.id, s.name, s.description, s.created_at, s.updated_at
    FROM vault.secrets s
    ORDER BY s.name;
END;
$$;

-- Comentários para documentação
COMMENT ON FUNCTION public.insert_secret IS 'Insere um novo segredo no Supabase Vault';
COMMENT ON FUNCTION public.get_secret IS 'Recupera um segredo descriptografado pelo nome';
COMMENT ON FUNCTION public.update_secret IS 'Atualiza um segredo existente';
COMMENT ON FUNCTION public.delete_secret IS 'Remove um segredo do Vault';
COMMENT ON FUNCTION public.list_secrets IS 'Lista todos os segredos (sem valores)';

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Supabase Vault configurado com sucesso!';
    RAISE NOTICE 'Funções disponíveis:';
    RAISE NOTICE '- public.insert_secret(name, value)';
    RAISE NOTICE '- public.get_secret(name)';
    RAISE NOTICE '- public.update_secret(name, new_value)';
    RAISE NOTICE '- public.delete_secret(name)';
    RAISE NOTICE '- public.list_secrets()';
END $$;
-- Migration para adicionar SUPABASE_SERVICE_ROLE_KEY ao Vault
-- Data: 2025-01-07
-- Descrição: Adiciona a chave service_role ao Vault para uso na automação

-- Inserir SUPABASE_SERVICE_ROLE_KEY no Vault
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E',
  'SUPABASE_SERVICE_ROLE_KEY',
  'Chave service_role do Supabase para automação HITSS'
);

-- Verificar se o segredo foi criado
DO $$
DECLARE
    key_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM vault.decrypted_secrets 
        WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
    ) INTO key_exists;
    
    IF key_exists THEN
        RAISE NOTICE '✅ SUPABASE_SERVICE_ROLE_KEY adicionada com sucesso ao Vault';
    ELSE
        RAISE NOTICE '❌ Falha ao adicionar SUPABASE_SERVICE_ROLE_KEY ao Vault';
    END IF;
END $$;

-- Comentário sobre segurança
-- IMPORTANTE: Esta chave permite acesso total ao banco de dados.
-- Ela é necessária para que a automação funcione via cron job.
-- A chave fica criptografada no Supabase Vault.
-- Criar tabela para armazenar dados dos projetos HITSS
CREATE TABLE IF NOT EXISTS hitss_projetos (
  id SERIAL PRIMARY KEY,
  projeto TEXT,
  cliente TEXT,
  responsavel TEXT,
  status TEXT,
  data_inicio DATE,
  data_fim DATE,
  valor DECIMAL(15,2),
  categoria TEXT,
  tipo TEXT,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_hitss_projetos_cliente ON hitss_projetos(cliente);
CREATE INDEX IF NOT EXISTS idx_hitss_projetos_responsavel ON hitss_projetos(responsavel);
CREATE INDEX IF NOT EXISTS idx_hitss_projetos_status ON hitss_projetos(status);
CREATE INDEX IF NOT EXISTS idx_hitss_projetos_data_inicio ON hitss_projetos(data_inicio);

-- Habilitar RLS (Row Level Security)
ALTER TABLE hitss_projetos ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso completo ao service role
CREATE POLICY "Service role can manage hitss_projetos" ON hitss_projetos
  FOR ALL USING (auth.role() = 'service_role');

-- Criar política para usuários autenticados lerem dados
CREATE POLICY "Authenticated users can read hitss_projetos" ON hitss_projetos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE hitss_projetos IS 'Tabela para armazenar dados dos projetos importados do sistema HITSS';
COMMENT ON COLUMN hitss_projetos.projeto IS 'Nome do projeto';
COMMENT ON COLUMN hitss_projetos.cliente IS 'Nome do cliente';
COMMENT ON COLUMN hitss_projetos.responsavel IS 'Responsável pelo projeto';
COMMENT ON COLUMN hitss_projetos.status IS 'Status atual do projeto';
COMMENT ON COLUMN hitss_projetos.data_inicio IS 'Data de início do projeto';
COMMENT ON COLUMN hitss_projetos.data_fim IS 'Data de fim do projeto';
COMMENT ON COLUMN hitss_projetos.valor IS 'Valor do projeto';
COMMENT ON COLUMN hitss_projetos.categoria IS 'Categoria do projeto';
COMMENT ON COLUMN hitss_projetos.tipo IS 'Tipo do projeto';
COMMENT ON COLUMN hitss_projetos.descricao IS 'Descrição detalhada do projeto';
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
        'INFO',
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
        'ERROR',
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
        'INFO',
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
        'ERROR',
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
        'INFO',
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
-- Migration para corrigir permissões do pg_cron (versão 2)
-- Data: 2025-01-07
-- Descrição: Remove funções existentes e recria com permissões corretas

-- Garantir que pg_cron está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover funções existentes para recriar com tipos corretos
DROP FUNCTION IF EXISTS get_hitss_cron_status();
DROP FUNCTION IF EXISTS call_hitss_automation();
DROP FUNCTION IF EXISTS setup_hitss_cron_job();
DROP FUNCTION IF EXISTS disable_hitss_cron_job();

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

-- Criar função get_hitss_cron_status com SECURITY DEFINER
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
            'last_run', j.last_run,
            'next_run', j.next_run
        )
    ) INTO result
    FROM cron.job j
    WHERE j.jobname LIKE '%hitss%'
    ORDER BY j.jobname;
    
    RETURN COALESCE(result, '[]'::json);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'ERROR', true,
        'message', SQLERRM,
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Criar função call_hitss_automation com melhor tratamento de erros
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
        'INFO',
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
        'ERROR',
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

-- Criar função setup_hitss_cron_job com SECURITY DEFINER
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
        'INFO',
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

-- Criar função disable_hitss_cron_job
CREATE OR REPLACE FUNCTION disable_hitss_cron_job()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
    job_name TEXT := 'hitss-automation-daily';
    job_exists BOOLEAN;
BEGIN
    -- Verificar se job existe
    SELECT EXISTS(
        SELECT 1 FROM cron.job WHERE jobname = job_name
    ) INTO job_exists;
    
    IF job_exists THEN
        -- Remover o job
        PERFORM cron.unschedule(job_name);
        
        -- Log da desabilitação
        INSERT INTO hitss_automation_logs (execution_id, level, message, context)
        VALUES (
            gen_random_uuid(),
            'INFO',
            'Cron job desabilitado com sucesso',
            jsonb_build_object(
                'job_name', job_name,
                'disabled_at', NOW()
            )
        );
        
        RETURN 'Cron job "' || job_name || '" foi desabilitado com sucesso.';
    ELSE
        RETURN 'Cron job "' || job_name || '" não encontrado ou já estava desabilitado.';
    END IF;
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

GRANT EXECUTE ON FUNCTION disable_hitss_cron_job() TO authenticated;
GRANT EXECUTE ON FUNCTION disable_hitss_cron_job() TO service_role;

-- Reconfigurar o cron job com as novas permissões
SELECT setup_hitss_cron_job();

-- Comentários
COMMENT ON FUNCTION get_hitss_cron_status() IS 'Retorna o status dos cron jobs relacionados à automação HITSS em formato JSON';
COMMENT ON FUNCTION call_hitss_automation() IS 'Função para chamar a Edge Function de automação HITSS via HTTP com tratamento de erros melhorado';
COMMENT ON FUNCTION setup_hitss_cron_job() IS 'Configura o cron job para executar a automação HITSS diariamente com permissões adequadas';
COMMENT ON FUNCTION disable_hitss_cron_job() IS 'Desabilita o cron job da automação HITSS';
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
        'ERROR', true,
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
        'ERROR', true,
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
-- Inserir credenciais da HITSS no Supabase Vault
-- Esta migração adiciona as credenciais específicas para automação HITSS

-- Inserir URL base da HITSS Control
SELECT vault.create_secret(
  'https://hitsscontrol.globalhitss.com.br/',
  'hitss_base_url',
  'URL base da plataforma HITSS Control'
);

-- Inserir username da HITSS
SELECT vault.create_secret(
  'fabricio.lima',
  'hitss_username',
  'Username para login na HITSS'
);

-- Inserir senha da HITSS
SELECT vault.create_secret(
  'F4br1c10FSW@2025@',
  'hitss_password',
  'Senha para login na HITSS'
);

-- Verificar se os segredos foram criados
DO $$
DECLARE
    secret_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO secret_count
    FROM vault.decrypted_secrets
    WHERE name IN ('hitss_base_url', 'hitss_username', 'hitss_password');
    
    IF secret_count = 3 THEN
        RAISE NOTICE '✅ Credenciais HITSS inseridas com sucesso no Vault';
    ELSE
        RAISE NOTICE '⚠️ Apenas % de 3 credenciais foram inseridas', secret_count;
    END IF;
END $$;

-- Comentário sobre segurança
-- IMPORTANTE: Esta migração contém credenciais sensíveis.
-- Em produção, considere usar variáveis de ambiente ou outro método seguro.
-- As credenciais ficam criptografadas no Supabase Vault.
-- Inserir projetos de exemplo para teste do filtro
INSERT INTO projetos (nome, cliente, status, data_inicio, data_fim, valor_total, descricao, responsavel) VALUES
('Sistema de Gestão Financeira', 'HITSS Brasil', 'ativo', '2024-01-15', '2024-12-31', 500000.00, 'Desenvolvimento de sistema completo de gestão financeira', 'João Silva'),
('Portal do Cliente', 'Empresa ABC', 'ativo', '2024-02-01', '2024-08-30', 250000.00, 'Portal web para atendimento ao cliente', 'Maria Santos'),
('App Mobile Vendas', 'Varejo XYZ', 'ativo', '2024-03-10', '2024-10-15', 180000.00, 'Aplicativo mobile para força de vendas', 'Pedro Costa'),
('Sistema ERP', 'Indústria 123', 'ativo', '2024-01-20', '2024-11-30', 750000.00, 'Implementação de sistema ERP completo', 'Ana Oliveira'),
('E-commerce Platform', 'Loja Online', 'ativo', '2024-04-01', '2024-09-30', 320000.00, 'Plataforma de e-commerce com integração de pagamentos', 'Carlos Lima'),
('Sistema de RH', 'Corporação DEF', 'ativo', '2024-02-15', '2024-07-31', 150000.00, 'Sistema de gestão de recursos humanos', 'Lucia Ferreira'),
('Dashboard Analytics', 'Tech Startup', 'ativo', '2024-05-01', '2024-08-15', 95000.00, 'Dashboard de analytics e relatórios', 'Roberto Alves'),
('Sistema de Estoque', 'Distribuidora GHI', 'ativo', '2024-03-01', '2024-12-15', 280000.00, 'Sistema de controle de estoque e logística', 'Fernanda Rocha')
ON CONFLICT (nome) DO NOTHING;
-- Migration para corrigir inconsistência na tabela automation_executions
-- Data: 2025-01-19
-- Descrição: Cria a tabela automation_executions que está sendo referenciada no código

-- Verificar se a tabela automation_executions existe, se não, criar
CREATE TABLE IF NOT EXISTS automation_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    records_processed INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    file_name TEXT,
    file_size BIGINT,
    execution_time INTEGER, -- em millisegundos
    error_message TEXT,
    success BOOLEAN DEFAULT false,
    function_name TEXT DEFAULT 'hitss_automation', -- Adicionar coluna que estava faltando
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_automation_executions_execution_id ON automation_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_started_at ON automation_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_executions_success ON automation_executions(success);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_automation_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_automation_executions_updated_at
    BEFORE UPDATE ON automation_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_executions_updated_at();

-- Conceder permissões
GRANT SELECT ON automation_executions TO anon, authenticated;
GRANT ALL PRIVILEGES ON automation_executions TO service_role;

-- Habilitar RLS
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Allow read access for authenticated users" ON automation_executions
    FOR SELECT TO authenticated USING (true);

-- Política para permitir leitura pública (para monitoramento)
CREATE POLICY "Allow public read access to automation executions" ON automation_executions
    FOR SELECT USING (true);

-- Migrar dados existentes de hitss_automation_executions se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hitss_automation_executions') THEN
        INSERT INTO automation_executions (
            id,
            execution_id,
            status,
            started_at,
            completed_at,
            records_processed,
            records_imported,
            file_name,
            file_size,
            execution_time,
            error_message,
            success,
            function_name,
            created_at
        )
        SELECT 
            id,
            execution_id,
            CASE 
                WHEN success = true THEN 'completed'
                WHEN success = false THEN 'failed'
                ELSE 'pending'
            END as status,
            timestamp as started_at,
            CASE 
                WHEN success IS NOT NULL THEN timestamp + (execution_time || ' milliseconds')::INTERVAL
                ELSE NULL
            END as completed_at,
            records_processed,
            records_imported,
            file_name,
            file_size,
            execution_time,
            errors as error_message,
            success,
            'hitss_automation' as function_name,
            created_at
        FROM hitss_automation_executions
        WHERE NOT EXISTS (
            SELECT 1 FROM automation_executions ae 
            WHERE ae.execution_id = hitss_automation_executions.execution_id
        );
        
        RAISE NOTICE 'Dados migrados de hitss_automation_executions para automation_executions';
    END IF;
END $$;

-- Comentários para documentação
COMMENT ON TABLE automation_executions IS 'Tabela para rastrear execuções de automação';
COMMENT ON COLUMN automation_executions.execution_id IS 'ID único da execução';
COMMENT ON COLUMN automation_executions.function_name IS 'Nome da função/automação executada';
COMMENT ON COLUMN automation_executions.execution_time IS 'Tempo de execução em millisegundos';
COMMENT ON COLUMN automation_executions.success IS 'Indica se a execução foi bem-sucedida';

-- Inserir registro de teste para validar estrutura
INSERT INTO automation_executions (
    execution_id,
    status,
    started_at,
    completed_at,
    records_processed,
    records_imported,
    success,
    function_name
) VALUES (
    gen_random_uuid(),
    'completed',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '50 minutes',
    100,
    95,
    true,
    'test_migration'
) ON CONFLICT (execution_id) DO NOTHING;

-- Verificar se a migração foi bem-sucedida
DO $$
DECLARE
    table_count INTEGER;
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name = 'automation_executions' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO record_count
    FROM automation_executions;
    
    IF table_count = 1 THEN
        RAISE NOTICE 'Migração bem-sucedida: tabela automation_executions criada com % registros', record_count;
    ELSE
        RAISE EXCEPTION 'Falha na migração: tabela automation_executions não foi criada';
    END IF;
END $$;
-- Migration: Setup Storage Webhook for DRE Upload Processing
-- Description: Creates a webhook trigger on storage.objects table to automatically
-- process DRE files when uploaded to the dre_reports bucket

-- Create the webhook trigger that will call our Edge Function
-- when a new file is inserted into the storage.objects table
CREATE OR REPLACE TRIGGER "process_dre_upload_webhook" 
AFTER INSERT ON "storage"."objects" 
FOR EACH ROW 
WHEN (NEW.bucket_id = 'dre_reports')
EXECUTE FUNCTION "supabase_functions"."http_request"(
  'http://host.docker.internal:54321/functions/v1/process-dre-upload',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '5000'
);

-- Add a comment to document the trigger
COMMENT ON TRIGGER "process_dre_upload_webhook" ON "storage"."objects" IS 
'Webhook trigger that calls the process-dre-upload Edge Function when files are uploaded to the dre_reports bucket';
-- Migração para configurar webhook de storage para upload de DRE (Produção)
-- Esta migração cria um trigger que aciona a Edge Function quando arquivos são adicionados ao bucket dre_reports

-- Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION process_dre_upload_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o arquivo foi inserido no bucket dre_reports
  IF NEW.bucket_id = 'dre_reports' THEN
    -- Chamar a Edge Function process-dre-upload
    PERFORM
      net.http_post(
        url := 'https://oomhhhfahdvavnhlbioa.supabase.co/functions/v1/process-dre-upload',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'bucket_id', NEW.bucket_id,
          'object_name', NEW.name,
          'object_id', NEW.id,
          'metadata', NEW.metadata
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger na tabela storage.objects
DROP TRIGGER IF EXISTS process_dre_upload_webhook ON storage.objects;
CREATE TRIGGER process_dre_upload_webhook
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION process_dre_upload_webhook();

-- Comentário documentando o trigger
COMMENT ON TRIGGER process_dre_upload_webhook ON storage.objects IS 
'Trigger que aciona a Edge Function process-dre-upload quando arquivos são adicionados ao bucket dre_reports';
-- Migration: Fix PostgREST cache issues for dre_hitss table
-- Created: 2025-01-25
-- Description: Recreates dre_hitss table with correct structure and optimized indexes
-- Priority: MAXIMUM - Fixes critical PostgREST cache problems

-- 1. Backup existing data if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dre_hitss' AND table_schema = 'public') THEN
        -- Create backup table
        DROP TABLE IF EXISTS dre_hitss_backup;
        CREATE TABLE dre_hitss_backup AS SELECT * FROM dre_hitss;
        RAISE NOTICE 'Backup created: dre_hitss_backup with % rows', (SELECT COUNT(*) FROM dre_hitss_backup);
    END IF;
END $$;

-- 2. Drop existing table and all dependencies
DROP TABLE IF EXISTS public.dre_hitss CASCADE;

-- 3. Create new table with correct structure
CREATE TABLE public.dre_hitss (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto VARCHAR(255) NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    conta VARCHAR(255) NOT NULL,
    descricao TEXT,
    natureza VARCHAR(20) NOT NULL CHECK (natureza IN ('RECEITA', 'DESPESA')),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('OPERACIONAL', 'NAO_OPERACIONAL')),
    valor NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    observacoes TEXT,
    data_criacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usuario_criacao UUID,
    usuario_atualizacao UUID,
    ativo BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    tipo_conta VARCHAR(20) CHECK (tipo_conta IN ('Receita', 'Custo', 'Despesa')),
    receita_total NUMERIC(15,2) DEFAULT 0,
    custo_total NUMERIC(15,2) DEFAULT 0,
    desoneracao NUMERIC(15,2) DEFAULT 0,
    custo_clt NUMERIC(15,2) DEFAULT 0,
    custo_outros NUMERIC(15,2) DEFAULT 0,
    custo_subcontratados NUMERIC(15,2) DEFAULT 0
);

-- 4. Add table and column comments
COMMENT ON TABLE public.dre_hitss IS 'Tabela DRE HITSS com estrutura otimizada para Edge Functions e cache PostgREST';
COMMENT ON COLUMN public.dre_hitss.id IS 'Identificador único do registro';
COMMENT ON COLUMN public.dre_hitss.projeto IS 'Nome do projeto associado ao registro';
COMMENT ON COLUMN public.dre_hitss.ano IS 'Ano de referência do registro';
COMMENT ON COLUMN public.dre_hitss.mes IS 'Mês de referência do registro (1-12)';
COMMENT ON COLUMN public.dre_hitss.conta IS 'Código ou nome da conta contábil';
COMMENT ON COLUMN public.dre_hitss.descricao IS 'Descrição detalhada da conta';
COMMENT ON COLUMN public.dre_hitss.natureza IS 'Natureza da conta: RECEITA ou DESPESA';
COMMENT ON COLUMN public.dre_hitss.tipo IS 'Tipo da conta: OPERACIONAL ou NAO_OPERACIONAL';
COMMENT ON COLUMN public.dre_hitss.valor IS 'Valor monetário da conta';
COMMENT ON COLUMN public.dre_hitss.tipo_conta IS 'Tipo da conta: Receita, Custo ou Despesa';

-- 5. Create optimized indexes for performance
-- Primary indexes for common queries
CREATE INDEX idx_dre_hitss_projeto_ano_mes ON public.dre_hitss(projeto, ano, mes);
CREATE INDEX idx_dre_hitss_natureza ON public.dre_hitss(natureza);
CREATE INDEX idx_dre_hitss_tipo ON public.dre_hitss(tipo);
CREATE INDEX idx_dre_hitss_tipo_conta ON public.dre_hitss(tipo_conta);
CREATE INDEX idx_dre_hitss_ativo ON public.dre_hitss(ativo) WHERE ativo = true;

-- Composite indexes for complex queries
CREATE INDEX idx_dre_hitss_financial_composite ON public.dre_hitss(projeto, ano, mes, natureza, tipo) WHERE ativo = true;
CREATE INDEX idx_dre_hitss_valor_filter ON public.dre_hitss(valor) WHERE valor != 0;

-- Indexes for aggregation queries
CREATE INDEX idx_dre_hitss_aggregation ON public.dre_hitss(projeto, ano, natureza, valor) WHERE ativo = true;

-- 6. Enable Row Level Security
ALTER TABLE public.dre_hitss ENABLE ROW LEVEL SECURITY;

-- 7. Create optimized RLS policies
-- Drop any existing policies
DROP POLICY IF EXISTS "dre_hitss_select_policy" ON public.dre_hitss;
DROP POLICY IF EXISTS "dre_hitss_insert_policy" ON public.dre_hitss;
DROP POLICY IF EXISTS "dre_hitss_update_policy" ON public.dre_hitss;
DROP POLICY IF EXISTS "dre_hitss_delete_policy" ON public.dre_hitss;

-- Create new optimized policies
CREATE POLICY "dre_hitss_select_policy" ON public.dre_hitss
    FOR SELECT USING (ativo = true);

CREATE POLICY "dre_hitss_insert_policy" ON public.dre_hitss
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "dre_hitss_update_policy" ON public.dre_hitss
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "dre_hitss_delete_policy" ON public.dre_hitss
    FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Grant proper permissions
GRANT SELECT ON public.dre_hitss TO anon;
GRANT ALL PRIVILEGES ON public.dre_hitss TO authenticated;
GRANT ALL PRIVILEGES ON public.dre_hitss TO service_role;

-- 9. Create trigger for automatic updated_at
CREATE OR REPLACE FUNCTION update_dre_hitss_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dre_hitss_updated_at
    BEFORE UPDATE ON public.dre_hitss
    FOR EACH ROW
    EXECUTE FUNCTION update_dre_hitss_updated_at();

-- 10. Restore data from backup if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dre_hitss_backup' AND table_schema = 'public') THEN
        -- Insert data back with proper column mapping
        INSERT INTO public.dre_hitss (
            id, projeto, ano, mes, conta, descricao, natureza, tipo, valor,
            observacoes, data_criacao, data_atualizacao, usuario_criacao,
            usuario_atualizacao, ativo, metadata, tipo_conta, receita_total,
            custo_total, desoneracao, custo_clt, custo_outros, custo_subcontratados
        )
        SELECT 
            COALESCE(id, gen_random_uuid()),
            projeto, ano, mes, conta, descricao, natureza, tipo, valor,
            observacoes, data_criacao, data_atualizacao, usuario_criacao,
            usuario_atualizacao, COALESCE(ativo, true), COALESCE(metadata, '{}'),
            tipo_conta, COALESCE(receita_total, 0), COALESCE(custo_total, 0),
            COALESCE(desoneracao, 0), COALESCE(custo_clt, 0), 
            COALESCE(custo_outros, 0), COALESCE(custo_subcontratados, 0)
        FROM dre_hitss_backup;
        
        RAISE NOTICE 'Data restored: % rows inserted', (SELECT COUNT(*) FROM public.dre_hitss);
        
        -- Drop backup table
        DROP TABLE dre_hitss_backup;
    END IF;
END $$;

-- 11. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- 12. Update table statistics for query optimizer
ANALYZE public.dre_hitss;

-- Migration completed successfully
-- Note: Run VACUUM ANALYZE manually if needed for optimal performance
-- 2025-09-25: Ajustes de idempotência e rastreabilidade na dre_hitss
-- Objetivo: adicionar colunas de idempotência/trace e índices auxiliares

-- Colunas opcionais (adicionadas apenas se não existirem)
ALTER TABLE public.dre_hitss 
  ADD COLUMN IF NOT EXISTS execution_id TEXT,
  ADD COLUMN IF NOT EXISTS upload_batch_id UUID,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS row_hash TEXT,
  ADD COLUMN IF NOT EXISTS ano INT,
  ADD COLUMN IF NOT EXISTS mes INT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_dre_hitss_ano_mes ON public.dre_hitss(ano, mes);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_file_hash ON public.dre_hitss(file_hash);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_upload_batch ON public.dre_hitss(upload_batch_id);

-- Índice único para idempotência por linha
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_dre_hitss_row_hash_unique'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX idx_dre_hitss_row_hash_unique ON public.dre_hitss(row_hash)';
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.dre_hitss.execution_id IS 'Identificador da execução do pipeline';
COMMENT ON COLUMN public.dre_hitss.upload_batch_id IS 'Lote de upload (UUID) associado ao arquivo';
COMMENT ON COLUMN public.dre_hitss.file_name IS 'Nome do arquivo de origem no Storage';
COMMENT ON COLUMN public.dre_hitss.file_hash IS 'SHA-256 do arquivo fonte';
COMMENT ON COLUMN public.dre_hitss.row_hash IS 'Hash SHA-256 da linha normalizada para idempotência';
COMMENT ON COLUMN public.dre_hitss.ano IS 'Ano extraído do período da linha';
COMMENT ON COLUMN public.dre_hitss.mes IS 'Mês (1-12) extraído do período da linha';
-- 2025-09-25: Criação de dimensões DRE e tabela fato
-- Este script cria as tabelas dimensionais e a tabela fato utilizadas pela ETL dre-etl-dimensional

-- dim_projeto
CREATE TABLE IF NOT EXISTS public.dim_projeto (
  id_projeto BIGSERIAL PRIMARY KEY,
  codigo_projeto TEXT NOT NULL,
  nome_projeto TEXT NOT NULL,
  tipo_negocio TEXT,
  linha_negocio TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dim_projeto_codigo ON public.dim_projeto(codigo_projeto);

-- dim_cliente
CREATE TABLE IF NOT EXISTS public.dim_cliente (
  id_cliente BIGSERIAL PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  tipo_cliente TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dim_cliente_nome ON public.dim_cliente(nome_cliente);

-- dim_conta
CREATE TABLE IF NOT EXISTS public.dim_conta (
  id_conta BIGSERIAL PRIMARY KEY,
  conta_resumo TEXT NOT NULL,
  denominacao_conta TEXT,
  natureza TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dim_conta_conta_denominacao ON public.dim_conta(conta_resumo, denominacao_conta);
CREATE INDEX IF NOT EXISTS ix_dim_conta_natureza ON public.dim_conta(natureza);

-- dim_periodo
CREATE TABLE IF NOT EXISTS public.dim_periodo (
  id_periodo BIGSERIAL PRIMARY KEY,
  periodo_original TEXT NOT NULL,
  ano INT NOT NULL,
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  trimestre INT NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
  semestre INT NOT NULL CHECK (semestre IN (1,2)),
  nome_mes TEXT NOT NULL,
  nome_trimestre TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dim_periodo_original ON public.dim_periodo(periodo_original);
CREATE INDEX IF NOT EXISTS ix_dim_periodo_ano_mes ON public.dim_periodo(ano, mes);

-- dim_recurso
CREATE TABLE IF NOT EXISTS public.dim_recurso (
  id_recurso BIGSERIAL PRIMARY KEY,
  nome_recurso TEXT NOT NULL,
  tipo_recurso TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dim_recurso_nome ON public.dim_recurso(nome_recurso);

-- fact_dre_lancamentos
CREATE TABLE IF NOT EXISTS public.fact_dre_lancamentos (
  id_lancamento BIGSERIAL PRIMARY KEY,
  id_projeto BIGINT NOT NULL REFERENCES public.dim_projeto(id_projeto) ON DELETE RESTRICT,
  id_cliente BIGINT NOT NULL REFERENCES public.dim_cliente(id_cliente) ON DELETE RESTRICT,
  id_conta BIGINT NOT NULL REFERENCES public.dim_conta(id_conta) ON DELETE RESTRICT,
  id_periodo BIGINT NOT NULL REFERENCES public.dim_periodo(id_periodo) ON DELETE RESTRICT,
  id_recurso BIGINT REFERENCES public.dim_recurso(id_recurso) ON DELETE SET NULL,
  valor_lancamento NUMERIC(18,2) NOT NULL,
  relatorio_origem TEXT,
  hash_linha TEXT NOT NULL,
  data_processamento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_fact_dre_hash ON public.fact_dre_lancamentos(hash_linha);
CREATE INDEX IF NOT EXISTS ix_fact_dre_ids ON public.fact_dre_lancamentos(id_projeto, id_cliente, id_conta, id_periodo);
CREATE INDEX IF NOT EXISTS ix_fact_dre_periodo ON public.fact_dre_lancamentos(id_periodo);
CREATE INDEX IF NOT EXISTS ix_fact_dre_ativo ON public.fact_dre_lancamentos(ativo);

-- Comentários
COMMENT ON TABLE public.dim_projeto IS 'Dimensão de Projetos';
COMMENT ON TABLE public.dim_cliente IS 'Dimensão de Clientes';
COMMENT ON TABLE public.dim_conta IS 'Dimensão de Contas (resumo, denominação, natureza)';
COMMENT ON TABLE public.dim_periodo IS 'Dimensão de Período (Mês/Ano e atributos derivados)';
COMMENT ON TABLE public.dim_recurso IS 'Dimensão de Recursos (pessoas, subcontratos etc.)';
COMMENT ON TABLE public.fact_dre_lancamentos IS 'Fato de lançamentos DRE com chaves dimensionais';
-- 2025-09-25: Staging DRE e bucket de Storage dre_reports

-- Tabela de staging para manter linha a linha do Excel
CREATE TABLE IF NOT EXISTS public.stg_dre_hitss_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  row_number INT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (file_hash, row_number)
);

COMMENT ON TABLE public.stg_dre_hitss_raw IS 'Staging row-by-row do Excel HITSS';
COMMENT ON COLUMN public.stg_dre_hitss_raw.payload IS 'Linha bruta do Excel normalizada em JSON';

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS ix_stg_dre_execution_id ON public.stg_dre_hitss_raw(execution_id);
CREATE INDEX IF NOT EXISTS ix_stg_dre_file_hash ON public.stg_dre_hitss_raw(file_hash);

-- Criar bucket de Storage para recepção de arquivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('dre_reports', 'dre_reports', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Políticas básicas (leitura autenticada, gravação via service_role)
DROP POLICY IF EXISTS "dre_reports_select_authenticated" ON storage.objects;
CREATE POLICY "dre_reports_select_authenticated"
ON storage.objects FOR SELECT TO authenticated, service_role
USING (bucket_id = 'dre_reports');

DROP POLICY IF EXISTS "dre_reports_insert_service_role" ON storage.objects;
CREATE POLICY "dre_reports_insert_service_role"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'dre_reports');

DROP POLICY IF EXISTS "dre_reports_update_service_role" ON storage.objects;
CREATE POLICY "dre_reports_update_service_role"
ON storage.objects FOR UPDATE TO service_role
USING (bucket_id = 'dre_reports')
WITH CHECK (bucket_id = 'dre_reports');

DROP POLICY IF EXISTS "dre_reports_delete_service_role" ON storage.objects;
CREATE POLICY "dre_reports_delete_service_role"
ON storage.objects FOR DELETE TO service_role
USING (bucket_id = 'dre_reports');
-- 2025-09-25: Views analíticas e RPCs utilitárias

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_graphql;

-- Garantir recriação limpa das views para evitar conflitos de colunas/dependências
DROP VIEW IF EXISTS public.vw_dre_receita_custo_projeto CASCADE;
DROP VIEW IF EXISTS public.vw_dre_por_cliente_natureza CASCADE;

-- View: vw_dre_receita_custo_projeto
CREATE OR REPLACE VIEW public.vw_dre_receita_custo_projeto AS
SELECT 
  per.ano,
  per.mes,
  p.codigo_projeto,
  p.nome_projeto,
  p.tipo_negocio,
  cl.nome_cliente,
  SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) AS total_receita,
  SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) AS total_custo,
  SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE -f.valor_lancamento END) AS margem_bruta
FROM public.fact_dre_lancamentos f
JOIN public.dim_periodo per ON per.id_periodo = f.id_periodo
JOIN public.dim_conta c ON c.id_conta = f.id_conta
JOIN public.dim_projeto p ON p.id_projeto = f.id_projeto
LEFT JOIN public.dim_cliente cl ON cl.id_cliente = f.id_cliente
WHERE f.ativo = TRUE
GROUP BY per.ano, per.mes, p.codigo_projeto, p.nome_projeto, p.tipo_negocio, cl.nome_cliente;

COMMENT ON VIEW public.vw_dre_receita_custo_projeto IS 'Receita, custo e margem por projeto e período';

-- View: vw_dre_por_cliente_natureza
CREATE OR REPLACE VIEW public.vw_dre_por_cliente_natureza AS
SELECT 
  per.ano,
  per.mes,
  cl.nome_cliente,
  c.natureza,
  SUM(f.valor_lancamento) AS total_valor
FROM public.fact_dre_lancamentos f
JOIN public.dim_periodo per ON per.id_periodo = f.id_periodo
JOIN public.dim_conta c ON c.id_conta = f.id_conta
LEFT JOIN public.dim_cliente cl ON cl.id_cliente = f.id_cliente
WHERE f.ativo = TRUE
GROUP BY per.ano, per.mes, cl.nome_cliente, c.natureza;

COMMENT ON VIEW public.vw_dre_por_cliente_natureza IS 'Totais por cliente e natureza ao longo do tempo';

-- RPC: execute_sql (retorna linhas como jsonb)
CREATE OR REPLACE FUNCTION public.execute_sql(query TEXT)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT to_jsonb(t) FROM (%s) t', query);
END;
$$;

REVOKE ALL ON FUNCTION public.execute_sql(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO anon, authenticated, service_role;

-- RPC: calcular_margem_projeto
CREATE OR REPLACE FUNCTION public.calcular_margem_projeto(
  p_codigo_projeto TEXT,
  p_ano INT DEFAULT NULL,
  p_mes INT DEFAULT NULL
)
RETURNS TABLE(
  ano INT,
  mes INT,
  receita NUMERIC,
  custo NUMERIC,
  margem NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    per.ano,
    per.mes,
    SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) AS receita,
    SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) AS custo,
    SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE -f.valor_lancamento END) AS margem
  FROM public.fact_dre_lancamentos f
  JOIN public.dim_periodo per ON per.id_periodo = f.id_periodo
  JOIN public.dim_conta c ON c.id_conta = f.id_conta
  JOIN public.dim_projeto p ON p.id_projeto = f.id_projeto
  WHERE f.ativo = TRUE
    AND p.codigo_projeto = p_codigo_projeto
    AND (p_ano IS NULL OR per.ano = p_ano)
    AND (p_mes IS NULL OR per.mes = p_mes)
  GROUP BY per.ano, per.mes
  ORDER BY per.ano, per.mes;
END;
$$;

REVOKE ALL ON FUNCTION public.calcular_margem_projeto(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calcular_margem_projeto(TEXT, INT, INT) TO anon, authenticated, service_role;
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
-- Adicionar campo 'ativo' à tabela profissionais para exclusão lógica
-- Este campo permitirá marcar profissionais como inativos em vez de deletá-los fisicamente

ALTER TABLE public.profissionais 
ADD COLUMN ativo BOOLEAN DEFAULT true;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.profissionais.ativo IS 'Indica se o profissional está ativo no sistema (exclusão lógica)';

-- Criar índice para melhorar performance nas consultas por profissionais ativos
CREATE INDEX idx_profissionais_ativo ON public.profissionais(ativo);

-- Atualizar todos os registros existentes para serem ativos por padrão
UPDATE public.profissionais SET ativo = true WHERE ativo IS NULL;
-- Adicionar campo projeto_id na tabela colaboradores
ALTER TABLE colaboradores 
ADD COLUMN projeto_id bigint REFERENCES projetos(id);

-- Adicionar índice para melhor performance
CREATE INDEX idx_colaboradores_projeto_id ON colaboradores(projeto_id);

-- Comentário para documentar o campo
COMMENT ON COLUMN colaboradores.projeto_id IS 'ID do projeto ao qual o colaborador está vinculado';
-- Criar tabela para logs de execução do DRE
CREATE TABLE IF NOT EXISTS public.dre_execution_logs (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL,
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dre_execution_logs_execution_id ON public.dre_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_dre_execution_logs_step ON public.dre_execution_logs(step);
CREATE INDEX IF NOT EXISTS idx_dre_execution_logs_created_at ON public.dre_execution_logs(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.dre_execution_logs ENABLE ROW LEVEL SECURITY;

-- Conceder permissões para roles anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dre_execution_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dre_execution_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.dre_execution_logs_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.dre_execution_logs_id_seq TO authenticated;

-- Política RLS para permitir acesso completo (pode ser refinada conforme necessário)
CREATE POLICY "Allow all operations on dre_execution_logs" ON public.dre_execution_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.dre_execution_logs IS 'Tabela para armazenar logs de execução do fluxo DRE';
COMMENT ON COLUMN public.dre_execution_logs.execution_id IS 'ID único da execução do fluxo';
COMMENT ON COLUMN public.dre_execution_logs.step IS 'Nome da etapa sendo executada';
COMMENT ON COLUMN public.dre_execution_logs.status IS 'Status da etapa (INICIADO, SUCESSO, ERRO, etc.)';
COMMENT ON COLUMN public.dre_execution_logs.message IS 'Mensagem detalhada sobre a execução da etapa';
-- Criação das tabelas DRE necessárias

-- Tabela de categorias DRE
CREATE TABLE IF NOT EXISTS public.dre_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('receita', 'despesa')),
    parent_id UUID REFERENCES public.dre_categories(id),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relatórios DRE
CREATE TABLE IF NOT EXISTS public.dre_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens DRE
CREATE TABLE IF NOT EXISTS public.dre_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.dre_reports(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.dre_categories(id),
    description VARCHAR(500),
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dre_categories_type ON public.dre_categories(type);
CREATE INDEX IF NOT EXISTS idx_dre_categories_parent ON public.dre_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_dre_reports_period ON public.dre_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_dre_reports_status ON public.dre_reports(status);
CREATE INDEX IF NOT EXISTS idx_dre_items_report ON public.dre_items(report_id);
CREATE INDEX IF NOT EXISTS idx_dre_items_category ON public.dre_items(category_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.dre_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver categorias DRE" ON public.dre_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar categorias DRE" ON public.dre_categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver relatórios DRE" ON public.dre_reports
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar relatórios DRE" ON public.dre_reports
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver itens DRE" ON public.dre_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar itens DRE" ON public.dre_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Conceder permissões aos roles
GRANT SELECT ON public.dre_categories TO anon;
GRANT ALL PRIVILEGES ON public.dre_categories TO authenticated;

GRANT SELECT ON public.dre_reports TO anon;
GRANT ALL PRIVILEGES ON public.dre_reports TO authenticated;

GRANT SELECT ON public.dre_items TO anon;
GRANT ALL PRIVILEGES ON public.dre_items TO authenticated;

-- Inserir categorias padrão
INSERT INTO public.dre_categories (name, type, order_index) VALUES
('Receita Operacional', 'receita', 1),
('Receita de Vendas', 'receita', 2),
('Receita de Serviços', 'receita', 3),
('Custo dos Produtos Vendidos', 'despesa', 4),
('Custo dos Serviços Prestados', 'despesa', 5),
('Despesas Operacionais', 'despesa', 6),
('Despesas Administrativas', 'despesa', 7),
('Despesas Comerciais', 'despesa', 8),
('Despesas Financeiras', 'despesa', 9),
('Receitas Financeiras', 'receita', 10)
ON CONFLICT DO NOTHING;
-- Configurar permissões para as tabelas de automação
-- Permitir acesso de leitura para usuários anônimos e autenticados

-- Conceder permissões básicas para as tabelas
GRANT SELECT ON hitss_automation_executions TO anon;
GRANT SELECT ON hitss_automation_executions TO authenticated;
GRANT SELECT ON hitss_automation_logs TO anon;
GRANT SELECT ON hitss_automation_logs TO authenticated;

-- Criar políticas RLS para permitir leitura pública das execuções
CREATE POLICY "Allow public read access to automation executions" ON hitss_automation_executions
    FOR SELECT USING (true);

-- Criar políticas RLS para permitir leitura pública dos logs
CREATE POLICY "Allow public read access to automation logs" ON hitss_automation_logs
    FOR SELECT USING (true);

-- Verificar se RLS está habilitado (já está, mas confirmando)
ALTER TABLE hitss_automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitss_automation_logs ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON POLICY "Allow public read access to automation executions" ON hitss_automation_executions IS 'Permite leitura pública das execuções de automação para monitoramento';
COMMENT ON POLICY "Allow public read access to automation logs" ON hitss_automation_logs IS 'Permite leitura pública dos logs de automação para diagnóstico';
-- Configurar permissões para a tabela dre_hitss
-- Este script garante que a role anon possa acessar os dados da tabela

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'dre_hitss'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Conceder permissões de leitura para a role anon
GRANT SELECT ON dre_hitss TO anon;

-- Conceder todas as permissões para a role authenticated
GRANT ALL PRIVILEGES ON dre_hitss TO authenticated;

-- Criar política RLS para permitir leitura de todos os registros ativos
DROP POLICY IF EXISTS "Allow read access to active dre_hitss records" ON dre_hitss;

CREATE POLICY "Allow read access to active dre_hitss records"
  ON dre_hitss
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- Criar política RLS para permitir leitura de todos os registros para usuários autenticados
DROP POLICY IF EXISTS "Allow full read access to authenticated users" ON dre_hitss;

CREATE POLICY "Allow full read access to authenticated users"
  ON dre_hitss
  FOR SELECT
  TO authenticated
  USING (true);

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'dre_hitss';

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'dre_hitss';

-- Verificar permissões após a configuração
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'dre_hitss'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;
-- Migração para corrigir estrutura da tabela dre_hitss
-- Versão simplificada para evitar conflitos

-- 1. Remover todos os triggers e funções conflitantes
DROP TRIGGER IF EXISTS trigger_calculate_dre_aggregates ON dre_hitss;
DROP TRIGGER IF EXISTS set_updated_at ON dre_hitss;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_dre_aggregates() CASCADE;

-- 2. Adicionar campos necessários para compatibilidade
ALTER TABLE dre_hitss 
ADD COLUMN IF NOT EXISTS tipo_conta VARCHAR(50),
ADD COLUMN IF NOT EXISTS receita_total DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_total DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS desoneracao DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_clt DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_outros DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_subcontratados DECIMAL(15,2) DEFAULT 0;

-- 3. Atualizar campo tipo_conta baseado no campo tipo existente
UPDATE dre_hitss 
SET tipo_conta = CASE 
    WHEN tipo = 'receita' THEN 'Receita'
    WHEN tipo = 'despesa' AND natureza = 'CUSTO' THEN 'Custo'
    WHEN tipo = 'despesa' AND natureza = 'RECEITA' THEN 'Despesa'
    ELSE 'Despesa'
END
WHERE tipo_conta IS NULL;

-- 4. Criar índices otimizados para performance
CREATE INDEX IF NOT EXISTS idx_dre_hitss_projeto_ano_mes ON dre_hitss(projeto, ano, mes);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_tipo_conta ON dre_hitss(tipo_conta);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_ativo ON dre_hitss(ativo);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_natureza ON dre_hitss(natureza);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_tipo ON dre_hitss(tipo);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_data_criacao ON dre_hitss(data_criacao);

-- 5. Criar índice composto para queries complexas
CREATE INDEX IF NOT EXISTS idx_dre_hitss_composite ON dre_hitss(projeto, ano, mes, tipo_conta, ativo);

-- 6. Atualizar constraints para o novo campo tipo_conta
ALTER TABLE dre_hitss 
DROP CONSTRAINT IF EXISTS chk_tipo_conta,
ADD CONSTRAINT chk_tipo_conta CHECK (tipo_conta IN ('Receita', 'Custo', 'Despesa'));

-- 7. Atualizar RLS policies para melhor performance
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON dre_hitss;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON dre_hitss;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON dre_hitss;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON dre_hitss;
DROP POLICY IF EXISTS "dre_hitss_select_policy" ON dre_hitss;
DROP POLICY IF EXISTS "dre_hitss_insert_policy" ON dre_hitss;
DROP POLICY IF EXISTS "dre_hitss_update_policy" ON dre_hitss;
DROP POLICY IF EXISTS "dre_hitss_delete_policy" ON dre_hitss;

-- Políticas RLS otimizadas
CREATE POLICY "dre_hitss_select_policy" ON dre_hitss
    FOR SELECT USING (ativo = true);

CREATE POLICY "dre_hitss_insert_policy" ON dre_hitss
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "dre_hitss_update_policy" ON dre_hitss
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "dre_hitss_delete_policy" ON dre_hitss
    FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Garantir permissões para roles anon e authenticated
GRANT SELECT ON dre_hitss TO anon;
GRANT ALL PRIVILEGES ON dre_hitss TO authenticated;

-- 9. Forçar refresh do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 10. Comentários para documentação
COMMENT ON COLUMN dre_hitss.tipo_conta IS 'Tipo da conta: Receita, Custo ou Despesa (calculado automaticamente)';
COMMENT ON COLUMN dre_hitss.receita_total IS 'Total de receitas agregadas';
COMMENT ON COLUMN dre_hitss.custo_total IS 'Total de custos agregados';
COMMENT ON COLUMN dre_hitss.desoneracao IS 'Valor de desoneração';
COMMENT ON COLUMN dre_hitss.custo_clt IS 'Custo específico de CLT';
COMMENT ON COLUMN dre_hitss.custo_outros IS 'Outros custos';
COMMENT ON COLUMN dre_hitss.custo_subcontratados IS 'Custos de subcontratados';

-- Comentário final
COMMENT ON TABLE dre_hitss IS 'Tabela DRE HITSS com estrutura corrigida e otimizada para Edge Functions';

-- 11. Atualizar estatísticas da tabela para otimização do query planner
ANALYZE dre_hitss;
