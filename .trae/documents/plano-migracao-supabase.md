# 🚀 Plano de Migração Arquitetural - App Financeiro para Supabase

## 📋 Visão Geral da Migração

Este documento detalha a migração completa do App Financeiro de uma arquitetura client-side com IndexedDB para uma arquitetura moderna baseada em:
- **Supabase Edge Functions** para todos os cálculos
- **Microserviços GraphQL com Node.js** para lógica de negócio
- **Supabase Database** como fonte única da verdade
- **Integração com base Profissionais-HITSS**

## 🎯 Objetivos da Migração

### Benefícios Esperados
- ✅ **Escalabilidade**: Processamento server-side para grandes volumes
- ✅ **Consistência**: Dados centralizados no Supabase
- ✅ **Performance**: Cálculos otimizados em Edge Functions
- ✅ **Manutenibilidade**: Separação clara entre frontend e backend
- ✅ **Integração**: Conexão direta com sistemas externos (Profissionais-HITSS)
- ✅ **Segurança**: Regras de negócio protegidas no servidor

### Arquitetura Atual vs Nova

**Atual:**
```
React Frontend → IndexedDB (Local)
```

**Nova:**
```
React Frontend → GraphQL Gateway → Supabase Edge Functions → Supabase Database
                                 ↓
                              Profissionais-HITSS API
```

## 🏗️ Nova Arquitetura Detalhada

### 1. Frontend Layer
- **React 18 + TypeScript** (mantido)
- **Apollo Client** para GraphQL
- **Supabase Auth** para autenticação
- **TailwindCSS + React-Bootstrap** (mantido)

### 2. API Gateway Layer
- **GraphQL Server** (Node.js + Apollo Server)
- **Schema unificado** para todas as operações
- **Resolvers** que chamam Edge Functions
- **Autenticação JWT** integrada com Supabase

### 3. Business Logic Layer (Supabase Edge Functions)
- **Cálculos Financeiros**: Receitas, custos, margens
- **Processamento de Upload**: Validação e normalização
- **Forecast Engine**: Projeções e análises
- **Integração Externa**: Comunicação com Profissionais-HITSS

### 4. Data Layer
- **Supabase PostgreSQL** como banco principal
- **Row Level Security (RLS)** para controle de acesso
- **Triggers** para auditoria e validação
- **Views** para consultas otimizadas

## 📊 Estrutura do Banco de Dados Supabase

### Tabelas Principais

#### 1. projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. financial_transactions
```sql
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receita', 'despesa')),
  nature TEXT NOT NULL CHECK (nature IN ('RECEITA', 'CUSTO')),
  account_code TEXT NOT NULL,
  account_name TEXT,
  account_summary TEXT, -- RECEITA DEVENGADA, DESONERAÇÃO DA FOLHA, etc.
  amount DECIMAL(15,2) NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  description TEXT,
  observations TEXT,
  source_file TEXT,
  upload_batch_id UUID,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_financial_transactions_project_period 
ON financial_transactions(project_id, period_year, period_month);

CREATE INDEX idx_financial_transactions_account_summary 
ON financial_transactions(account_summary);
```

#### 3. professionals
```sql
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT, -- ID do sistema Profissionais-HITSS
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  cost_per_month DECIMAL(10,2),
  professional_type TEXT CHECK (professional_type IN ('CLT', 'SUBCONTRATADO', 'TERCEIRO')),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  sync_source TEXT DEFAULT 'manual', -- 'manual' ou 'hitss'
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_professionals_project ON professionals(project_id);
CREATE INDEX idx_professionals_external_id ON professionals(external_id);
```

#### 4. forecast_data
```sql
CREATE TABLE forecast_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  revenue_forecast DECIMAL(15,2) DEFAULT 0,
  cost_forecast DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_by UUID, -- referência ao usuário
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, period_year, period_month)
);
```

