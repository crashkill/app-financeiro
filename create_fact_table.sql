-- =====================================================
-- Script de Criação da Tabela Fato - DRE HITSS
-- Modelo Star Schema para Data Warehouse
-- =====================================================

-- =====================================================
-- TABELA FATO: fact_dre_lancamentos
-- =====================================================
CREATE TABLE IF NOT EXISTS fact_dre_lancamentos (
    id_lancamento BIGSERIAL PRIMARY KEY,
    
    -- Chaves estrangeiras para as dimensões
    id_projeto INTEGER NOT NULL REFERENCES dim_projeto(id_projeto),
    id_cliente INTEGER NOT NULL REFERENCES dim_cliente(id_cliente),
    id_conta INTEGER NOT NULL REFERENCES dim_conta(id_conta),
    id_periodo INTEGER NOT NULL REFERENCES dim_periodo(id_periodo),
    id_recurso INTEGER REFERENCES dim_recurso(id_recurso),
    
    -- Métricas/Fatos
    valor_lancamento DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Campos de controle e auditoria
    relatorio_origem VARCHAR(100) NOT NULL,
    tipo_origem VARCHAR(50) NOT NULL,
    data_processamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hash_linha VARCHAR(64), -- Hash para detectar duplicatas
    
    -- Metadados adicionais
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT chk_valor_lancamento CHECK (valor_lancamento IS NOT NULL),
    CONSTRAINT chk_relatorio_origem CHECK (relatorio_origem != ''),
    CONSTRAINT chk_tipo_origem CHECK (tipo_origem != '')
);

-- =====================================================
-- COMENTÁRIOS DA TABELA FATO
-- =====================================================
COMMENT ON TABLE fact_dre_lancamentos IS 'Tabela fato contendo os lançamentos do DRE com referências às dimensões';
COMMENT ON COLUMN fact_dre_lancamentos.id_lancamento IS 'Chave surrogate - identificador único do lançamento';
COMMENT ON COLUMN fact_dre_lancamentos.id_projeto IS 'FK para dim_projeto - projeto relacionado ao lançamento';
COMMENT ON COLUMN fact_dre_lancamentos.id_cliente IS 'FK para dim_cliente - cliente relacionado ao lançamento';
COMMENT ON COLUMN fact_dre_lancamentos.id_conta IS 'FK para dim_conta - conta contábil do lançamento';
COMMENT ON COLUMN fact_dre_lancamentos.id_periodo IS 'FK para dim_periodo - período temporal do lançamento';
COMMENT ON COLUMN fact_dre_lancamentos.id_recurso IS 'FK para dim_recurso - recurso humano (pode ser nulo)';
COMMENT ON COLUMN fact_dre_lancamentos.valor_lancamento IS 'Valor monetário do lançamento (métrica principal)';
COMMENT ON COLUMN fact_dre_lancamentos.relatorio_origem IS 'Nome do relatório de origem (ex: DRE_HITSS_2024)';
COMMENT ON COLUMN fact_dre_lancamentos.tipo_origem IS 'Tipo do relatório (ex: DRE, Orçamento, Forecast)';
COMMENT ON COLUMN fact_dre_lancamentos.hash_linha IS 'Hash MD5 da linha para controle de duplicatas';
COMMENT ON COLUMN fact_dre_lancamentos.data_processamento IS 'Timestamp de quando o registro foi inserido';

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices nas chaves estrangeiras (essenciais para JOINs)
CREATE INDEX IF NOT EXISTS idx_fact_dre_id_projeto ON fact_dre_lancamentos(id_projeto);
CREATE INDEX IF NOT EXISTS idx_fact_dre_id_cliente ON fact_dre_lancamentos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_fact_dre_id_conta ON fact_dre_lancamentos(id_conta);
CREATE INDEX IF NOT EXISTS idx_fact_dre_id_periodo ON fact_dre_lancamentos(id_periodo);
CREATE INDEX IF NOT EXISTS idx_fact_dre_id_recurso ON fact_dre_lancamentos(id_recurso);

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_fact_dre_projeto_periodo ON fact_dre_lancamentos(id_projeto, id_periodo);
CREATE INDEX IF NOT EXISTS idx_fact_dre_cliente_periodo ON fact_dre_lancamentos(id_cliente, id_periodo);
CREATE INDEX IF NOT EXISTS idx_fact_dre_conta_periodo ON fact_dre_lancamentos(id_conta, id_periodo);
CREATE INDEX IF NOT EXISTS idx_fact_dre_projeto_conta ON fact_dre_lancamentos(id_projeto, id_conta);

