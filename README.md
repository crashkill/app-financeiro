# App Financeiro

Aplicação para gerenciamento e visualização de dados financeiros de projetos.

## Funcionalidades

### Componentes Reutilizáveis
- **Filtros**
  - `ProjectFilter`: Componente para seleção múltipla de projetos
    - Carrega projetos automaticamente do banco
    - Suporta personalização de label e altura
    - Mantém estado de seleção
  - `YearFilter`: Componente para seleção de ano
    - Carrega anos automaticamente do banco
    - Adiciona ano atual se necessário
    - Suporta personalização de label

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

A página de Planilhas Financeiras apresenta uma análise detalhada das finanças por projeto, incluindo:

- **Receita**: Valores obtidos da coluna ContaResumo onde o valor é "Receita Devengada"
- **Custos**: Valores obtidos da coluna ContaResumo onde o valor é "CLT", "Outros" ou "Subcontratados"
- **Desoneração da Folha**: Valores obtidos da coluna ContaResumo onde o valor é "Desoneração da Folha"
- **Margem**: Calculada como (1 - (|Custo| - Desoneração) / Receita) * 100

### Funcionalidades

- Filtragem por projeto e ano
- Visualização de valores mensais e acumulados
- Cálculo automático de margens
- Indicadores visuais de performance (verde para margens >= 7%, vermelho para < 7%)

### Otimizações

- Busca otimizada de transações usando índices compostos
- Processamento em lote para melhor performance
- Normalização de strings para comparação consistente
- Tratamento adequado de valores positivos/negativos

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
  - Índices otimizados
  - Cache em memória
  - Normalização automática
- Firebase (autenticação)

### Otimizações
- **Cache de Dados**
  - Sistema de cache em memória com TTL de 5 minutos
  - Invalidação seletiva por tipo/projeto/período
  - Cache de componentes com React.memo

- **Banco de Dados**
  - Índices compostos para consultas frequentes
  - Hooks de normalização de dados
  - Validação automática de campos

- **Componentes React**
  - Hooks personalizados otimizados
  - Memoização de listas e cálculos
  - Lazy loading de dados
  - Handlers otimizados

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
  │   ├── filters/        # Filtros reutilizáveis
  │   │   ├── ProjectFilter/  # Filtro de projetos
  │   │   └── YearFilter/     # Filtro de anos
  │   ├── FilterPanel/    # Painel de filtros
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

## Exemplos de Uso

### Filtros Reutilizáveis

```typescript
import ProjectFilter from '@/components/filters/ProjectFilter';
import YearFilter from '@/components/filters/YearFilter';

const MyComponent: React.FC = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  return (
    <>
      <ProjectFilter
        selectedProjects={selectedProjects}
        onProjectChange={setSelectedProjects}
        label="Filtrar Projetos"  // opcional
        height="200px"           // opcional
      />
      <YearFilter
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        label="Ano"             // opcional
      />
    </>
  );
};
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
