-- Módulo Profissionais - Schema SQL
-- Criado em: 2026-01-05
-- Descrição: Tabelas para armazenar dados de profissionais do HOST GlobalHitss

-- =====================================================
-- TABELA: profissionais
-- Descrição: Dados cadastrais dos profissionais
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_recurso TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  cargo TEXT,
  gerente TEXT,
  gerente_area TEXT,
  lider_responsavel TEXT,
  companhia TEXT,
  unidade_negocio TEXT,
  centro_custo TEXT,
  status TEXT CHECK (status IN ('ATIVO', 'INATIVO', 'DISPONIVEL', 'FERIAS', 'AFASTADO')),
  data_admissao DATE,
  data_desligamento DATE,
  projeto_atual TEXT,
  projeto_atual_id TEXT,
  horas_mes NUMERIC(10,2) DEFAULT 0,
  custo_hora NUMERIC(10,2),
  tipo_contrato TEXT,
  metadata JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profissionais_nome ON public.profissionais(nome);
CREATE INDEX IF NOT EXISTS idx_profissionais_status ON public.profissionais(status);
CREATE INDEX IF NOT EXISTS idx_profissionais_projeto ON public.profissionais(projeto_atual);
CREATE INDEX IF NOT EXISTS idx_profissionais_gerente ON public.profissionais(gerente);
CREATE INDEX IF NOT EXISTS idx_profissionais_companhia ON public.profissionais(companhia);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_profissionais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profissionais_updated_at ON public.profissionais;
CREATE TRIGGER trigger_profissionais_updated_at
  BEFORE UPDATE ON public.profissionais
  FOR EACH ROW
  EXECUTE FUNCTION update_profissionais_updated_at();

-- =====================================================
-- TABELA: profissionais_projetos
-- Descrição: Histórico de alocações em projetos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profissionais_projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  projeto_id TEXT NOT NULL,
  projeto_nome TEXT,
  cliente TEXT,
  data_inicio DATE,
  data_fim DATE,
  horas_alocadas NUMERIC(10,2) DEFAULT 0,
  percentual_alocacao NUMERIC(5,2) DEFAULT 100,
  papel TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prof_proj_profissional ON public.profissionais_projetos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_prof_proj_projeto ON public.profissionais_projetos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_prof_proj_ativo ON public.profissionais_projetos(ativo);

-- =====================================================
-- TABELA: host_sync_logs
-- Descrição: Logs de sincronização com HOST GlobalHitss
-- =====================================================
CREATE TABLE IF NOT EXISTS public.host_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  report_name TEXT,
  ano INT,
  mes INT,
  status TEXT NOT NULL CHECK (status IN ('INICIADO', 'PROCESSANDO', 'SUCESSO', 'ERRO', 'PARCIAL')),
  records_processed INT DEFAULT 0,
  records_inserted INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_skipped INT DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  file_name TEXT,
  file_size_bytes INT,
  file_hash TEXT,
  execution_time_ms INT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para consulta por data
CREATE INDEX IF NOT EXISTS idx_host_sync_created ON public.host_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_host_sync_status ON public.host_sync_logs(status);

-- =====================================================
-- VIEW: v_profissionais_resumo
-- Descrição: Resumo estatístico de profissionais
-- =====================================================
CREATE OR REPLACE VIEW public.v_profissionais_resumo AS
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'ATIVO') as ativos,
  COUNT(*) FILTER (WHERE status = 'DISPONIVEL') as disponiveis,
  COUNT(*) FILTER (WHERE status = 'INATIVO') as inativos,
  COUNT(*) FILTER (WHERE status = 'FERIAS') as ferias,
  COUNT(*) FILTER (WHERE status = 'AFASTADO') as afastados,
  COUNT(DISTINCT projeto_atual) as projetos_ativos,
  COUNT(DISTINCT companhia) as companhias,
  COALESCE(SUM(horas_mes), 0) as total_horas_mes
FROM public.profissionais;

-- =====================================================
-- VIEW: v_profissionais_por_projeto
-- Descrição: Contagem de profissionais por projeto
-- =====================================================
CREATE OR REPLACE VIEW public.v_profissionais_por_projeto AS
SELECT 
  projeto_atual as projeto,
  COUNT(*) as total_profissionais,
  SUM(horas_mes) as total_horas
FROM public.profissionais
WHERE projeto_atual IS NOT NULL AND status = 'ATIVO'
GROUP BY projeto_atual
ORDER BY total_profissionais DESC;

-- =====================================================
-- VIEW: v_profissionais_por_gerente
-- Descrição: Contagem de profissionais por gerente
-- =====================================================
CREATE OR REPLACE VIEW public.v_profissionais_por_gerente AS
SELECT 
  gerente,
  COUNT(*) as total_profissionais,
  COUNT(*) FILTER (WHERE status = 'ATIVO') as ativos,
  COUNT(*) FILTER (WHERE status = 'DISPONIVEL') as disponiveis
FROM public.profissionais
WHERE gerente IS NOT NULL
GROUP BY gerente
ORDER BY total_profissionais DESC;

-- =====================================================
-- RLS: Row Level Security
-- =====================================================
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_sync_logs ENABLE ROW LEVEL SECURITY;

-- Política de leitura para usuários autenticados
CREATE POLICY "Allow read for authenticated users" ON public.profissionais
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read for authenticated users" ON public.profissionais_projetos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read for authenticated users" ON public.host_sync_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de escrita apenas para service_role
CREATE POLICY "Allow insert for service_role" ON public.profissionais
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow update for service_role" ON public.profissionais
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Allow insert for service_role" ON public.profissionais_projetos
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow insert for service_role" ON public.host_sync_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================
COMMENT ON TABLE public.profissionais IS 'Dados de profissionais sincronizados do HOST GlobalHitss';
COMMENT ON TABLE public.profissionais_projetos IS 'Histórico de alocações de profissionais em projetos';
COMMENT ON TABLE public.host_sync_logs IS 'Logs de sincronização com o sistema HOST GlobalHitss';

COMMENT ON COLUMN public.profissionais.id_recurso IS 'ID único do recurso no HOST GlobalHitss';
COMMENT ON COLUMN public.profissionais.last_sync_at IS 'Data/hora da última sincronização deste registro';
