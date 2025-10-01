-- Criar tabela para armazenar dados dos projetos HITSS
CREATE TABLE IF NOT EXISTS hitss_projetos (
  id SERIAL PRIMARY KEY,
  projeto TEXT,
  cliente TEXT,
  responsavel TEXT,
  status TEXT,
  data_inicio DATE,
  data_fim DATE,
  valor DECIMAL(15,2),
  categoria TEXT,
  tipo TEXT,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_hitss_projetos_cliente ON hitss_projetos(cliente);
CREATE INDEX IF NOT EXISTS idx_hitss_projetos_responsavel ON hitss_projetos(responsavel);
CREATE INDEX IF NOT EXISTS idx_hitss_projetos_status ON hitss_projetos(status);
CREATE INDEX IF NOT EXISTS idx_hitss_projetos_data_inicio ON hitss_projetos(data_inicio);

-- Habilitar RLS (Row Level Security)
ALTER TABLE hitss_projetos ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso completo ao service role
CREATE POLICY "Service role can manage hitss_projetos" ON hitss_projetos
  FOR ALL USING (auth.role() = 'service_role');

-- Criar política para usuários autenticados lerem dados
CREATE POLICY "Authenticated users can read hitss_projetos" ON hitss_projetos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE hitss_projetos IS 'Tabela para armazenar dados dos projetos importados do sistema HITSS';
COMMENT ON COLUMN hitss_projetos.projeto IS 'Nome do projeto';
COMMENT ON COLUMN hitss_projetos.cliente IS 'Nome do cliente';
COMMENT ON COLUMN hitss_projetos.responsavel IS 'Responsável pelo projeto';
COMMENT ON COLUMN hitss_projetos.status IS 'Status atual do projeto';
COMMENT ON COLUMN hitss_projetos.data_inicio IS 'Data de início do projeto';
COMMENT ON COLUMN hitss_projetos.data_fim IS 'Data de fim do projeto';
COMMENT ON COLUMN hitss_projetos.valor IS 'Valor do projeto';
COMMENT ON COLUMN hitss_projetos.categoria IS 'Categoria do projeto';
COMMENT ON COLUMN hitss_projetos.tipo IS 'Tipo do projeto';
COMMENT ON COLUMN hitss_projetos.descricao IS 'Descrição detalhada do projeto';