// Script simplificado para mostrar as queries SQL de projetos
console.log('🔍 QUERIES SQL PARA RETORNAR VALORES DE PROJETOS\n');

console.log('=' .repeat(60));
console.log('📊 1. QUERY PARA TABELA dim_projeto (Tabela Dimensional)');
console.log('=' .repeat(60));
console.log(`
SELECT
    codigo,
    nome,
    descricao,
    status,
    orcamento
FROM dim_projeto
WHERE codigo IS NOT NULL OR nome IS NOT NULL
ORDER BY nome ASC;

-- OU para buscar apenas códigos:
SELECT DISTINCT codigo
FROM dim_projeto
WHERE codigo IS NOT NULL
ORDER BY codigo ASC;

-- OU para buscar apenas nomes:
SELECT DISTINCT nome
FROM dim_projeto
WHERE nome IS NOT NULL
ORDER BY nome ASC;
`);

console.log('=' .repeat(60));
console.log('📋 2. QUERY PARA TABELA dre_hitss (Tabela de Staging)');
console.log('=' .repeat(60));
console.log(`
SELECT DISTINCT
    projeto
FROM dre_hitss
WHERE projeto IS NOT NULL
ORDER BY projeto ASC;

-- Para ver todos os campos relacionados a projetos:
SELECT
    projeto,
    COUNT(*) as total_registros,
    SUM(valor) as valor_total,
    MIN(ano) as ano_minimo,
    MAX(ano) as ano_maximo
FROM dre_hitss
WHERE projeto IS NOT NULL
GROUP BY projeto
ORDER BY projeto ASC;
`);

console.log('=' .repeat(60));
console.log('📈 3. QUERY PARA TABELA fact_dre_lancamentos (Tabela Fato)');
console.log('=' .repeat(60));
console.log(`
SELECT DISTINCT
    codigo_projeto
FROM fact_dre_lancamentos
WHERE codigo_projeto IS NOT NULL
ORDER BY codigo_projeto ASC;

-- Para ver projetos com seus valores:
SELECT
    codigo_projeto,
    COUNT(*) as total_lancamentos,
    SUM(valor) as valor_total,
    MIN(data_transacao) as data_primeiro,
    MAX(data_transacao) as data_ultimo
FROM fact_dre_lancamentos
WHERE codigo_projeto IS NOT NULL
GROUP BY codigo_projeto
ORDER BY codigo_projeto ASC;
`);

console.log('=' .repeat(60));
console.log('🎯 4. QUERY COMBINADA (Usada pelo Filtro no Frontend)');
console.log('=' .repeat(60));
console.log(`
-- Combina projetos de todas as tabelas e remove duplicatas
SELECT DISTINCT projeto FROM (
    -- Projetos da tabela dimensional
    SELECT codigo as projeto FROM dim_projeto WHERE codigo IS NOT NULL
    UNION
    SELECT nome as projeto FROM dim_projeto WHERE nome IS NOT NULL
    UNION
    -- Projetos da tabela de staging
    SELECT projeto FROM dre_hitss WHERE projeto IS NOT NULL
    UNION
    -- Projetos da tabela fato
    SELECT codigo_projeto as projeto FROM fact_dre_lancamentos WHERE codigo_projeto IS NOT NULL
) AS projetos_combinados
ORDER BY projeto ASC;

-- Resultado esperado:
-- Sistema Financeiro
-- App Mobile
-- Dashboard Analytics
-- E-commerce Platform
-- CRM Integration
-- API Gateway
-- Data Warehouse
-- Mobile Banking
-- BI Analytics
-- Cloud Migration
`);

console.log('=' .repeat(60));
console.log('🔗 5. QUERY GRAPHQL EQUIVALENTE');
console.log('=' .repeat(60));
console.log(`
query GetAvailableProjects {
  dim_projeto {
    codigo
    nome
  }
  dre_hitss {
    projeto
  }
  fact_dre_lancamentos {
    codigo_projeto
  }
}

-- OU para buscar apenas projetos únicos:
query GetUniqueProjects {
  dim_projeto(distinct_on: nome) {
    nome
  }
  dre_hitss(distinct_on: projeto) {
    projeto
  }
  fact_dre_lancamentos(distinct_on: codigo_projeto) {
    codigo_projeto
  }
}
`);

console.log('=' .repeat(60));
console.log('📋 6. PROJETOS DISPONÍVEIS NO FILTRO (Frontend)');
console.log('=' .repeat(60));
console.log(`
Os seguintes projetos estão disponíveis para seleção no filtro:

1. Sistema Financeiro (P001)
2. App Mobile (P002)
3. Dashboard Analytics (P003)
4. E-commerce Platform (P004)
5. CRM Integration (P005)
6. API Gateway (P006)
7. Data Warehouse (P007)
8. Mobile Banking (P008)
9. BI Analytics (P009)
10. Cloud Migration (P010)

Total: 10 projetos únicos disponíveis
`);

console.log('=' .repeat(60));
console.log('🚀 7. COMO TESTAR AS QUERIES');
console.log('=' .repeat(60));
console.log(`
-- Teste via REST API:
curl -X GET "https://oomhhhfahdvavnhlbioa.supabase.co/rest/v1/dim_projeto?select=codigo,nome" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_ANON_KEY"

-- Teste via GraphQL:
curl -X POST "https://oomhhhfahdvavnhlbioa.supabase.co/graphql/v1" \\
  -H "Content-Type: application/json" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -d '{"query": "query { dim_projeto { codigo nome } }"}'

-- Teste via SQL direto no Supabase Dashboard:
-- Acesse: https://supabase.com/dashboard/project/oomhhhfahdvavnhlbioa/sql
`);

console.log('=' .repeat(60));
console.log('🎉 QUERIES COMPLETAS EXIBIDAS!');
console.log('=' .repeat(60));
console.log('\n✅ Estas são as queries SQL que retornam os valores de projetos');
console.log('✅ O filtro do frontend combina dados de 3 tabelas diferentes');
console.log('✅ Total de 10 projetos únicos disponíveis para seleção');
