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