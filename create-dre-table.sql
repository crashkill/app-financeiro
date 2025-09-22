-- Script para criar a tabela dre_hitss no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar a tabela dre_hitss
CREATE TABLE IF NOT EXISTS public.dre_hitss (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto VARCHAR(255) NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    conta VARCHAR(255) NOT NULL,
    descricao TEXT,
    natureza VARCHAR(50) NOT NULL CHECK (natureza IN ('RECEITA', 'DESPESA')),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('OPERACIONAL', 'NAO_OPERACIONAL')),
    valor DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_criacao UUID,
    usuario_atualizacao UUID,
    ativo BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
) TABLESPACE pg_default;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dre_hitss_projeto ON public.dre_hitss USING btree (projeto);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_ano_mes ON public.dre_hitss USING btree (ano, mes);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_natureza ON public.dre_hitss USING btree (natureza);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_tipo ON public.dre_hitss USING btree (tipo);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_conta ON public.dre_hitss USING btree (conta);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_data_criacao ON public.dre_hitss USING btree (data_criacao);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_ativo ON public.dre_hitss USING btree (ativo);

-- Criar trigger para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dre_hitss_updated_at
    BEFORE UPDATE ON public.dre_hitss
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar comentários à tabela e colunas
COMMENT ON TABLE public.dre_hitss IS 'Tabela para armazenar dados de DRE (Demonstração do Resultado do Exercício) da HITSS';
COMMENT ON COLUMN public.dre_hitss.id IS 'Identificador único do registro';
COMMENT ON COLUMN public.dre_hitss.projeto IS 'Nome do projeto associado ao registro';
COMMENT ON COLUMN public.dre_hitss.ano IS 'Ano de referência do registro';
COMMENT ON COLUMN public.dre_hitss.mes IS 'Mês de referência do registro (1-12)';
COMMENT ON COLUMN public.dre_hitss.conta IS 'Código ou nome da conta contábil';
COMMENT ON COLUMN public.dre_hitss.descricao IS 'Descrição detalhada da conta';
COMMENT ON COLUMN public.dre_hitss.natureza IS 'Natureza da conta: RECEITA ou DESPESA';
COMMENT ON COLUMN public.dre_hitss.tipo IS 'Tipo da conta: OPERACIONAL ou NAO_OPERACIONAL';
COMMENT ON COLUMN public.dre_hitss.valor IS 'Valor monetário da conta';
COMMENT ON COLUMN public.dre_hitss.observacoes IS 'Observações adicionais sobre o registro';
COMMENT ON COLUMN public.dre_hitss.data_criacao IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.dre_hitss.data_atualizacao IS 'Data e hora da última atualização do registro';
COMMENT ON COLUMN public.dre_hitss.usuario_criacao IS 'ID do usuário que criou o registro';
COMMENT ON COLUMN public.dre_hitss.usuario_atualizacao IS 'ID do usuário que fez a última atualização';
COMMENT ON COLUMN public.dre_hitss.ativo IS 'Indica se o registro está ativo';
COMMENT ON COLUMN public.dre_hitss.metadata IS 'Dados adicionais em formato JSON';

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.dre_hitss ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas de acesso
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.dre_hitss
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção para usuários autenticados" ON public.dre_hitss
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização para usuários autenticados" ON public.dre_hitss
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão para usuários autenticados" ON public.dre_hitss
    FOR DELETE USING (auth.role() = 'authenticated');

-- Verificar se a tabela foi criada com sucesso
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_name = 'dre_hitss' AND table_schema = 'public';

-- Verificar as colunas da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dre_hitss' AND table_schema = 'public'
ORDER BY ordinal_position;