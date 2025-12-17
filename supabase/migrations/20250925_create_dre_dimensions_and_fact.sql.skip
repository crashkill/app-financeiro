-- 2025-09-25: Criação de dimensões DRE e tabela fato
-- Este script cria as tabelas dimensionais e a tabela fato utilizadas pela ETL dre-etl-dimensional

-- dim_projeto
CREATE TABLE IF NOT EXISTS public.dim_projeto (
  id_projeto BIGSERIAL PRIMARY KEY,
  codigo_projeto TEXT NOT NULL,
  nome_projeto TEXT NOT NULL,
  tipo_negocio TEXT,
  linha_negocio TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dim_projeto_codigo ON public.dim_projeto(codigo_projeto);

-- dim_cliente
CREATE TABLE IF NOT EXISTS public.dim_cliente (
  id_cliente BIGSERIAL PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  tipo_cliente TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dim_cliente_nome ON public.dim_cliente(nome_cliente);

-- dim_conta
CREATE TABLE IF NOT EXISTS public.dim_conta (
  id_conta BIGSERIAL PRIMARY KEY,
  conta_resumo TEXT NOT NULL,
  denominacao_conta TEXT,
  natureza TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dim_conta_conta_denominacao ON public.dim_conta(conta_resumo, denominacao_conta);
CREATE INDEX IF NOT EXISTS ix_dim_conta_natureza ON public.dim_conta(natureza);

-- dim_periodo
CREATE TABLE IF NOT EXISTS public.dim_periodo (
  id_periodo BIGSERIAL PRIMARY KEY,
  periodo_original TEXT NOT NULL,
  ano INT NOT NULL,
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  trimestre INT NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
  semestre INT NOT NULL CHECK (semestre IN (1,2)),
  nome_mes TEXT NOT NULL,
  nome_trimestre TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dim_periodo_original ON public.dim_periodo(periodo_original);
CREATE INDEX IF NOT EXISTS ix_dim_periodo_ano_mes ON public.dim_periodo(ano, mes);

-- dim_recurso
CREATE TABLE IF NOT EXISTS public.dim_recurso (
  id_recurso BIGSERIAL PRIMARY KEY,
  nome_recurso TEXT NOT NULL,
  tipo_recurso TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_dim_recurso_nome ON public.dim_recurso(nome_recurso);

-- fact_dre_lancamentos
CREATE TABLE IF NOT EXISTS public.fact_dre_lancamentos (
  id_lancamento BIGSERIAL PRIMARY KEY,
  id_projeto BIGINT NOT NULL REFERENCES public.dim_projeto(id_projeto) ON DELETE RESTRICT,
  id_cliente BIGINT NOT NULL REFERENCES public.dim_cliente(id_cliente) ON DELETE RESTRICT,
  id_conta BIGINT NOT NULL REFERENCES public.dim_conta(id_conta) ON DELETE RESTRICT,
  id_periodo BIGINT NOT NULL REFERENCES public.dim_periodo(id_periodo) ON DELETE RESTRICT,
  id_recurso BIGINT REFERENCES public.dim_recurso(id_recurso) ON DELETE SET NULL,
  valor_lancamento NUMERIC(18,2) NOT NULL,
  relatorio_origem TEXT,
  hash_linha TEXT NOT NULL,
  data_processamento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_fact_dre_hash ON public.fact_dre_lancamentos(hash_linha);
CREATE INDEX IF NOT EXISTS ix_fact_dre_ids ON public.fact_dre_lancamentos(id_projeto, id_cliente, id_conta, id_periodo);
CREATE INDEX IF NOT EXISTS ix_fact_dre_periodo ON public.fact_dre_lancamentos(id_periodo);
CREATE INDEX IF NOT EXISTS ix_fact_dre_ativo ON public.fact_dre_lancamentos(ativo);

-- Comentários
COMMENT ON TABLE public.dim_projeto IS 'Dimensão de Projetos';
COMMENT ON TABLE public.dim_cliente IS 'Dimensão de Clientes';
COMMENT ON TABLE public.dim_conta IS 'Dimensão de Contas (resumo, denominação, natureza)';
COMMENT ON TABLE public.dim_periodo IS 'Dimensão de Período (Mês/Ano e atributos derivados)';
COMMENT ON TABLE public.dim_recurso IS 'Dimensão de Recursos (pessoas, subcontratos etc.)';
COMMENT ON TABLE public.fact_dre_lancamentos IS 'Fato de lançamentos DRE com chaves dimensionais';
