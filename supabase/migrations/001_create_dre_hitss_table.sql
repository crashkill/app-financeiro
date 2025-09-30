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
INSERT INTO public.schema_migrations (version, applied_at) 
VALUES ('001_create_dre_hitss_table', NOW())
ON CONFLICT (version) DO NOTHING;