#### 5. upload_batches
```sql
CREATE TABLE upload_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_size INTEGER,
  total_records INTEGER,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_details JSONB,
  uploaded_by UUID, -- referência ao usuário
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### Views para Consultas Otimizadas

#### financial_summary_view
```sql
CREATE VIEW financial_summary_view AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  ft.period_year,
  ft.period_month,
  SUM(CASE WHEN ft.account_summary = 'RECEITA DEVENGADA' THEN ft.amount ELSE 0 END) as revenue,
  SUM(CASE WHEN ft.account_summary = 'DESONERAÇÃO DA FOLHA' THEN ft.amount ELSE 0 END) as tax_relief,
  SUM(CASE WHEN ft.account_summary IN ('CLT', 'SUBCONTRATADOS', 'OUTROS') THEN ft.amount ELSE 0 END) as costs,
  COUNT(*) as transaction_count
FROM projects p
LEFT JOIN financial_transactions ft ON p.id = ft.project_id
GROUP BY p.id, p.name, ft.period_year, ft.period_month;
```

## ⚡ Supabase Edge Functions

### 1. Financial Calculations Function

**Arquivo:** `supabase/functions/financial-calculations/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CalculationRequest {
  projectIds: string[]
  year: number
  month?: number
  calculationType: 'dashboard' | 'planilhas' | 'forecast'
}

interface FinancialMetrics {
  revenue: number
  taxRelief: number
  costs: number
  margin: number
  marginPercentage: number
}

