# Documentação do Sistema Financeiro

## Índice
1. [Planilhas Financeiras](#planilhas-financeiras)
2. [Forecast](#forecast)

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
