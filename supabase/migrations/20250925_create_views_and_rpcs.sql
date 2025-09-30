-- 2025-09-25: Views analíticas e RPCs utilitárias

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_graphql;

-- Garantir recriação limpa das views para evitar conflitos de colunas/dependências
DROP VIEW IF EXISTS public.vw_dre_receita_custo_projeto CASCADE;
DROP VIEW IF EXISTS public.vw_dre_por_cliente_natureza CASCADE;

-- View: vw_dre_receita_custo_projeto
CREATE OR REPLACE VIEW public.vw_dre_receita_custo_projeto AS
SELECT 
  per.ano,
  per.mes,
  p.codigo_projeto,
  p.nome_projeto,
  p.tipo_negocio,
  cl.nome_cliente,
  SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) AS total_receita,
  SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) AS total_custo,
  SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE -f.valor_lancamento END) AS margem_bruta
FROM public.fact_dre_lancamentos f
JOIN public.dim_periodo per ON per.id_periodo = f.id_periodo
JOIN public.dim_conta c ON c.id_conta = f.id_conta
JOIN public.dim_projeto p ON p.id_projeto = f.id_projeto
LEFT JOIN public.dim_cliente cl ON cl.id_cliente = f.id_cliente
WHERE f.ativo = TRUE
GROUP BY per.ano, per.mes, p.codigo_projeto, p.nome_projeto, p.tipo_negocio, cl.nome_cliente;

COMMENT ON VIEW public.vw_dre_receita_custo_projeto IS 'Receita, custo e margem por projeto e período';

-- View: vw_dre_por_cliente_natureza
CREATE OR REPLACE VIEW public.vw_dre_por_cliente_natureza AS
SELECT 
  per.ano,
  per.mes,
  cl.nome_cliente,
  c.natureza,
  SUM(f.valor_lancamento) AS total_valor
FROM public.fact_dre_lancamentos f
JOIN public.dim_periodo per ON per.id_periodo = f.id_periodo
JOIN public.dim_conta c ON c.id_conta = f.id_conta
LEFT JOIN public.dim_cliente cl ON cl.id_cliente = f.id_cliente
WHERE f.ativo = TRUE
GROUP BY per.ano, per.mes, cl.nome_cliente, c.natureza;

COMMENT ON VIEW public.vw_dre_por_cliente_natureza IS 'Totais por cliente e natureza ao longo do tempo';

-- RPC: execute_sql (retorna linhas como jsonb)
CREATE OR REPLACE FUNCTION public.execute_sql(query TEXT)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT to_jsonb(t) FROM (%s) t', query);
END;
$$;

REVOKE ALL ON FUNCTION public.execute_sql(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO anon, authenticated, service_role;

-- RPC: calcular_margem_projeto
CREATE OR REPLACE FUNCTION public.calcular_margem_projeto(
  p_codigo_projeto TEXT,
  p_ano INT DEFAULT NULL,
  p_mes INT DEFAULT NULL
)
RETURNS TABLE(
  ano INT,
  mes INT,
  receita NUMERIC,
  custo NUMERIC,
  margem NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    per.ano,
    per.mes,
    SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) AS receita,
    SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) AS custo,
    SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE -f.valor_lancamento END) AS margem
  FROM public.fact_dre_lancamentos f
  JOIN public.dim_periodo per ON per.id_periodo = f.id_periodo
  JOIN public.dim_conta c ON c.id_conta = f.id_conta
  JOIN public.dim_projeto p ON p.id_projeto = f.id_projeto
  WHERE f.ativo = TRUE
    AND p.codigo_projeto = p_codigo_projeto
    AND (p_ano IS NULL OR per.ano = p_ano)
    AND (p_mes IS NULL OR per.mes = p_mes)
  GROUP BY per.ano, per.mes
  ORDER BY per.ano, per.mes;
END;
$$;

REVOKE ALL ON FUNCTION public.calcular_margem_projeto(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calcular_margem_projeto(TEXT, INT, INT) TO anon, authenticated, service_role;
