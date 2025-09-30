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
INSERT INTO public.schema_migrations (version, applied_at) 
VALUES ('002_create_automation_executions_table', NOW())
ON CONFLICT (version) DO NOTHING;