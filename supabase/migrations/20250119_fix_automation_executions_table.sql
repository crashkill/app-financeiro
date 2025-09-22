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