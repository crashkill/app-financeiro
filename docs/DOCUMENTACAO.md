# Documentação do Projeto - App Financeiro

## Introdução

Este projeto é uma aplicação financeira desenvolvida com React, TypeScript, Vite e diversas bibliotecas modernas, como React-Bootstrap, TailwindCSS, Chart.js, entre outras. O sistema permite a gestão de operações financeiras, incluindo dashboards, uploads, previsões (forecast), gestão de profissionais e relatórios.

## Funcionalidades Principais

- **Dashboard:** Visão geral dos indicadores financeiros.
- **Planilhas Financeiras:** Visualização e manipulação de planilhas de receitas e despesas.
- **Forecast:** Previsões financeiras com gráficos interativos.
- **Upload:** Importação de dados via arquivos Excel.
- **Gestão de Profissionais:** Módulo para gerenciamento de custos e alocação de profissionais, com gráficos e tabelas detalhadas.
- **Documentação:** Seção dedicada a explicar a arquitetura, componentes e fluxos do sistema.

## Estrutura do Projeto

- **src/**: Código-fonte principal, organizado em:
  - **components/**: Componentes reutilizáveis (ex.: CustosGrafico em gestao-profissionais, Header, Layout, Sidebar, etc.)
  - **contexts/**: Gerenciamento de estados globais (autenticação, configurações).
  - **db/**: Configuração do banco de dados local, usando IndexedDB.
  - **pages/**: Páginas da aplicação, como Dashboard, Login, Upload, Forecast, Gestão de Profissionais, etc.
  - **routes/**: Configuração de rotas com proteção para acessos não autenticados.
  - **utils/**: Funções auxiliares para formatação, cálculos, e manipulação de dados.

## Tecnologias Utilizadas

- **Front-end:** React, TypeScript, Vite
- **Estilização:** React-Bootstrap, TailwindCSS
- **Gráficos:** Chart.js e react-chartjs-2
- **Testes:** Jest, Testing Library

## Instalação e Execução

1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute a aplicação:
   ```bash
   npm run dev
   ```

4. Execute os testes:
   ```bash
   npm test
   ```

## Desenvolvimento com TDD (Test-Driven Development)

### Princípios do TDD
1. **Red:** Escrever o teste primeiro (que deve falhar)
2. **Green:** Implementar o código mínimo para fazer o teste passar
3. **Refactor:** Melhorar o código mantendo os testes passando

### Estrutura de Testes
- **Localização:** `src/__tests__/`
- **Nomenclatura:** `[ComponentName].test.tsx`
- **Frameworks:** Jest + Testing Library
- **Cobertura Mínima:** 80%

### Padrões de Teste
```typescript
// Exemplo de estrutura de teste
import { describe, test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  test('comportamento esperado', () => {
    // Arrange
    render(<Component />);
    
    // Act
    const element = screen.getByText('texto');
    
    // Assert
    expect(element).toBeInTheDocument();
  });
});
```

### Mocks e Dados de Teste
- Usar dados mock realistas
- Definir interfaces claras
- Testar casos de borda
- Simular erros e exceções

### Comandos de Teste
```bash
# Executar todos os testes
npm test

# Modo watch
npm run test:watch

# Verificar cobertura
npm run test:coverage
```

### Fluxo de Desenvolvimento
1. Criar arquivo de teste (*.test.tsx)
2. Escrever teste(s) para o comportamento desejado
3. Implementar o código mínimo
4. Refatorar e melhorar
5. Repetir para cada nova funcionalidade

## Futuras Melhorias

A documentação será atualizada continuamente com novas funcionalidades e melhorias na arquitetura. Recomendamos que a mesma seja revisada periodicamente para acompanhar as evoluções do sistema.

*Esta documentação foi criada para auxiliar na manutenção e evolução do sistema.*

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
