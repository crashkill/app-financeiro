# Supabase Edge Functions - App Financeiro

Este diretório contém as Edge Functions do Supabase para o sistema de gestão financeira. As Edge Functions são executadas no edge da rede Supabase, proporcionando baixa latência e alta performance.

## Estrutura das Functions

```
supabase/functions/
├── _shared/                    # Módulos compartilhados
│   ├── cors.ts                # Configuração CORS
│   ├── auth.ts                # Autenticação e autorização
│   ├── logger.ts              # Sistema de logging
│   └── database.ts            # Serviços de banco de dados
├── calculate-financial-metrics/ # Cálculo de métricas financeiras
│   ├── index.ts               # Handler principal
│   ├── types.ts               # Tipos TypeScript
│   └── financial-calculator.ts # Lógica de cálculo
├── process-file-upload/        # Processamento de uploads
│   ├── index.ts               # Handler principal
│   ├── parsers/               # Parsers de arquivo
│   │   ├── excel-parser.ts    # Parser Excel
│   │   └── csv-parser.ts      # Parser CSV
│   └── validators/            # Validadores de dados
│       ├── dre-validator.ts   # Validador DRE
│       ├── financial-validator.ts # Validador financeiro
│       └── business-rules-validator.ts # Regras de negócio
├── sync-professionals/         # Sincronização de profissionais
│   ├── index.ts               # Handler principal
│   ├── types.ts               # Tipos TypeScript
│   └── professional-sync-service.ts # Serviço de sincronização
├── generate-forecast/          # Geração de previsões
│   ├── index.ts               # Handler principal
│   ├── types.ts               # Tipos TypeScript
│   └── forecast-service.ts    # Serviço de previsão
├── deno.json                  # Configuração Deno
└── README.md                  # Esta documentação
```

## Functions Disponíveis

### 1. calculate-financial-metrics

**Endpoint:** `POST /functions/v1/calculate-financial-metrics`

**Descrição:** Calcula métricas financeiras baseadas em dados históricos.

**Parâmetros:**
```typescript
{
  metricsType: 'revenue' | 'cost' | 'margin' | 'forecast' | 'summary',
  period: {
    startDate: string, // YYYY-MM-DD
    endDate: string    // YYYY-MM-DD
  },
  filters?: {
    accountCodes?: string[],
    departments?: string[],
    costCenters?: string[]
  },
  options?: {
    includeDetails?: boolean,
    groupBy?: 'month' | 'quarter' | 'year',
    compareWithPrevious?: boolean
  }
}
```

**Resposta:**
```typescript
{
  success: boolean,
  message: string,
  data: {
    metricsType: string,
    period: { startDate: string, endDate: string },
    summary: {
      totalRevenue: number,
      totalCost: number,
      grossMargin: number,
      netMargin: number
    },
    details?: MonthlyData[],
    forecast?: ForecastData,
    comparison?: ComparisonData
  }
}
```

### 2. process-file-upload

**Endpoint:** `POST /functions/v1/process-file-upload`

**Descrição:** Processa uploads de arquivos Excel/CSV com dados financeiros ou DRE.

**Parâmetros:**
- Arquivo via FormData
- `uploadType`: 'dre' | 'financial'
- `options`: configurações de processamento

**Resposta:**
```typescript
{
  success: boolean,
  message: string,
  data: {
    uploadId: string,
    fileName: string,
    recordsProcessed: number,
    recordsWithErrors: number,
    errors?: ValidationError[],
    summary: ProcessingSummary
  }
}
```

### 3. sync-professionals

**Endpoint:** `POST /functions/v1/sync-professionals`

**Descrição:** Sincroniza dados de profissionais com sistemas externos.

**Parâmetros:**
```typescript
{
  syncType: 'full' | 'incremental' | 'external_api',
  professionals?: Professional[],
  externalApiConfig?: {
    url: string,
    headers: Record<string, string>,
    mapping: FieldMapping
  },
  options?: {
    batchSize?: number,
    conflictResolution?: 'ignore' | 'update' | 'error'
  }
}
```

