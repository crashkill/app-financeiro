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