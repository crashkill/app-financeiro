-- =====================================================
-- Script de Criação das Tabelas Dimensionais - DRE HITSS
-- Modelo Star Schema para Data Warehouse
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. DIMENSÃO PROJETO (dim_projeto)
-- =====================================================
CREATE TABLE IF NOT EXISTS dim_projeto (
    id_projeto SERIAL PRIMARY KEY,
    codigo_projeto VARCHAR(50) NOT NULL UNIQUE,
    nome_projeto VARCHAR(500) NOT NULL,
    id_homs VARCHAR(50),
    tipo_negocio VARCHAR(50) NOT NULL CHECK (tipo_negocio IN ('Mercado', 'InterCompany')),
    linha_negocio VARCHAR(200),
    filial_faturamento VARCHAR(100),
    imposto_percentual DECIMAL(5,2) DEFAULT 5.65,
    responsavel_area VARCHAR(200),
    responsavel_delivery VARCHAR(200),
    responsavel_devengado VARCHAR(200),
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da tabela dim_projeto
COMMENT ON TABLE dim_projeto IS 'Dimensão de projetos contendo informações mestres dos projetos';
COMMENT ON COLUMN dim_projeto.id_projeto IS 'Chave surrogate - identificador único interno';
COMMENT ON COLUMN dim_projeto.codigo_projeto IS 'Chave natural - código do projeto no sistema GRL';
COMMENT ON COLUMN dim_projeto.nome_projeto IS 'Nome completo do projeto (código + descrição)';
COMMENT ON COLUMN dim_projeto.id_homs IS 'Identificador do projeto no sistema HOMS';
COMMENT ON COLUMN dim_projeto.tipo_negocio IS 'Tipo de negócio: Mercado ou InterCompany';
COMMENT ON COLUMN dim_projeto.imposto_percentual IS 'Percentual de imposto aplicado (padrão 5.65%)';

-- Índices para dim_projeto
CREATE INDEX IF NOT EXISTS idx_dim_projeto_codigo ON dim_projeto(codigo_projeto);
CREATE INDEX IF NOT EXISTS idx_dim_projeto_tipo ON dim_projeto(tipo_negocio);
CREATE INDEX IF NOT EXISTS idx_dim_projeto_ativo ON dim_projeto(ativo);
CREATE INDEX IF NOT EXISTS idx_dim_projeto_data_criacao ON dim_projeto(data_criacao);

-- =====================================================
-- 2. DIMENSÃO CLIENTE (dim_cliente)
-- =====================================================
CREATE TABLE IF NOT EXISTS dim_cliente (
    id_cliente SERIAL PRIMARY KEY,
    nome_cliente VARCHAR(500) NOT NULL UNIQUE,
    tipo_cliente VARCHAR(50) NOT NULL DEFAULT 'Mercado',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da tabela dim_cliente
COMMENT ON TABLE dim_cliente IS 'Dimensão de clientes contendo informações mestres dos clientes';
COMMENT ON COLUMN dim_cliente.id_cliente IS 'Chave surrogate - identificador único interno';
COMMENT ON COLUMN dim_cliente.nome_cliente IS 'Nome completo do cliente (chave natural)';
COMMENT ON COLUMN dim_cliente.tipo_cliente IS 'Tipo de cliente derivado do tipo de negócio';

-- Índices para dim_cliente
CREATE INDEX IF NOT EXISTS idx_dim_cliente_nome ON dim_cliente(nome_cliente);
CREATE INDEX IF NOT EXISTS idx_dim_cliente_tipo ON dim_cliente(tipo_cliente);
CREATE INDEX IF NOT EXISTS idx_dim_cliente_ativo ON dim_cliente(ativo);

-- =====================================================
-- 3. DIMENSÃO CONTA (dim_conta)
-- =====================================================
CREATE TABLE IF NOT EXISTS dim_conta (
    id_conta SERIAL PRIMARY KEY,
    conta_resumo VARCHAR(100) NOT NULL,
    denominacao_conta VARCHAR(200) NOT NULL,
    natureza VARCHAR(20) NOT NULL CHECK (natureza IN ('RECEITA', 'CUSTO')),
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conta_resumo, denominacao_conta)
);

-- Comentários da tabela dim_conta
COMMENT ON TABLE dim_conta IS 'Dimensão de contas contábeis';
COMMENT ON COLUMN dim_conta.id_conta IS 'Chave surrogate - identificador único interno';
COMMENT ON COLUMN dim_conta.conta_resumo IS 'Categoria resumida da conta (ex: Receita Devengada, CLT)';
COMMENT ON COLUMN dim_conta.denominacao_conta IS 'Denominação completa da conta contábil';
COMMENT ON COLUMN dim_conta.natureza IS 'Natureza do lançamento: RECEITA ou CUSTO';

-- Índices para dim_conta
CREATE INDEX IF NOT EXISTS idx_dim_conta_resumo ON dim_conta(conta_resumo);
CREATE INDEX IF NOT EXISTS idx_dim_conta_natureza ON dim_conta(natureza);
CREATE INDEX IF NOT EXISTS idx_dim_conta_ativo ON dim_conta(ativo);

-- =====================================================
-- 4. DIMENSÃO PERÍODO (dim_periodo)
-- =====================================================
CREATE TABLE IF NOT EXISTS dim_periodo (
    id_periodo SERIAL PRIMARY KEY,
    periodo_original VARCHAR(20) NOT NULL UNIQUE,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    trimestre INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
    semestre INTEGER NOT NULL CHECK (semestre BETWEEN 1 AND 2),
    nome_mes VARCHAR(20) NOT NULL,
    nome_trimestre VARCHAR(20) NOT NULL,
    nome_semestre VARCHAR(20) NOT NULL,
    data_inicio_periodo DATE NOT NULL,
    data_fim_periodo DATE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários da tabela dim_periodo
COMMENT ON TABLE dim_periodo IS 'Dimensão de períodos temporais para análises';
COMMENT ON COLUMN dim_periodo.id_periodo IS 'Chave surrogate - identificador único interno';
COMMENT ON COLUMN dim_periodo.periodo_original IS 'Período original do arquivo (ex: 6/2019)';
COMMENT ON COLUMN dim_periodo.ano IS 'Ano extraído do período';
COMMENT ON COLUMN dim_periodo.mes IS 'Mês extraído do período (1-12)';
COMMENT ON COLUMN dim_periodo.trimestre IS 'Trimestre calculado (1-4)';
COMMENT ON COLUMN dim_periodo.semestre IS 'Semestre calculado (1-2)';

-- Índices para dim_periodo
CREATE INDEX IF NOT EXISTS idx_dim_periodo_original ON dim_periodo(periodo_original);
CREATE INDEX IF NOT EXISTS idx_dim_periodo_ano ON dim_periodo(ano);
CREATE INDEX IF NOT EXISTS idx_dim_periodo_mes ON dim_periodo(mes);
CREATE INDEX IF NOT EXISTS idx_dim_periodo_trimestre ON dim_periodo(trimestre);
CREATE INDEX IF NOT EXISTS idx_dim_periodo_ano_mes ON dim_periodo(ano, mes);

-- =====================================================
-- 5. DIMENSÃO RECURSO (dim_recurso)
-- =====================================================
CREATE TABLE IF NOT EXISTS dim_recurso (
    id_recurso SERIAL PRIMARY KEY,
    id_recurso_original VARCHAR(50),
    nome_recurso VARCHAR(200),
    tipo_recurso VARCHAR(50) NOT NULL DEFAULT 'Outros',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_recurso_original, nome_recurso)
);

-- Comentários da tabela dim_recurso
COMMENT ON TABLE dim_recurso IS 'Dimensão de recursos humanos (funcionários, subcontratados)';
COMMENT ON COLUMN dim_recurso.id_recurso IS 'Chave surrogate - identificador único interno';
COMMENT ON COLUMN dim_recurso.id_recurso_original IS 'ID original do recurso (pode ser nulo para subcontratados)';
COMMENT ON COLUMN dim_recurso.nome_recurso IS 'Nome do recurso (pode ser vazio para subcontratados)';
COMMENT ON COLUMN dim_recurso.tipo_recurso IS 'Tipo: CLT, Subcontratado, Outros';

-- Índices para dim_recurso
CREATE INDEX IF NOT EXISTS idx_dim_recurso_original ON dim_recurso(id_recurso_original);
CREATE INDEX IF NOT EXISTS idx_dim_recurso_nome ON dim_recurso(nome_recurso);
CREATE INDEX IF NOT EXISTS idx_dim_recurso_tipo ON dim_recurso(tipo_recurso);
CREATE INDEX IF NOT EXISTS idx_dim_recurso_ativo ON dim_recurso(ativo);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualização automática
CREATE TRIGGER update_dim_projeto_updated_at BEFORE UPDATE ON dim_projeto
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dim_cliente_updated_at BEFORE UPDATE ON dim_cliente
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dim_conta_updated_at BEFORE UPDATE ON dim_conta
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dim_recurso_updated_at BEFORE UPDATE ON dim_recurso
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERÇÃO DE DADOS PADRÃO
-- =====================================================

-- Registro padrão para recursos não identificados
INSERT INTO dim_recurso (id_recurso_original, nome_recurso, tipo_recurso)
VALUES (NULL, 'NÃO IDENTIFICADO', 'Outros')
ON CONFLICT DO NOTHING;

-- Função para popular dim_periodo com anos de 2015 a 2030
CREATE OR REPLACE FUNCTION popular_dim_periodo()
RETURNS VOID AS $$
DECLARE
    ano_atual INTEGER;
    mes_atual INTEGER;
    periodo_str VARCHAR(20);
    nome_mes_array VARCHAR[] := ARRAY['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
BEGIN
    FOR ano_atual IN 2015..2030 LOOP
        FOR mes_atual IN 1..12 LOOP
            periodo_str := mes_atual || '/' || ano_atual;
            
            INSERT INTO dim_periodo (
                periodo_original,
                ano,
                mes,
                trimestre,
                semestre,
                nome_mes,
                nome_trimestre,
                nome_semestre,
                data_inicio_periodo,
                data_fim_periodo
            ) VALUES (
                periodo_str,
                ano_atual,
                mes_atual,
                CASE 
                    WHEN mes_atual BETWEEN 1 AND 3 THEN 1
                    WHEN mes_atual BETWEEN 4 AND 6 THEN 2
                    WHEN mes_atual BETWEEN 7 AND 9 THEN 3
                    ELSE 4
                END,
                CASE WHEN mes_atual <= 6 THEN 1 ELSE 2 END,
                nome_mes_array[mes_atual],
                'T' || CASE 
                    WHEN mes_atual BETWEEN 1 AND 3 THEN '1'
                    WHEN mes_atual BETWEEN 4 AND 6 THEN '2'
                    WHEN mes_atual BETWEEN 7 AND 9 THEN '3'
                    ELSE '4'
                END,
                CASE WHEN mes_atual <= 6 THEN 'S1' ELSE 'S2' END,
                DATE(ano_atual || '-' || LPAD(mes_atual::TEXT, 2, '0') || '-01'),
                (DATE(ano_atual || '-' || LPAD(mes_atual::TEXT, 2, '0') || '-01') + INTERVAL '1 month - 1 day')::DATE
            ) ON CONFLICT (periodo_original) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a função para popular períodos
SELECT popular_dim_periodo();

-- =====================================================
-- VIEWS AUXILIARES
-- =====================================================

-- View para facilitar consultas de projetos ativos
CREATE OR REPLACE VIEW vw_projetos_ativos AS
SELECT 
    id_projeto,
    codigo_projeto,
    nome_projeto,
    tipo_negocio,
    linha_negocio,
    responsavel_delivery
FROM dim_projeto 
WHERE ativo = TRUE;

-- View para facilitar consultas de períodos recentes
CREATE OR REPLACE VIEW vw_periodos_recentes AS
SELECT 
    id_periodo,
    periodo_original,
    ano,
    mes,
    nome_mes,
    trimestre,
    nome_trimestre
FROM dim_periodo 
WHERE ano >= EXTRACT(YEAR FROM NOW()) - 5
ORDER BY ano DESC, mes DESC;

-- =====================================================
-- GRANTS E PERMISSÕES
-- =====================================================

-- Conceder permissões para usuários da aplicação
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

COMMENT ON SCHEMA public IS 'Schema principal contendo as tabelas dimensionais do DRE HITSS';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

SELECT 'Tabelas dimensionais criadas com sucesso!' AS status;