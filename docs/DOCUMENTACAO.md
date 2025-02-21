# Documentação do Sistema Financeiro

## Índice
1. [Planilhas Financeiras](#planilhas-financeiras)
2. [Forecast](#forecast)
3. [Gestão de Profissionais](#gestao-de-profissionais)

## Planilhas Financeiras

### Visão Geral
Página que exibe os dados financeiros históricos dos projetos, organizados por mês, com valores mensais e acumulados.

### Regras de Visualização
1. **Seleção de Dados**
   - Filtro por projeto(s)
   - Filtro por ano
   - Possibilidade de selecionar múltiplos projetos
   - Exibição em formato de tabela com valores mensais e acumulados

2. **Layout da Tabela**
   - Linhas: Receita, Desoneração, Custo e Margem
   - Colunas: Meses do ano (Jan a Dez)
   - Cada mês possui duas colunas: Mensal e Acumulado
   - Valores são centralizados nas células

### Regras de Cálculo

1. **Receita**
   - Considera apenas transações com conta resumo "RECEITA DEVENGADA"
   - Valor mantido como está no banco (positivo ou negativo)
   - Acumulado: Soma das receitas até o mês atual

2. **Desoneração**
   - Considera apenas transações com conta resumo "DESONERAÇÃO DA FOLHA"
   - Valor mantido como está no banco
   - Acumulado: Soma das desonerações até o mês atual

3. **Custo**
   - Considera transações com conta resumo: "CLT", "OUTROS", "SUBCONTRATADOS"
   - Valor mantido como está no banco (negativo)
   - Acumulado: Soma dos custos até o mês atual

4. **Margem**
   - Mensal: ((Receita - |Custo| + Desoneração) / Receita) * 100
   - Acumulada: ((Receita Acumulada - |Custo Acumulado| + Desoneração Acumulada) / Receita Acumulada) * 100
   - Se não houver receita, margem é 0%

### Regras de Cores

1. **Receita**
   - Verde (#198754)
   - Aplica-se tanto para valores mensais quanto acumulados

2. **Desoneração**
   - Azul claro (#0dcaf0)
   - Aplica-se tanto para valores mensais quanto acumulados

3. **Custo**
   - Vermelho (#dc3545)
   - Aplica-se tanto para valores mensais quanto acumulados

4. **Margem**
   - Verde (#28a745) quando >= 7%
   - Vermelho (#dc3545) quando < 7%
   - Valores em negrito
   - Aplica-se tanto para valores mensais quanto acumulados

### Regras de Preenchimento

1. **Meses sem Dados**
   - Se não houver dados em um mês e não for o primeiro mês do ano:
     - Usa os valores do último mês com dados
   - Se for o primeiro mês sem dados:
     - Exibe zeros em todas as células

2. **Anos sem Dados**
   - Exibe zeros em todas as células
   - Mantém a formatação padrão

## Forecast

### Visão Geral
Página que permite visualizar e editar previsões financeiras futuras dos projetos.

### Regras de Visualização
1. **Seleção de Dados**
   - Filtro por projeto(s)
   - Filtro por ano
   - Possibilidade de selecionar múltiplos projetos
   - Exibição em formato de tabela com valores mensais

2. **Layout da Tabela**
   - Linhas: Receita, Custo Total, Margem Bruta e Margem %
   - Colunas: Meses do ano (Jan a Dez) + Total
   - Valores são centralizados nas células

### Regras de Cálculo

1. **Receita**
   - Considera apenas transações com "RECEITA DEVENGADA"
   - Mantém o sinal original do valor
   - Total: Soma de todas as receitas mensais

2. **Custo Total**
   - Considera apenas transações de natureza "CUSTO"
   - Mantém o sinal original do valor (negativo)
   - Total: Soma de todos os custos mensais

3. **Margem Bruta**
   - Mensal: Receita + Custo (custo já é negativo)
   - Total: Soma de todas as margens brutas mensais

4. **Margem %**
   - Mensal: (Margem Bruta / |Receita|) * 100
   - Total: (Margem Bruta Total / |Receita Total|) * 100
   - Se não houver receita, margem é 0%

### Regras de Cores

1. **Receita**
   - Verde (#28a745)
   - Aplica-se tanto para valores mensais quanto total

2. **Custo Total**
   - Vermelho (#dc3545)
   - Aplica-se tanto para valores mensais quanto total

3. **Margem Bruta**
   - Azul (#4A90E2)
   - Aplica-se tanto para valores mensais quanto total

4. **Margem %**
   - Verde (#28a745) quando >= 7%
   - Vermelho (#dc3545) quando < 7%
   - Valores em negrito
   - Aplica-se tanto para valores mensais quanto total

### Regras de Edição

1. **Campos Editáveis**
   - Apenas receita e custo são editáveis
   - Apenas meses futuros podem ser editados
   - Meses passados são somente leitura

2. **Validação de Entrada**
   - Aceita apenas valores numéricos
   - Formata automaticamente como moeda
   - Atualiza margens automaticamente ao editar

3. **Persistência**
   - Valores editados são salvos automaticamente
   - Recalcula totais e margens após cada edição

### Regras de Preenchimento

1. **Meses sem Dados**
   - Se não houver dados em um mês e não for o primeiro mês:
     - Usa os valores do último mês com dados
   - Se for o primeiro mês sem dados:
     - Exibe zeros em todas as células

2. **Anos sem Dados**
   - Exibe zeros em todas as células
   - Mantém a formatação padrão

## Gestão de Profissionais

### Visão Geral
Página que permite visualizar e analisar os custos relacionados aos profissionais alocados nos projetos, categorizados por tipo (CLT, Subcontratados, Outros).

### Componentes Principais

1. **Filtros**
   - Seleção de projeto(s)
   - Seleção de ano
   - Seleção de mês (opcional)
   - Suporta múltipla seleção de projetos

2. **Gráfico de Distribuição**
   - Gráfico de pizza mostrando distribuição dos custos
   - Legendas com percentuais
   - Cores distintas para cada categoria
   - Posição fixa durante rolagem (sticky)

3. **Tabela de Custos**
   - Agrupamento por tipo de custo
   - Total e percentual por grupo
   - Detalhamento por profissional
   - Ordenação por descrição, período ou valor

### Regras de Negócio

1. **Categorização de Custos**
   - CLT: Custos relacionados a funcionários CLT
   - Subcontratados: Custos com profissionais terceirizados
   - Outros: Demais custos relacionados a profissionais

2. **Cálculos**
   - Total por categoria: Soma dos valores absolutos
   - Percentual: (Total da categoria / Total geral) * 100
   - Valores sempre exibidos em módulo (positivos)

3. **Ordenação**
   - Valor: Do maior para o menor (padrão)
   - Descrição: Ordem alfabética
   - Período: Ordem cronológica
   - Direção alternável (ascendente/descendente)

### Regras de Visualização

1. **Cores e Estilos**
   - Gráfico:
     - CLT: Azul (rgba(54, 162, 235, 0.7))
     - Subcontratados: Laranja (rgba(255, 159, 64, 0.7))
     - Outros: Verde água (rgba(75, 192, 192, 0.7))
   - Tabela:
     - Valores monetários alinhados à direita
     - Percentuais com uma casa decimal
     - Totais em destaque

2. **Layout Responsivo**
   - Gráfico: 5 colunas em telas grandes
   - Tabela: 7 colunas em telas grandes
   - Adaptação para telas menores

### Interatividade

1. **Filtros**
   - Atualização automática ao alterar filtros
   - Preservação dos filtros entre sessões
   - Limpeza de filtros disponível

2. **Ordenação**
   - Indicadores visuais da coluna ordenada
   - Alternância de direção com clique
   - Mantém ordenação ao atualizar dados

3. **Tooltip do Gráfico**
   - Exibe valor e percentual
   - Formatação monetária adequada
   - Atualização em tempo real
