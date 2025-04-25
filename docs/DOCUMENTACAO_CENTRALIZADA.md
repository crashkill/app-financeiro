# 📚 Documentação Centralizada do App Financeiro

## 📋 Índice
1. [Visão Geral](#-visão-geral)
2. [Arquitetura e Tecnologias](#-arquitetura-e-tecnologias)
3. [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados)
4. [Módulos e Funcionalidades](#-módulos-e-funcionalidades)
5. [Regras de Negócio e Cálculos](#-regras-de-negócio-e-cálculos)
6. [Padrões de UI/UX](#-padrões-de-uiux)
7. [Guia de Desenvolvimento](#-guia-de-desenvolvimento)
8. [Segurança](#-segurança)
9. [Performance](#-performance)
10. [Atualizações e Versionamento](#-atualizações-e-versionamento)

## 🎯 Visão Geral

O App Financeiro é uma aplicação web moderna para gestão financeira empresarial da Global Hitss, construída com React e TypeScript. O sistema oferece ferramentas completas para análise financeira, gestão de profissionais e previsões orçamentárias.

### Objetivos Principais
- Centralizar informações financeiras dos projetos
- Facilitar a visualização e análise de dados financeiros
- Permitir a gestão de previsões financeiras (forecast)
- Simplificar o gerenciamento de profissionais alocados em projetos
- Oferecer ferramentas de importação de dados via Excel

## 🏗️ Arquitetura e Tecnologias

### Frontend
- **Framework:** React 18 com TypeScript
- **Build Tool:** Vite
- **Estilização:** TailwindCSS + React-Bootstrap
- **Gerenciamento de Estado:** React Context + Hooks
- **Roteamento:** React Router v6
- **Gráficos:** Chart.js + react-chartjs-2
- **Tabelas:** Handsontable
- **Formulários:** React Hook Form + Zod

### Desenvolvimento
- **Linguagem:** TypeScript
- **Gerenciador de Pacotes:** PNPM
- **Testes:** Jest + Testing Library
- **Linting:** ESLint
- **Formatação:** Prettier
- **CI/CD:** GitHub Actions + Netlify

### Persistência
- **Banco Local:** IndexedDB via Dexie.js
- **Cache:** LRU Cache
- **Storage:** Local Storage (configurações)

### Estrutura de Diretórios
```
src/
├── components/     # Componentes React
├── contexts/       # Contextos React
├── db/             # Configuração do banco de dados
├── hooks/          # Hooks customizados
├── pages/          # Páginas da aplicação
├── services/       # Serviços e APIs
├── styles/         # Estilos globais
├── types/          # Tipos TypeScript
└── utils/          # Funções utilitárias
```

## 🗃️ Estrutura do Banco de Dados

O sistema utiliza IndexedDB através da biblioteca Dexie.js para armazenamento local.

### Tabelas Principais

#### 1. Transacoes
```typescript
interface Transacao {
  id?: number
  tipo: 'receita' | 'despesa'
  natureza: 'RECEITA' | 'CUSTO'
  descricao: string
  valor: number
  data: string
  categoria: string
  observacao?: string
  lancamento: number
  projeto?: string
  periodo: string // Formato: "M/YYYY"
  denominacaoConta?: string
  contaResumo?: string // Identifica tipos como "RECEITA DEVENGADA" ou "DESONERAÇÃO DA FOLHA"
}
```

#### 2. Profissionais
```typescript
interface Profissional {
  id?: number
  nome: string
  cargo: string
  projeto: string
  custo: number
  tipo: string
}
```

### Índices e Relações
- Transações indexadas por projeto, período, descrição e contaResumo
- Profissionais indexados por nome, cargo, projeto e tipo

### Normalização de Dados
- Valores monetários são normalizados para números
- Períodos são normalizados para o formato "M/YYYY"
- ContaResumo é normalizado para categorias padrão (RECEITA DEVENGADA, DESONERAÇÃO DA FOLHA, CLT, SUBCONTRATADOS, OUTROS)

## 📱 Módulos e Funcionalidades

### 1. Dashboard
- Visão geral financeira com indicadores-chave
- Exibição de Receita Total e Custo Total
- Gráficos interativos de distribuição de receitas e custos
- Filtros por projeto e ano

### 2. Planilhas Financeiras
- Visualização detalhada de dados financeiros históricos
- Exibição de valores mensais e acumulados
- Categorias: Receita, Desoneração, Custo e Margem
- Filtros por projeto, ano e mês

### 3. Forecast
- Projeções financeiras futuras
- Edição de valores para meses futuros
- Cálculo automático de margens
- Visualização tabular e gráfica
- Exportação para Excel

### 4. Gestão de Profissionais
- Listagem de profissionais por projeto
- Visualização de custos por tipo (CLT, SUBCONTRATADOS, OUTROS)
- Gráficos de distribuição de custos
- Filtros avançados (projeto, ano, mês)

### 5. Upload de Dados
- Importação via arquivos Excel
- Validação automática de dados
- Normalização dos valores e categorias
- Preview dos dados antes da importação
- Feedback de status da importação

### 6. Consulta SAP
- Interface para consultas ao sistema SAP
- Filtros avançados
- Exportação de resultados
- Visualização em tabela de dados

### 7. Documentação
- Informações sobre o sistema e suas funcionalidades
- Guias de uso e boas práticas
- Descrição das regras de negócio
- Instruções para desenvolvedores

## 📊 Regras de Negócio e Cálculos

### Dashboard

#### Cálculo de Receita Total
- Soma de todas as transações com:
  - `natureza === 'RECEITA' && contaResumo === 'RECEITA DEVENGADA'`
  - OU `contaResumo === 'DESONERAÇÃO DA FOLHA'`
- Mantém sinal original dos valores

#### Cálculo de Custo Total
- Soma de todas as transações com:
  - `natureza === 'CUSTO' && (contaResumo inclui 'CLT' || 'SUBCONTRATADOS' || 'OUTROS')`
- Mantém sinal original (negativo)

### Planilhas Financeiras

#### Receita
- Considera transações "RECEITA DEVENGADA"
- Mantém sinal original
- Acumulado: Soma até o mês atual

#### Desoneração
- Considera transações "DESONERAÇÃO DA FOLHA"
- Mantém sinal original
- Acumulado: Soma até o mês atual

#### Custo
- Considera: "CLT", "OUTROS", "SUBCONTRATADOS"
- Mantém sinal original (negativo)
- Acumulado: Soma até o mês atual

#### Cálculo de Margem
- **Mensal:** ((Receita - |Custo| + Desoneração) / Receita) * 100
- **Acumulada:** ((Receita Acum. - |Custo Acum.| + Desoneração Acum.) / Receita Acum.) * 100
- Se receita = 0, margem = 0%

### Forecast

#### Receita
- Considera "RECEITA DEVENGADA"
- Mantém sinal original
- Total: Soma das receitas mensais

#### Custo Total
- Considera natureza "CUSTO"
- Mantém sinal original (negativo)
- Total: Soma dos custos mensais

#### Margem Bruta
- **Mensal:** Receita + Custo
- **Total:** Soma das margens brutas mensais

#### Margem %
- **Mensal:** (Margem Bruta / |Receita|) * 100
- **Total:** (Margem Bruta Total / |Receita Total|) * 100
- Se receita = 0, margem = 0%

### Regras de Importação de Dados
- Apenas registros com `Relatorio === 'Realizado'` são importados
- Valores são normalizados para formato numérico
- ContaResumo é normalizado para categorias padrão
- Os valores mantêm seus sinais originais durante a importação

## 🎨 Padrões de UI/UX

### Cores do Sistema

#### Cores Principais
- **Primária:** #0d6efd (Azul)
- **Secundária:** #6c757d (Cinza)
- **Sucesso:** #198754 (Verde)
- **Perigo:** #dc3545 (Vermelho)
- **Alerta:** #ffc107 (Amarelo)
- **Info:** #0dcaf0 (Azul claro)

#### Cores por Categoria Financeira
- **Receita:** #198754 (Verde)
- **Desoneração:** #0dcaf0 (Azul claro)
- **Custo:** #dc3545 (Vermelho)
- **Margem ≥ 7%:** #28a745 (Verde)
- **Margem < 7%:** #dc3545 (Vermelho)

### Layout e Componentes
- Design responsivo baseado em Bootstrap
- Navegação lateral via Sidebar
- Formulários padronizados
- Tabelas com paginação e ordenação
- Cards para informações resumidas
- Gráficos interativos

### Feedback ao Usuário
- Mensagens de sucesso, erro e alerta
- Indicadores de progresso em operações longas
- Tooltips para campos e botões
- Validação interativa de formulários
- Confirmações para ações destrutivas

## 💻 Guia de Desenvolvimento

### Preparação do Ambiente
```bash
# Requisitos: Node.js 18+ e PNPM 8+

# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev

# Construir para produção
pnpm build

# Executar testes
pnpm test
```

### Convenções de Código
- Idioma: Português BR para interface, Inglês para código
- Nomes de componentes: PascalCase
- Nomes de funções e variáveis: camelCase
- Indentação: 2 espaços
- Ponto e vírgula: obrigatório
- Aspas: simples para strings

### Padrões de Commit
```
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
style: formatação de código
refactor: refatoração de código
test: atualização de testes
chore: atualização de build
```

### Importação de Dados
Para importar dados para o sistema:
1. Usar arquivos Excel (.xlsx)
2. Garantir que haja colunas para: Projeto, Periodo, Lancamento, Natureza, ContaResumo
3. Usar a página de Upload para importação
4. Validar os dados importados nas páginas relevantes

## 🔒 Segurança

### Autenticação
- Login baseado em usuário/senha simples
- Proteção de rotas via React Router
- Sessão persistente em localStorage
- Logout automático após inatividade

### Manipulação de Dados
- Validação de dados em formulários
- Sanitização de inputs
- Prevenção de XSS

### Proteção da Aplicação
- Headers de segurança configurados
- CSP implementada
- HTTPS obrigatório em produção

## 📈 Performance

### Otimizações Implementadas
- Lazy loading de componentes
- Memoização de cálculos pesados
- Filtros e busca otimizados
- Virtualização para listas longas

### Métricas Alvo
- First Paint: < 1s
- TTI: < 3s
- Bundle size: < 500kb
- Lighthouse score: > 90

## 🔄 Atualizações e Versionamento

### v1.0.0
- Sistema base
- Dashboard e Upload
- Autenticação básica
- Importação de dados

### v1.1.0
- Módulo de Gestão de Profissionais
- Melhorias na interface
- Correções de bugs

### v1.2.0 (Atual)
- Novas regras de cálculo para Receita e Custo
- Correções na normalização de dados
- Adição da tabela de Profissionais
- Documentação centralizada
- Otimização de performance

### v1.3.0 (Planejado)
- Relatórios avançados
- Exportação para múltiplos formatos
- Integração com APIs externas
- Dashboard personalizado

## 📝 Notas de Implementação

### Bibliotecas Essenciais
- **react-bootstrap:** Componentes de UI
- **chart.js:** Visualização de dados
- **dexie.js:** Gerenciamento de IndexedDB
- **xlsx:** Importação/exportação de Excel

### Considerações Específicas
- A aplicação é executada inteiramente no cliente, sem backend
- Os dados são armazenados localmente no navegador
- Recarga completa da página limpa o estado, mas os dados persistem no IndexedDB
- Para desenvolvimento, acessar via `http://localhost:3000`

### Problemas Conhecidos e Soluções
- **Valores não aparecem no Dashboard:** Verifique se há dados com "RECEITA DEVENGADA" ou "DESONERAÇÃO DA FOLHA"
- **Erro na página de Gestão de Profissionais:** A tabela Profissionais deve estar configurada no IndexedDB
- **Problemas com importação:** Use o formato ArrayBuffer para leitura de Excel, não BinaryString 