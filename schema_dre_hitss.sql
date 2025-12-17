-- =====================================================
-- CRIAÇÃO SIMPLIFICADA: Tabela DRE HITSS
-- =====================================================

-- 1. Criar tabela principal
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

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_dre_hitss_execution_id ON public.dre_hitss(execution_id);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_periodo ON public.dre_hitss(periodo);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_empresa_periodo ON public.dre_hitss(empresa, periodo);

-- 3. Habilitar Segurança (RLS)
ALTER TABLE public.dre_hitss ENABLE ROW LEVEL SECURITY;

-- 4. Permissões básicas
-- Acesso total para Service Role (para nossos scripts)
CREATE POLICY "Service role acesso total" ON public.dre_hitss
    FOR ALL USING (auth.role() = 'service_role');

-- Conceder permissões
GRANT ALL ON public.dre_hitss TO service_role;
GRANT SELECT ON public.dre_hitss TO anon;
GRANT ALL ON public.dre_hitss TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE public.dre_hitss_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.dre_hitss_id_seq TO authenticated;