-- Índices para campos de controle
CREATE INDEX IF NOT EXISTS idx_fact_dre_data_processamento ON fact_dre_lancamentos(data_processamento);
CREATE INDEX IF NOT EXISTS idx_fact_dre_relatorio_origem ON fact_dre_lancamentos(relatorio_origem);
CREATE INDEX IF NOT EXISTS idx_fact_dre_hash_linha ON fact_dre_lancamentos(hash_linha);
CREATE INDEX IF NOT EXISTS idx_fact_dre_ativo ON fact_dre_lancamentos(ativo);

-- Índice para valores (útil para agregações)
CREATE INDEX IF NOT EXISTS idx_fact_dre_valor ON fact_dre_lancamentos(valor_lancamento) WHERE ativo = TRUE;

-- =====================================================
-- PARTICIONAMENTO (OPCIONAL - Para grandes volumes)
-- =====================================================

-- Comentário: Para implementar particionamento por período no futuro
-- ALTER TABLE fact_dre_lancamentos PARTITION BY RANGE (data_processamento);

-- =====================================================
-- VIEWS ANALÍTICAS PRÉ-DEFINIDAS
-- =====================================================

-- View: Resumo por Projeto e Período
CREATE OR REPLACE VIEW vw_dre_por_projeto_periodo AS
SELECT 
    p.codigo_projeto,
    p.nome_projeto,
    p.tipo_negocio,
    per.ano,
    per.mes,
    per.nome_mes,
    per.trimestre,
    c.natureza,
    SUM(f.valor_lancamento) AS total_valor,
    COUNT(*) AS qtd_lancamentos
FROM fact_dre_lancamentos f
INNER JOIN dim_projeto p ON f.id_projeto = p.id_projeto
INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
INNER JOIN dim_conta c ON f.id_conta = c.id_conta
WHERE f.ativo = TRUE AND p.ativo = TRUE
GROUP BY 
    p.codigo_projeto, p.nome_projeto, p.tipo_negocio,
    per.ano, per.mes, per.nome_mes, per.trimestre,
    c.natureza;

-- View: Resumo por Cliente e Natureza
CREATE OR REPLACE VIEW vw_dre_por_cliente_natureza AS
SELECT 
    cl.nome_cliente,
    cl.tipo_cliente,
    c.natureza,
    per.ano,
    SUM(f.valor_lancamento) AS total_valor,
    COUNT(DISTINCT f.id_projeto) AS qtd_projetos
FROM fact_dre_lancamentos f
INNER JOIN dim_cliente cl ON f.id_cliente = cl.id_cliente
INNER JOIN dim_conta c ON f.id_conta = c.id_conta
INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
WHERE f.ativo = TRUE
GROUP BY 
    cl.nome_cliente, cl.tipo_cliente,
    c.natureza, per.ano;

-- View: Análise de Receitas vs Custos por Projeto
CREATE OR REPLACE VIEW vw_dre_receita_custo_projeto AS
SELECT 
    p.codigo_projeto,
    p.nome_projeto,
    per.ano,
    per.mes,
    SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) AS total_receita,
    SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) AS total_custo,
    SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) - 
    SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) AS margem_bruta
FROM fact_dre_lancamentos f
INNER JOIN dim_projeto p ON f.id_projeto = p.id_projeto
INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
INNER JOIN dim_conta c ON f.id_conta = c.id_conta
WHERE f.ativo = TRUE AND p.ativo = TRUE
GROUP BY 
    p.codigo_projeto, p.nome_projeto,
    per.ano, per.mes;

-- View: Top 10 Projetos por Receita
CREATE OR REPLACE VIEW vw_top_projetos_receita AS
SELECT 
    p.codigo_projeto,
    p.nome_projeto,
    p.tipo_negocio,
    cl.nome_cliente,
    SUM(f.valor_lancamento) AS total_receita,
    COUNT(*) AS qtd_lancamentos
FROM fact_dre_lancamentos f
INNER JOIN dim_projeto p ON f.id_projeto = p.id_projeto
INNER JOIN dim_cliente cl ON f.id_cliente = cl.id_cliente
INNER JOIN dim_conta c ON f.id_conta = c.id_conta
WHERE f.ativo = TRUE 
  AND p.ativo = TRUE 
  AND c.natureza = 'RECEITA'
GROUP BY 
    p.codigo_projeto, p.nome_projeto, p.tipo_negocio,
    cl.nome_cliente
ORDER BY total_receita DESC
LIMIT 10;

