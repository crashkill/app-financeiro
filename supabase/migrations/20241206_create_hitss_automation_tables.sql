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
  level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
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