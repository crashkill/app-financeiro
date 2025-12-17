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

-- Log da migração (removed schema_migrations)