-- =====================================================
-- FUNÇÕES DE AGREGAÇÃO CUSTOMIZADAS
-- =====================================================

-- Função para calcular margem por projeto em um período
CREATE OR REPLACE FUNCTION calcular_margem_projeto(
    p_codigo_projeto VARCHAR(50),
    p_ano INTEGER,
    p_mes INTEGER DEFAULT NULL
)
RETURNS TABLE(
    codigo_projeto VARCHAR(50),
    periodo VARCHAR(20),
    receita DECIMAL(15,2),
    custo DECIMAL(15,2),
    margem DECIMAL(15,2),
    percentual_margem DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.codigo_projeto,
        per.periodo_original,
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) AS receita,
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) AS custo,
        SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) - 
        SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END) AS margem,
        CASE 
            WHEN SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) > 0 THEN
                ((SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END) - 
                  SUM(CASE WHEN c.natureza = 'CUSTO' THEN f.valor_lancamento ELSE 0 END)) / 
                 SUM(CASE WHEN c.natureza = 'RECEITA' THEN f.valor_lancamento ELSE 0 END)) * 100
            ELSE 0
        END AS percentual_margem
    FROM fact_dre_lancamentos f
    INNER JOIN dim_projeto p ON f.id_projeto = p.id_projeto
    INNER JOIN dim_periodo per ON f.id_periodo = per.id_periodo
    INNER JOIN dim_conta c ON f.id_conta = c.id_conta
    WHERE f.ativo = TRUE 
      AND p.codigo_projeto = p_codigo_projeto
      AND per.ano = p_ano
      AND (p_mes IS NULL OR per.mes = p_mes)
    GROUP BY p.codigo_projeto, per.periodo_original;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA AUDITORIA
-- =====================================================

-- Função para log de alterações
CREATE OR REPLACE FUNCTION log_fact_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log de inserções, atualizações e exclusões
    -- Implementar conforme necessidade de auditoria
    
    IF TG_OP = 'INSERT' THEN
        -- Log da inserção
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log da atualização
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Log da exclusão
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoria (opcional)
-- CREATE TRIGGER fact_dre_audit_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON fact_dre_lancamentos
--     FOR EACH ROW EXECUTE FUNCTION log_fact_changes();

-- =====================================================
-- FUNÇÃO PARA LIMPEZA DE DADOS ANTIGOS
-- =====================================================

-- Função para arquivar dados antigos (soft delete)
CREATE OR REPLACE FUNCTION arquivar_dados_antigos(
    p_anos_manter INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
    registros_arquivados INTEGER;
BEGIN
    UPDATE fact_dre_lancamentos 
    SET ativo = FALSE,
        observacoes = COALESCE(observacoes, '') || ' [ARQUIVADO EM ' || NOW() || ']'
    WHERE ativo = TRUE 
      AND data_processamento < NOW() - INTERVAL '1 year' * p_anos_manter;
    
    GET DIAGNOSTICS registros_arquivados = ROW_COUNT;
    
    RETURN registros_arquivados;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ESTATÍSTICAS E MONITORAMENTO
-- =====================================================

-- View para estatísticas da tabela fato
CREATE OR REPLACE VIEW vw_fact_statistics AS
SELECT 
    'fact_dre_lancamentos' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE ativo = TRUE) AS registros_ativos,
    COUNT(*) FILTER (WHERE ativo = FALSE) AS registros_arquivados,
    MIN(data_processamento) AS data_primeiro_registro,
    MAX(data_processamento) AS data_ultimo_registro,
    SUM(valor_lancamento) FILTER (WHERE ativo = TRUE) AS valor_total_ativo,
    AVG(valor_lancamento) FILTER (WHERE ativo = TRUE) AS valor_medio,
    COUNT(DISTINCT id_projeto) AS projetos_distintos,
    COUNT(DISTINCT id_cliente) AS clientes_distintos
FROM fact_dre_lancamentos;

-- =====================================================
-- GRANTS E PERMISSÕES
-- =====================================================

-- Conceder permissões para usuários da aplicação
-- GRANT SELECT, INSERT, UPDATE ON fact_dre_lancamentos TO app_user;
-- GRANT USAGE, SELECT ON SEQUENCE fact_dre_lancamentos_id_lancamento_seq TO app_user;
-- GRANT SELECT ON ALL VIEWS TO app_user;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

SELECT 'Tabela fato criada com sucesso!' AS status;
SELECT 'Views analíticas criadas!' AS status;
SELECT 'Funções auxiliares criadas!' AS status;