# 📚 Documentação do App Financeiro

## 📁 Repositório

Código fonte disponível em: [https://github.com/crashkill/app-financeiro.git](https://github.com/crashkill/app-financeiro.git)

## 🎯 Visão Geral

O App Financeiro é uma aplicação web moderna para gestão financeira empresarial, construída com as mais recentes tecnologias e práticas de desenvolvimento. O sistema oferece uma suite completa de ferramentas para análise financeira, gestão de profissionais e previsões orçamentárias.

## 🏗️ Arquitetura

### Stack Tecnológico

#### Frontend
- **Framework:** React 18 com TypeScript
- **Build Tool:** Vite
- **Estilização:** TailwindCSS + React-Bootstrap
- **Gerenciamento de Estado:** React Context + Hooks
- **Roteamento:** React Router v6
- **Gráficos:** Chart.js + react-chartjs-2
- **Tabelas:** Handsontable
- **Formulários:** React Hook Form + Zod

#### Desenvolvimento
- **Linguagem:** TypeScript
- **Gerenciador de Pacotes:** PNPM
- **Testes:** Jest + Testing Library
- **Linting:** ESLint
- **Formatação:** Prettier
- **CI/CD:** GitHub Actions + Netlify

#### Persistência
- **Banco Local:** IndexedDB via Dexie.js
- **Cache:** LRU Cache
- **Storage:** Local Storage (configurações)

## 📱 Funcionalidades

### 1. Dashboard
- Visão geral financeira
- KPIs principais
- Gráficos interativos
- Filtros por período

### 2. Gestão de Profissionais
- Cadastro e edição
- Visualização em tabela
- Gráficos de custos
- Filtros avançados
- Exportação de dados

### 3. Forecast
- Projeções financeiras
- Análise de tendências
- Gráficos comparativos
- Exportação de relatórios

### 4. Upload de Dados
- Importação via Excel
- Validação de dados
- Processamento em lote
- Histórico de uploads

## 🔒 Segurança

### Autenticação
- Login baseado em token
- Proteção de rotas
- Sessão persistente
- Logout automático

### Headers de Segurança
```toml
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'...
```

### Proteção de Dados
- Sanitização de inputs
- Validação de dados
- Criptografia de dados sensíveis
- Backup automático

## 🚀 Deploy

### CI/CD Pipeline

#### 1. Validação
- Lint check
- Type check
- Testes unitários
- Cobertura de código (80%)

#### 2. Build
- Compilação TypeScript
- Minificação
- Tree shaking
- Geração de sourcemaps

#### 3. Deploy
- Deploy automático na Vercel
- Rollback automático
- Preview de PRs
- Comentários automáticos

### Configuração Vercel
- Build command: `pnpm build`
- Publish directory: `dist`
- Node version: 18
- Framework preset: Vite
- Deploy contexts configurados

## 💻 Desenvolvimento

### Ambiente Local

1. **Preparação**
   ```bash
   # Node.js 18
   nvm use 18
   
   # PNPM
   npm i -g pnpm@8
   
   # Dependências
   pnpm install
   ```

2. **Scripts**
   ```bash
   # Dev
   pnpm dev
   
   # Testes
   pnpm test
   
   # Build
   pnpm build
   ```

### Práticas de Código

#### Padrões de Commit
```bash
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
style: formatação de código
refactor: refatoração de código
test: atualização de testes
chore: atualização de build
```

#### Estrutura de Arquivos
```
src/
├── components/          # Componentes React
│   ├── common/         # Componentes compartilhados
│   └── features/       # Componentes específicos
├── contexts/           # Contextos React
├── hooks/             # Hooks customizados
├── pages/             # Páginas da aplicação
├── services/          # Serviços e APIs
├── styles/            # Estilos globais
├── types/             # Tipos TypeScript
└── utils/             # Funções utilitárias
```

## 📊 Regras de Negócio

### Cálculos Financeiros

#### 1. Receita
- Base: valor bruto das transações
- Impostos: calculados por categoria
- Valor líquido: base - impostos

#### 2. Custos
- Custos fixos: mensais
- Custos variáveis: por projeto
- Overhead: 15% sobre custos

#### 3. Projeções
- Baseadas em histórico
- Ajuste sazonal
- Fatores de correção
- Intervalos de confiança

## 🧪 Testes

### Estrutura
```typescript
describe('Componente', () => {
  beforeEach(() => {
    // Setup
  });

  test('comportamento', () => {
    // Arrange
    render(<Componente />);
    
    // Act
    userEvent.click(...);
    
    // Assert
    expect(...).toBe(...);
  });
});
```

### Cobertura
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## 📈 Performance

### Otimizações
- Code splitting
- Lazy loading
- Memoização
- Virtualização de listas
- Compressão de assets
- Cache de dados

### Métricas
- First Paint: < 1s
- TTI: < 3s
- Bundle size: < 500kb
- Lighthouse score: > 90

## 🔄 Atualizações

### v1.0.0
- Sistema base
- Autenticação
- Dashboard
- Upload

### v1.1.0
- Módulo de Profissionais
- Gráficos avançados
- Melhorias de UI

### v1.2.0
- Forecast
- Exportação
- Otimizações

## 📊 Documentação do Sistema Financeiro

### 🎯 Visão Geral

O Sistema Financeiro é uma aplicação web moderna que oferece uma visão detalhada das finanças da empresa, incluindo planilhas financeiras, previsões (forecast) e análises detalhadas. O sistema foi projetado para fornecer informações precisas e atualizadas para tomada de decisões.

### 📈 Planilhas Financeiras

#### Visão Geral
Página que exibe os dados financeiros históricos dos projetos, organizados por mês, com valores mensais e acumulados.

#### 🔍 Regras de Visualização

##### 1. Seleção de Dados
- Filtro por projeto(s)
- Filtro por ano
- Seleção múltipla de projetos
- Exibição em tabela (valores mensais e acumulados)

##### 2. Layout da Tabela
- **Linhas:** Receita, Desoneração, Custo e Margem
- **Colunas:** Meses do ano (Jan a Dez)
- Duas colunas por mês: Mensal e Acumulado
- Valores centralizados nas células

#### 🧮 Regras de Cálculo

##### 1. Receita
- Considera transações "RECEITA DEVENGADA"
- Mantém sinal original do valor
- Acumulado: Soma até o mês atual

##### 2. Desoneração
- Considera transações "DESONERAÇÃO DA FOLHA"
- Mantém sinal original do valor
- Acumulado: Soma até o mês atual

##### 3. Custo
- Considera: "CLT", "OUTROS", "SUBCONTRATADOS"
- Mantém sinal original (negativo)
- Acumulado: Soma até o mês atual

##### 4. Margem
- **Mensal:** ((Receita - |Custo| + Desoneração) / Receita) * 100
- **Acumulada:** ((Receita Acum. - |Custo Acum.| + Desoneração Acum.) / Receita Acum.) * 100
- Se receita = 0, margem = 0%

#### 🎨 Regras de Cores

##### 1. Receita
- Verde (#198754)
- Aplica-se a valores mensais e acumulados

##### 2. Desoneração
- Azul claro (#0dcaf0)
- Aplica-se a valores mensais e acumulados

##### 3. Custo
- Vermelho (#dc3545)
- Aplica-se a valores mensais e acumulados

##### 4. Margem
- Verde (#28a745) se ≥ 7%
- Vermelho (#dc3545) se < 7%
- Valores em negrito
- Aplica-se a valores mensais e acumulados

#### 📝 Regras de Preenchimento

##### 1. Meses sem Dados
- Se não for primeiro mês do ano:
  - Usa valores do último mês com dados
- Se for primeiro mês sem dados:
  - Exibe zeros em todas as células

##### 2. Anos sem Dados
- Exibe zeros em todas as células
- Mantém formatação padrão

### 📊 Forecast

#### Visão Geral
Página para visualização e edição de previsões financeiras futuras dos projetos.

#### 🔍 Regras de Visualização

##### 1. Seleção de Dados
- Filtro por projeto(s)
- Filtro por ano
- Seleção múltipla de projetos
- Exibição em tabela com valores mensais

##### 2. Layout da Tabela
- **Linhas:** Receita, Custo Total, Margem Bruta, Margem %
- **Colunas:** Meses do ano (Jan a Dez) + Total
- Valores centralizados nas células

#### 🧮 Regras de Cálculo

##### 1. Receita
- Considera "RECEITA DEVENGADA"
- Mantém sinal original
- Total: Soma das receitas mensais

##### 2. Custo Total
- Considera natureza "CUSTO"
- Mantém sinal original (negativo)
- Total: Soma dos custos mensais

##### 3. Margem Bruta
- **Mensal:** Receita + Custo
- **Total:** Soma das margens brutas mensais

##### 4. Margem %
- **Mensal:** (Margem Bruta / |Receita|) * 100
- **Total:** (Margem Bruta Total / |Receita Total|) * 100
- Se receita = 0, margem = 0%

#### 🎨 Regras de Cores

##### 1. Receita
- Verde (#28a745)
- Aplica-se a valores mensais e total

##### 2. Custo Total
- Vermelho (#dc3545)
- Aplica-se a valores mensais e total

##### 3. Margem Bruta
- Azul (#4A90E2)
- Aplica-se a valores mensais e total

##### 4. Margem %
- Verde (#28a745) se ≥ 7%
- Vermelho (#dc3545) se < 7%
- Valores em negrito
- Aplica-se a valores mensais e total

#### ✏️ Regras de Edição

##### 1. Campos Editáveis
- Apenas receita e custo são editáveis
- Somente meses futuros podem ser editados
- Meses passados são somente leitura

##### 2. Validação de Entrada
- Aceita apenas valores numéricos
- Formatação automática como moeda
- Atualização automática das margens

##### 3. Persistência
- Salvamento automático dos valores editados
- Recálculo automático de totais e margens

#### 📝 Regras de Preenchimento

##### 1. Meses sem Dados
- Se não for primeiro mês:
  - Usa valores do último mês com dados
- Se for primeiro mês sem dados:
  - Exibe zeros em todas as células

##### 2. Anos sem Dados
- Exibe zeros em todas as células
- Mantém formatação padrão

### 🔄 Atualizações

#### v1.0.0 (Fevereiro 2024)
- Implementação inicial do sistema
- Módulos de Planilhas Financeiras e Forecast
- Interface responsiva
- Sistema de filtros

#### v1.1.0 (Março 2024)
- Melhorias na interface
- Otimização de performance
- Correções de bugs reportados
- Novos recursos de exportação

#### v1.2.0 (Planejado)
- Novos gráficos e análises
- Melhorias no sistema de previsão
- Integração com mais fontes de dados
- Relatórios personalizados