serve(async (req) => {
  try {
    const { projectIds, year, month, calculationType }: CalculationRequest = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar transações financeiras
    let query = supabase
      .from('financial_transactions')
      .select('*')
      .in('project_id', projectIds)
      .eq('period_year', year)

    if (month) {
      query = query.eq('period_month', month)
    }

    const { data: transactions, error } = await query

    if (error) throw error

    // Calcular métricas baseado no tipo
    const metrics = calculateMetrics(transactions, calculationType)

    return new Response(
      JSON.stringify({ success: true, data: metrics }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function calculateMetrics(transactions: any[], type: string): FinancialMetrics {
  const revenue = transactions
    .filter(t => t.account_summary === 'RECEITA DEVENGADA')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const taxRelief = transactions
    .filter(t => t.account_summary === 'DESONERAÇÃO DA FOLHA')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const costs = transactions
    .filter(t => ['CLT', 'SUBCONTRATADOS', 'OUTROS'].includes(t.account_summary))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const margin = revenue + costs + taxRelief // costs já é negativo
  const marginPercentage = revenue !== 0 ? (margin / revenue) * 100 : 0

  return {
    revenue,
    taxRelief,
    costs,
    margin,
    marginPercentage
  }
}
```

### 2. File Upload Processing Function

**Arquivo:** `supabase/functions/process-upload/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface UploadData {
  filename: string
  data: any[]
  batchId: string
}

serve(async (req) => {
  try {
    const { filename, data, batchId }: UploadData = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Criar batch de upload
    const { data: batch, error: batchError } = await supabase
      .from('upload_batches')
      .insert({
        id: batchId,
        filename,
        total_records: data.length,
        status: 'processing'
      })
      .select()
      .single()

    if (batchError) throw batchError

    // Processar e validar dados
    const processedData = data
      .filter(row => row.Relatorio === 'Realizado') // Regra de negócio
      .map(row => ({
        project_id: getProjectId(row.Projeto), // Função para mapear projeto
        transaction_type: row.Natureza === 'RECEITA' ? 'receita' : 'despesa',
        nature: row.Natureza,
        account_code: row.ContaCodigo,
        account_name: row.ContaNome,
        account_summary: normalizeAccountSummary(row.ContaResumo),
        amount: parseFloat(row.Valor) || 0,
        period_year: parseInt(row.Ano),
        period_month: parseInt(row.Mes),
        description: row.Descricao,
        upload_batch_id: batchId,
        raw_data: row
      }))

    // Inserir dados em lotes
    const batchSize = 100
    let processedCount = 0
    let failedCount = 0

    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('financial_transactions')
        .insert(batch)

      if (error) {
        failedCount += batch.length
        console.error('Batch insert error:', error)
      } else {
        processedCount += batch.length
      }
    }

    // Atualizar status do batch
    await supabase
      .from('upload_batches')
      .update({
        processed_records: processedCount,
        failed_records: failedCount,
        status: failedCount === 0 ? 'completed' : 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount, 
        failed: failedCount 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function normalizeAccountSummary(summary: string): string {
  // Implementar normalização baseada nas regras atuais
  const normalized = summary?.toUpperCase().trim()
  
  if (normalized?.includes('RECEITA')) return 'RECEITA DEVENGADA'
  if (normalized?.includes('DESONERAÇÃO')) return 'DESONERAÇÃO DA FOLHA'
  if (normalized?.includes('CLT')) return 'CLT'
  if (normalized?.includes('SUBCONTRATADO')) return 'SUBCONTRATADOS'
  
  return 'OUTROS'
}

function getProjectId(projectName: string): string {
  // Implementar mapeamento de nome para UUID do projeto
  // Por enquanto, retorna um UUID fixo ou busca no banco
  return 'project-uuid-placeholder'
}
```

### 3. Professionals Integration Function

**Arquivo:** `supabase/functions/sync-professionals/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface HITSSProfessional {
  id: string
  nome: string
  cargo: string
  projeto: string
  custo: number
  tipo: string
  dataInicio: string
  dataFim?: string
  ativo: boolean
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar dados da API Profissionais-HITSS
    const hitssApiUrl = Deno.env.get('HITSS_PROFESSIONALS_API_URL')
    const hitssApiKey = Deno.env.get('HITSS_API_KEY')

    const response = await fetch(`${hitssApiUrl}/professionals`, {
      headers: {
        'Authorization': `Bearer ${hitssApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HITSS API error: ${response.status}`)
    }

    const hitssData: HITSSProfessional[] = await response.json()

    // Sincronizar dados
    const syncResults = {
      created: 0,
      updated: 0,
      errors: 0
    }

    for (const hitssProfessional of hitssData) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('professionals')
          .select('id')
          .eq('external_id', hitssProfessional.id)
          .single()

        const professionalData = {
          external_id: hitssProfessional.id,
          name: hitssProfessional.nome,
          position: hitssProfessional.cargo,
          project_id: await getProjectIdByName(hitssProfessional.projeto),
          cost_per_month: hitssProfessional.custo,
          professional_type: hitssProfessional.tipo,
          start_date: hitssProfessional.dataInicio,
          end_date: hitssProfessional.dataFim,
          is_active: hitssProfessional.ativo,
          sync_source: 'hitss',
          last_sync_at: new Date().toISOString()
        }

        if (existing) {
          // Atualizar
          await supabase
            .from('professionals')
            .update(professionalData)
            .eq('external_id', hitssProfessional.id)
          
          syncResults.updated++
        } else {
          // Criar
          await supabase
            .from('professionals')
            .insert(professionalData)
          
          syncResults.created++
        }
      } catch (error) {
        console.error(`Error syncing professional ${hitssProfessional.id}:`, error)
        syncResults.errors++
      }
    }

    return new Response(
      JSON.stringify({ success: true, results: syncResults }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function getProjectIdByName(projectName: string): Promise<string | null> {
  // Implementar busca de projeto por nome
  // Retorna UUID do projeto ou null se não encontrado
  return null
}
```

## 🔗 GraphQL Schema e Resolvers

### Schema Principal

**Arquivo:** `graphql/schema.graphql`

```graphql
type Project {
  id: ID!
  name: String!
  code: String!
  description: String
  status: ProjectStatus!
  transactions: [FinancialTransaction!]!
  professionals: [Professional!]!
  forecastData: [ForecastData!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum ProjectStatus {
  ACTIVE
  INACTIVE
  COMPLETED
}

type FinancialTransaction {
  id: ID!
  project: Project!
  transactionType: TransactionType!
  nature: Nature!
  accountCode: String!
  accountName: String
  accountSummary: String!
  amount: Float!
  periodYear: Int!
  periodMonth: Int!
  description: String
  observations: String
  sourceFile: String
  uploadBatchId: ID
  rawData: JSON
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum TransactionType {
  RECEITA
  DESPESA
}

enum Nature {
  RECEITA
  CUSTO
}

type Professional {
  id: ID!
  externalId: String
  name: String!
  position: String!
  project: Project!
  costPerMonth: Float
  professionalType: ProfessionalType!
  startDate: Date
  endDate: Date
  isActive: Boolean!
  syncSource: String!
  lastSyncAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum ProfessionalType {
  CLT
  SUBCONTRATADO
  TERCEIRO
}

type ForecastData {
  id: ID!
  project: Project!
  periodYear: Int!
  periodMonth: Int!
  revenueForecast: Float!
  costForecast: Float!
  notes: String
  createdBy: ID
  createdAt: DateTime!
  updatedAt: DateTime!
}

type FinancialMetrics {
  revenue: Float!
  taxRelief: Float!
  costs: Float!
  margin: Float!
  marginPercentage: Float!
}

type UploadResult {
  success: Boolean!
  processed: Int!
  failed: Int!
  batchId: ID!
}

type SyncResult {
  success: Boolean!
  created: Int!
  updated: Int!
  errors: Int!
}

input FinancialCalculationInput {
  projectIds: [ID!]!
  year: Int!
  month: Int
  calculationType: CalculationType!
}

enum CalculationType {
  DASHBOARD
  PLANILHAS
  FORECAST
}

input UploadInput {
  filename: String!
  data: [JSON!]!
}

input ForecastUpdateInput {
  projectId: ID!
  periodYear: Int!
  periodMonth: Int!
  revenueForecast: Float
  costForecast: Float
  notes: String
}

type Query {
  # Projetos
  projects: [Project!]!
  project(id: ID!): Project
  
  # Transações Financeiras
  financialTransactions(
    projectIds: [ID!]
    year: Int
    month: Int
    limit: Int
    offset: Int
  ): [FinancialTransaction!]!
  
  # Profissionais
  professionals(
    projectIds: [ID!]
    isActive: Boolean
    limit: Int
    offset: Int
  ): [Professional!]!
  
  # Forecast
  forecastData(
    projectIds: [ID!]
    year: Int
    month: Int
  ): [ForecastData!]!
  
  # Cálculos
  calculateFinancialMetrics(input: FinancialCalculationInput!): FinancialMetrics!
}

type Mutation {
  # Upload de dados
  uploadFinancialData(input: UploadInput!): UploadResult!
  
  # Forecast
  updateForecast(input: ForecastUpdateInput!): ForecastData!
  
  # Sincronização
  syncProfessionals: SyncResult!
}

type Subscription {
  uploadProgress(batchId: ID!): UploadProgress!
}

type UploadProgress {
  batchId: ID!
  status: String!
  processed: Int!
  total: Int!
  errors: [String!]!
}

scalar DateTime
scalar Date
scalar JSON
```

### Resolvers Principais

**Arquivo:** `graphql/resolvers/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { GraphQLError } from 'graphql'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const resolvers = {
  Query: {
    projects: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name')
      
      if (error) throw new GraphQLError(error.message)
      return data
    },

    project: async (_, { id }) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw new GraphQLError(error.message)
      return data
    },

    financialTransactions: async (_, { projectIds, year, month, limit = 100, offset = 0 }) => {
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
        .range(offset, offset + limit - 1)

      if (projectIds?.length) {
        query = query.in('project_id', projectIds)
      }
      if (year) {
        query = query.eq('period_year', year)
      }
      if (month) {
        query = query.eq('period_month', month)
      }

      const { data, error } = await query
      if (error) throw new GraphQLError(error.message)
      return data
    },

    calculateFinancialMetrics: async (_, { input }) => {
      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('financial-calculations', {
        body: input
      })

      if (error) throw new GraphQLError(error.message)
      if (!data.success) throw new GraphQLError(data.error)
      
      return data.data
    }
  },

  Mutation: {
    uploadFinancialData: async (_, { input }) => {
      const batchId = crypto.randomUUID()
      
      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('process-upload', {
        body: {
          ...input,
          batchId
        }
      })

      if (error) throw new GraphQLError(error.message)
      if (!data.success) throw new GraphQLError(data.error)
      
      return {
        success: true,
        processed: data.processed,
        failed: data.failed,
        batchId
      }
    },

    updateForecast: async (_, { input }) => {
      const { data, error } = await supabase
        .from('forecast_data')
        .upsert({
          project_id: input.projectId,
          period_year: input.periodYear,
          period_month: input.periodMonth,
          revenue_forecast: input.revenueForecast,
          cost_forecast: input.costForecast,
          notes: input.notes,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw new GraphQLError(error.message)
      return data
    },

    syncProfessionals: async () => {
      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('sync-professionals')

      if (error) throw new GraphQLError(error.message)
      if (!data.success) throw new GraphQLError(data.error)
      
      return data.results
    }
  },

  // Resolvers de relacionamento
  Project: {
    transactions: async (parent) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('project_id', parent.id)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
      
      if (error) throw new GraphQLError(error.message)
      return data || []
    },

    professionals: async (parent) => {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('project_id', parent.id)
        .eq('is_active', true)
        .order('name')
      
      if (error) throw new GraphQLError(error.message)
      return data || []
    },

    forecastData: async (parent) => {
      const { data, error } = await supabase
        .from('forecast_data')
        .select('*')
        .eq('project_id', parent.id)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
      
      if (error) throw new GraphQLError(error.message)
      return data || []
    }
  },

  FinancialTransaction: {
    project: async (parent) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', parent.project_id)
        .single()
      
      if (error) throw new GraphQLError(error.message)
      return data
    }
  },

  Professional: {
    project: async (parent) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', parent.project_id)
        .single()
      
      if (error) throw new GraphQLError(error.message)
      return data
    }
  },

  ForecastData: {
    project: async (parent) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', parent.project_id)
        .single()
      
      if (error) throw new GraphQLError(error.message)
      return data
    }
  }
}
```

## 🔄 Plano de Implementação por Fases

### Fase 1: Preparação e Infraestrutura (Semana 1-2)

#### Objetivos
- ✅ Configurar ambiente Supabase
- ✅ Criar estrutura do banco de dados
- ✅ Implementar autenticação
- ✅ Configurar CI/CD

#### Tarefas Detalhadas

**1.1 Setup Supabase**
- [ ] Criar projeto no Supabase
- [ ] Configurar variáveis de ambiente
- [ ] Instalar Supabase CLI
- [ ] Configurar migrations

**1.2 Banco de Dados**
- [ ] Executar DDL das tabelas principais
- [ ] Criar índices de performance
- [ ] Configurar Row Level Security (RLS)
- [ ] Criar views otimizadas

**1.3 Autenticação**
- [ ] Configurar Supabase Auth
- [ ] Migrar sistema de login atual
- [ ] Implementar proteção de rotas
- [ ] Configurar políticas RLS

**1.4 CI/CD**
- [ ] Configurar deploy de Edge Functions
- [ ] Setup de testes automatizados
- [ ] Configurar environments (dev/staging/prod)

### Fase 2: Edge Functions e Cálculos (Semana 3-4)

#### Objetivos
- ✅ Migrar todos os cálculos para Edge Functions
- ✅ Implementar processamento de upload
- ✅ Criar APIs para dashboard e planilhas

#### Tarefas Detalhadas

**2.1 Financial Calculations Function**
- [ ] Implementar cálculos de receita
- [ ] Implementar cálculos de custo
- [ ] Implementar cálculos de margem
- [ ] Adicionar suporte a filtros
- [ ] Otimizar queries
- [ ] Testes unitários

**2.2 Upload Processing Function**
- [ ] Implementar validação de dados
- [ ] Implementar normalização
- [ ] Adicionar processamento em lotes
- [ ] Implementar tratamento de erros
- [ ] Adicionar logging
- [ ] Testes de integração

**2.3 Forecast Function**
- [ ] Implementar cálculos de projeção
- [ ] Adicionar validação de dados futuros
- [ ] Implementar persistência
- [ ] Adicionar APIs de consulta

### Fase 3: GraphQL Gateway (Semana 5-6)

#### Objetivos
- ✅ Implementar servidor GraphQL
- ✅ Criar schema unificado
- ✅ Implementar resolvers
- ✅ Configurar Apollo Client no frontend

#### Tarefas Detalhadas

**3.1 Servidor GraphQL**
- [ ] Setup Apollo Server
- [ ] Configurar middleware de autenticação
- [ ] Implementar rate limiting
- [ ] Configurar CORS
- [ ] Setup de logging

**3.2 Schema e Resolvers**
- [ ] Definir schema completo
- [ ] Implementar resolvers de Query
- [ ] Implementar resolvers de Mutation
- [ ] Implementar resolvers de relacionamento
- [ ] Adicionar validação de inputs

**3.3 Frontend Integration**
- [ ] Instalar Apollo Client
- [ ] Configurar cache
- [ ] Migrar chamadas de API
- [ ] Implementar error handling
- [ ] Adicionar loading states

### Fase 4: Migração de Dados (Semana 7)

#### Objetivos
- ✅ Migrar dados do IndexedDB para Supabase
- ✅ Validar integridade dos dados
- ✅ Implementar sincronização

#### Tarefas Detalhadas

**4.1 Script de Migração**
- [ ] Criar script de extração do IndexedDB
- [ ] Implementar transformação de dados
- [ ] Criar script de inserção no Supabase
- [ ] Adicionar validação de dados
- [ ] Implementar rollback

**4.2 Validação**
- [ ] Comparar totais antes/depois
- [ ] Validar cálculos
- [ ] Testar queries complexas
- [ ] Verificar performance

### Fase 5: Integração Profissionais-HITSS (Semana 8)

#### Objetivos
- ✅ Implementar sincronização com API externa
- ✅ Criar interface de gerenciamento
- ✅ Configurar sincronização automática

#### Tarefas Detalhadas

**5.1 Sync Function**
- [ ] Implementar chamada à API HITSS
- [ ] Adicionar mapeamento de dados
- [ ] Implementar upsert logic
- [ ] Adicionar tratamento de erros
- [ ] Configurar retry logic

**5.2 Interface de Gerenciamento**
- [ ] Criar página de sincronização
- [ ] Adicionar logs de sincronização
- [ ] Implementar sincronização manual
- [ ] Adicionar métricas

**5.3 Automação**
- [ ] Configurar cron job
- [ ] Implementar webhooks
- [ ] Adicionar notificações
- [ ] Configurar monitoramento

### Fase 6: Otimização e Testes (Semana 9-10)

#### Objetivos
- ✅ Otimizar performance
- ✅ Implementar testes completos
- ✅ Configurar monitoramento
- ✅ Preparar para produção

#### Tarefas Detalhadas

**6.1 Performance**
- [ ] Otimizar queries do banco
- [ ] Implementar cache no GraphQL
- [ ] Otimizar Edge Functions
- [ ] Configurar CDN
- [ ] Implementar lazy loading

**6.2 Testes**
- [ ] Testes unitários das Edge Functions
- [ ] Testes de integração do GraphQL
- [ ] Testes E2E do frontend
- [ ] Testes de carga
- [ ] Testes de segurança

**6.3 Monitoramento**
- [ ] Configurar Supabase Analytics
- [ ] Implementar logging estruturado
- [ ] Configurar alertas
- [ ] Criar dashboards de métricas
- [ ] Implementar health checks

**6.4 Documentação**
- [ ] Documentar APIs GraphQL
- [ ] Criar guias de deployment
- [ ] Documentar troubleshooting
- [ ] Criar runbooks operacionais

## 🚀 Deploy e Configuração

### Estrutura de Diretórios

```
app-financeiro/
├── frontend/                 # React App (existente)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # GraphQL Server (novo)
│   ├── src/
│   │   ├── schema/
│   │   ├── resolvers/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── package.json
│   └── Dockerfile
├── supabase/                 # Supabase Config (novo)
│   ├── functions/
│   │   ├── financial-calculations/
│   │   ├── process-upload/
│   │   └── sync-professionals/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── scripts/                  # Scripts de migração
│   ├── migrate-data.ts
│   ├── validate-migration.ts
│   └── setup-environment.ts
└── docs/                     # Documentação
    ├── api-reference.md
    ├── deployment-guide.md
    └── troubleshooting.md
```

### Configuração de Ambiente

**Frontend (.env.local)**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GRAPHQL_ENDPOINT=https://your-graphql-server.com/graphql
```

**Backend (.env)**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HITSS_PROFESSIONALS_API_URL=https://api.hitss.com
HITSS_API_KEY=your-hitss-api-key
JWT_SECRET=your-jwt-secret
PORT=4000
```

**Supabase (config.toml)**
```toml
project_id = "your-project-id"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://your-domain.com"]
jwt_expiry = 3600

[edge_functions]
enabled = true
```

## 📊 Métricas e Monitoramento

### KPIs de Performance
- **Response Time**: < 200ms para queries simples
- **Throughput**: > 1000 requests/min
- **Error Rate**: < 1%
- **Uptime**: > 99.9%

### Métricas de Negócio
- **Upload Success Rate**: > 95%
- **Data Accuracy**: 100% (validação automática)
- **Sync Success Rate**: > 98%
- **User Satisfaction**: > 4.5/5

### Alertas Configurados
- Edge Function errors > 5%
- Database connection issues
- Upload processing failures
- Sync failures com HITSS
- High response times (> 1s)

## 🔒 Segurança e Compliance

### Row Level Security (RLS)

```sql
-- Política para projetos
CREATE POLICY "Users can view projects they have access to" ON projects
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM project_access WHERE project_id = projects.id
  ));

-- Política para transações financeiras
CREATE POLICY "Users can view financial data for their projects" ON financial_transactions
  FOR SELECT USING (project_id IN (
    SELECT project_id FROM project_access WHERE user_id = auth.uid()
  ));

-- Política para profissionais
CREATE POLICY "Users can view professionals for their projects" ON professionals
  FOR SELECT USING (project_id IN (
    SELECT project_id FROM project_access WHERE user_id = auth.uid()
  ));
```

### Auditoria

```sql
-- Tabela de auditoria
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, old_values, new_values, user_id)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

## 🎯 Próximos Passos

### Imediatos (Próximas 2 semanas)
1. **Aprovação do plano** pela equipe técnica
2. **Setup do ambiente** Supabase
3. **Criação das tabelas** e estrutura inicial
4. **Implementação da primeira Edge Function** (cálculos financeiros)

### Médio Prazo (1-2 meses)
1. **Migração completa** dos dados
2. **Implementação do GraphQL** gateway
3. **Integração com Profissionais-HITSS**
4. **Testes e otimização**

### Longo Prazo (3-6 meses)
1. **Expansão das funcionalidades**
2. **Integração com outros sistemas**
3. **Analytics avançados**
4. **Machine Learning** para previsões

---

**📝 Nota:** Este plano é um documento vivo e deve ser atualizado conforme o progresso da implementação e feedback da equipe.

**🔗 Links Úteis:**
- [Supabase Documentation](https://supabase.com/docs)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
