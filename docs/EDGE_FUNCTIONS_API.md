# Documentação das Edge Functions - API

## Visão Geral

Este documento descreve todas as Edge Functions disponíveis no sistema financeiro, incluindo endpoints, parâmetros, exemplos de uso e respostas esperadas.

## Configuração Base

**URL Base (Desenvolvimento Local):** `http://127.0.0.1:54321/functions/v1/`

**Chaves de Autenticação:**
- **anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **service_role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`

---

## 1. Calculate Financial Metrics

**Endpoint:** `POST /calculate-financial-metrics`

**Descrição:** Calcula métricas financeiras baseadas em dados de transações.

**Autenticação:** Requerida (service_role)

**Parâmetros:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "metrics": ["revenue", "expenses", "profit_margin"]
}
```

**Exemplo de Uso:**
```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/calculate-financial-metrics' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU' \
  -H 'Content-Type: application/json' \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "metrics": ["revenue", "expenses", "profit_margin"]
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "revenue": 150000.00,
    "expenses": 120000.00,
    "profit_margin": 0.20,
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  },
  "executionTime": 245
}
```

---

## 2. Process File Upload

**Endpoint:** `POST /process-file-upload`

**Descrição:** Processa upload de arquivos DRE (Demonstração do Resultado do Exercício).

**Autenticação:** Requerida (service_role)

**Parâmetros:** Multipart form data com arquivo

**Exemplo de Uso:**
```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/process-file-upload' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU' \
  -F 'file=@test-dre.csv' \
  -F 'fileType=dre' \
  -F 'period=2024-Q1'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "uploadId": "upload-123",
    "fileName": "test-dre.csv",
    "recordsProcessed": 150,
    "recordsInserted": 148,
    "recordsSkipped": 2,
    "errors": []
  },
  "executionTime": 1250
}
```

---

## 3. Sync Professionals

**Endpoint:** `POST /sync-professionals`

**Descrição:** Sincroniza dados de profissionais com sistemas externos.

**Autenticação:** Requerida (service_role)

**Parâmetros:**
```json
{
  "professionals": [
    {
      "id": "prof-001",
      "nome": "João Silva",
      "email": "joao.silva@empresa.com",
      "departamento": "TI",
      "cargo": "Desenvolvedor Senior",
      "salario": 8500.00,
      "status": "Ativo"
    }
  ]
}
```

**Exemplo de Uso:**
```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/sync-professionals' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU' \
  -H 'Content-Type: application/json' \
  -d '{
    "professionals": [
      {
        "id": "prof-001",
        "nome": "João Silva",
        "email": "joao.silva@empresa.com",
        "departamento": "TI",
        "cargo": "Desenvolvedor Senior",
        "salario": 8500.00,
        "status": "Ativo"
      }
    ]
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "totalProcessed": 1,
    "created": 1,
    "updated": 0,
    "skipped": 0,
    "errors": 0
  },
  "executionTime": 156
}
```

---

## 4. Generate Forecast

**Endpoint:** `POST /generate-forecast`

**Descrição:** Gera previsões financeiras usando algoritmos de machine learning.

**Autenticação:** Requerida (authenticated)

**Parâmetros:**
```json
{
  "forecastType": "revenue",
  "periods": 12,
  "algorithm": "linear_regression",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Exemplo de Uso:**
```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/generate-forecast' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -H 'Content-Type: application/json' \
  -d '{
    "forecastType": "revenue",
    "periods": 12,
    "algorithm": "linear_regression",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "forecastId": "forecast-456",
    "forecastType": "revenue",
    "algorithm": "linear_regression",
    "periods": 12,
    "confidence": 0.85,
    "predictions": [
      {
        "period": "2025-01",
        "value": 125000.00,
        "confidence_lower": 115000.00,
        "confidence_upper": 135000.00
      }
    ],
    "metrics": {
      "mape": 0.08,
      "rmse": 5420.30
    }
  },
  "executionTime": 2340
}
```

---

## 5. Audit Logs

**Endpoint:** `GET /audit-logs`

**Descrição:** Recupera logs de auditoria do sistema.

**Autenticação:** Requerida (authenticated)

**Parâmetros de Query:**
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)
- `action`: Tipo de ação (opcional)
- `userId`: ID do usuário (opcional)
- `limit`: Limite de registros (padrão: 100)

**Exemplo de Uso:**
```bash
curl -X GET 'http://127.0.0.1:54321/functions/v1/audit-logs?startDate=2024-01-01&endDate=2024-12-31&limit=50' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
```

---

## 6. Export Reports

**Endpoint:** `POST /export-reports`

**Descrição:** Exporta relatórios financeiros em diferentes formatos.

**Autenticação:** Requerida (authenticated)

**Parâmetros:**
```json
{
  "reportType": "financial_summary",
  "format": "pdf",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "filters": {
    "department": "TI",
    "includeCharts": true
  }
}
```

**Exemplo de Uso:**
```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/export-reports' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -H 'Content-Type: application/json' \
  -d '{
    "reportType": "financial_summary",
    "format": "pdf",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }'
```

---

## 7. Validate Data

**Endpoint:** `POST /validate-data`

**Descrição:** Valida integridade e consistência dos dados financeiros.

**Autenticação:** Requerida (service_role)

**Parâmetros:**
```json
{
  "validationType": "financial_transactions",
  "period": "2024-Q1",
  "rules": ["balance_check", "duplicate_check", "format_validation"]
}
```

**Exemplo de Uso:**
```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/validate-data' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU' \
  -H 'Content-Type: application/json' \
  -d '{
    "validationType": "financial_transactions",
    "period": "2024-Q1",
    "rules": ["balance_check", "duplicate_check"]
  }'
```

---

## Códigos de Status HTTP

- **200 OK:** Requisição processada com sucesso
- **400 Bad Request:** Parâmetros inválidos ou dados malformados
- **401 Unauthorized:** Token de autenticação inválido ou ausente
- **403 Forbidden:** Permissões insuficientes
- **404 Not Found:** Endpoint não encontrado
- **500 Internal Server Error:** Erro interno do servidor

## Estrutura de Resposta Padrão

```json
{
  "success": boolean,
  "data": object | array,
  "error": {
    "code": "string",
    "message": "string",
    "details": object
  },
  "executionTime": number,
  "timestamp": "ISO 8601 string"
}
```

## Notas Importantes

1. **Rate Limiting:** As Edge Functions têm limite de 100 requisições por minuto por IP
2. **Timeout:** Timeout máximo de 30 segundos por requisição
3. **Tamanho do Payload:** Máximo de 10MB por requisição
4. **CORS:** Configurado para aceitar requisições do frontend local
5. **Logs:** Todas as requisições são registradas para auditoria

## Troubleshooting

### Erro 401 - Unauthorized
- Verifique se o token de autorização está correto
- Confirme se está usando a chave apropriada (anon vs service_role)

### Erro 403 - Forbidden
- Verifique as permissões RLS no banco de dados
- Confirme se o usuário tem as permissões necessárias

### Erro 500 - Internal Server Error
- Verifique os logs do Supabase Functions
- Confirme se o banco de dados está acessível
- Verifique se todas as dependências estão instaladas

---

**Última atualização:** 10 de agosto de 2025
**Versão da API:** 1.0.0