### 4. generate-forecast

**Endpoint:** `POST /functions/v1/generate-forecast`

**Descrição:** Gera previsões financeiras usando diferentes algoritmos.

**Parâmetros:**
```typescript
{
  forecastType: 'revenue' | 'cost' | 'profit' | 'cashflow' | 'comprehensive',
  periods: number, // 1-24 meses
  algorithm: 'linear_regression' | 'moving_average' | 'exponential_smoothing' | 'arima',
  filters?: {
    accountCodes?: string[],
    departments?: string[]
  },
  options?: {
    includeConfidenceIntervals?: boolean,
    includeScenarios?: boolean,
    saveToDatabase?: boolean
  }
}
```

## Autenticação

Todas as functions requerem autenticação via JWT token do Supabase:

```javascript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: requestData,
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})
```

## Desenvolvimento Local

### Pré-requisitos

1. **Deno** instalado (v1.37+)
2. **Supabase CLI** instalado
3. **Docker** para banco local

### Configuração

1. Iniciar o ambiente Supabase local:
```bash
supabase start
```

2. Aplicar migrações:
```bash
supabase db reset
```

3. Servir as functions localmente:
```bash
supabase functions serve
```

### Testando Functions

```bash
# Testar calculate-financial-metrics
curl -X POST 'http://localhost:54321/functions/v1/calculate-financial-metrics' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "metricsType": "summary",
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  }'

# Testar generate-forecast
curl -X POST 'http://localhost:54321/functions/v1/generate-forecast' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "forecastType": "revenue",
    "periods": 12,
    "algorithm": "linear_regression"
  }'
```

## Deploy

### Deploy Individual

```bash
# Deploy uma function específica
supabase functions deploy calculate-financial-metrics

# Deploy com secrets
supabase secrets set OPENAI_API_KEY=your_key
supabase functions deploy generate-forecast
```

### Deploy Todas

```bash
# Deploy todas as functions
supabase functions deploy
```

## Monitoramento

### Logs

```bash
# Ver logs em tempo real
supabase functions logs calculate-financial-metrics

# Ver logs com filtro
supabase functions logs --filter="level=error"
```

### Métricas

As functions incluem logging estruturado para monitoramento:

- **Performance**: Tempo de execução, uso de memória
- **Erros**: Stack traces, contexto de erro
- **Auditoria**: Operações realizadas, usuário
- **Negócio**: Métricas calculadas, dados processados

## Segurança

### Autenticação
- JWT tokens obrigatórios
- Validação de usuário ativo
- Rate limiting automático

### Autorização
- Row Level Security (RLS) no banco
- Validação de permissões por função
- Isolamento de dados por usuário

### Validação
- Sanitização de inputs
- Validação de tipos TypeScript
- Regras de negócio aplicadas

## Troubleshooting

### Problemas Comuns

1. **Erro de CORS**
   - Verificar configuração em `_shared/cors.ts`
   - Confirmar origins permitidas

2. **Erro de Autenticação**
   - Verificar JWT token válido
   - Confirmar usuário ativo no Supabase

3. **Timeout**
   - Verificar tamanho dos dados
   - Otimizar queries de banco
   - Considerar processamento em lotes

4. **Erro de Validação**
   - Verificar formato dos dados
   - Consultar tipos TypeScript
   - Validar regras de negócio

### Debug

```typescript
// Habilitar logs detalhados
const logger = new Logger('debug')

// Adicionar breakpoints
console.log('Debug point:', { data, context })

// Verificar performance
const start = performance.now()
// ... código ...
const duration = performance.now() - start
logger.info('Performance', { duration })
```

## Contribuição

1. Seguir padrões TypeScript
2. Adicionar testes unitários
3. Documentar mudanças
4. Validar com lint/format

```bash
# Formatar código
deno fmt supabase/functions/

# Verificar tipos
deno check supabase/functions/**/*.ts

# Executar testes
deno test supabase/functions/
```

## Recursos Adicionais

- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Manual](https://deno.land/manual)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)