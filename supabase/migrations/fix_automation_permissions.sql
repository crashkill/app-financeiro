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