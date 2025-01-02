# App Financeiro

Aplicação para gerenciamento e visualização de dados financeiros de projetos.

## Funcionalidades

### Dashboard
- Visualização de receitas e custos por projeto
- Gráfico de barras empilhadas mostrando:
  - Receita (verde)
  - Custo (vermelho)
  - Linha de margem (azul)
- Filtros:
  - Seleção múltipla de projetos
  - Seleção de ano (padrão: 2024)
- Totalizadores:
  - Receita total do período
  - Custo total do período

### Planilhas Financeiras
- Visualização detalhada de dados financeiros por projeto
- Cálculos de:
  - Receita mensal e acumulada
  - Custo mensal e acumulado
  - Desoneração mensal e acumulada
  - Margem mensal e acumulada (1 - (|Custo| - Desoneração)/Receita)
- Indicadores visuais:
  - Margem ≥ 7%: Verde
  - Margem < 7%: Vermelho
- Edição de valores futuros
- Filtros por projeto e ano
- Valores centralizados para melhor visualização

### Gráficos
- Barras empilhadas por mês
- Linha de margem
- Formatação em milhões (Mi)
- Tooltips detalhados com valores e percentuais

### Documentação
- Documentação completa do sistema acessível via menu (apenas administradores)
- Seções disponíveis:
  - Visão Geral do Sistema
  - Arquitetura e Componentes
  - Cálculos e Regras de Negócio
  - Documentação da API (Swagger)

## Tecnologias

### Frontend
- React 18
- TypeScript
- Chart.js / react-chartjs-2
- React Bootstrap
- Tailwind CSS
- React Router DOM
- React Query

### Backend
- DexieJS (IndexedDB)
- Firebase (autenticação)

### Ferramentas de Desenvolvimento
- Vite
- ESLint
- PostCSS
- Prettier

## Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## Estrutura do Projeto

```
src/
  ├── components/       # Componentes reutilizáveis
  │   ├── FilterPanel/    # Filtros globais
  │   ├── ProjectCharts/  # Gráficos de projeto
  │   └── Layout/         # Componentes de layout
  ├── pages/           # Páginas da aplicação
  │   ├── Dashboard/      # Dashboard principal
  │   ├── PlanilhasFinanceiras/  # Planilhas detalhadas
  │   └── Documentacao/   # Documentação do sistema
  ├── db/             # Configuração do banco de dados
  │   └── database.ts   # Schema e conexão
  ├── types/          # Definições de tipos
  ├── utils/          # Utilitários
  │   ├── formatters/   # Formatadores de dados
  │   ├── calculators/  # Funções de cálculo
  │   └── validators/   # Validadores
  └── styles/         # Estilos globais
```

## Regras de Negócio

### Cálculo de Margem e Custos
```typescript
// 1. Custo ajustado = |Custo| - Desoneração
// 2. Margem = (1 - (Custo ajustado / Receita)) * 100

// Importante:
// - Custos são sempre mantidos como valores negativos
// - Math.abs() é usado apenas no cálculo da margem
// - Apenas custos CLT, Outros e Subcontratados são considerados

// Exemplo: 
// Custo = -100000, Desoneração = 10000, Receita = 150000
// Custo ajustado = |-100000| - 10000 = 90000
// Margem = (1 - (90000/150000)) * 100 = 40%
```

### Indicadores de Margem
- Verde (≥ 7%): Indica margem dentro do esperado
- Vermelho (< 7%): Indica necessidade de atenção

### Custos Válidos
- CLT
- Outros
- Subcontratados

### Edição de Dados
- Somente meses futuros podem ser editados
- Valores são automaticamente formatados
- Recálculo automático de acumulados

## Atualizações Recentes

### 02/01/2024
- Corrigido o tratamento de custos negativos no cálculo da margem
- Garantida a integridade dos valores negativos durante todo o processamento
- Adicionada coloração condicional para margens
- Centralização de valores nas tabelas
- Corrigido cálculo de margem considerando desoneração
- Adicionada documentação detalhada
- Melhorada interface das planilhas financeiras

### 29/12/2023
- Melhorada visualização do gráfico
- Corrigido bug de duplicação na importação

## Próximos Passos

- [ ] Implementar documentação online para administradores
- [ ] Adicionar Swagger para APIs
- [ ] Melhorar responsividade das tabelas
- [ ] Implementar exportação de dados
- [ ] Adicionar testes automatizados
- [ ] Implementar sistema de backup

## Documentação Adicional

Para documentação detalhada do sistema, acesse a seção "Documentação" no menu principal (requer acesso de administrador).

## Suporte

Para suporte ou dúvidas, entre em contato com a equipe de desenvolvimento.
