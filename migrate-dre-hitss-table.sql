-- Migração da estrutura da tabela dre_hitss para o projeto HITSS
-- Baseado na documentação em ESTRUTURA-TABELA-DRE-HITSS.md

-- Criar a tabela dre_hitss com a estrutura completa
CREATE TABLE IF NOT EXISTS dre_hitss (
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

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dre_hitss_execution_id ON dre_hitss(execution_id);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_empresa ON dre_hitss(empresa);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_periodo ON dre_hitss(periodo);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_created_at ON dre_hitss(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE dre_hitss ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso completo ao service role
CREATE POLICY "Service role can manage dre_hitss" ON dre_hitss
  FOR ALL USING (auth.role() = 'service_role');

-- Criar política para usuários autenticados lerem dados
CREATE POLICY "Authenticated users can read dre_hitss" ON dre_hitss
  FOR SELECT USING (auth.role() = 'authenticated');

-- Criar política para usuários autenticados inserirem dados
CREATE POLICY "Authenticated users can insert dre_hitss" ON dre_hitss
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE dre_hitss IS 'Tabela para armazenar dados do DRE processados pelo sistema HITSS';
COMMENT ON COLUMN dre_hitss.execution_id IS 'ID único da execução do processamento';
COMMENT ON COLUMN dre_hitss.conta IS 'Código da conta contábil';
COMMENT ON COLUMN dre_hitss.descricao IS 'Descrição da conta contábil';
COMMENT ON COLUMN dre_hitss.valor IS 'Valor monetário da conta';
COMMENT ON COLUMN dre_hitss.tipo IS 'Tipo da conta (RECEITA, DESPESA, etc.)';
COMMENT ON COLUMN dre_hitss.periodo IS 'Período de referência dos dados';
COMMENT ON COLUMN dre_hitss.empresa IS 'Nome da empresa';

-- Verificar se a tabela foi criada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'dre_hitss' 
  AND table_schema = 'public'
ORDER BY ordinal_position;