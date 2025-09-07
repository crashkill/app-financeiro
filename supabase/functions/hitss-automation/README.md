# 🤖 HITSS Automation - Edge Function

Automação completa para login na plataforma HITSS, download de arquivos XLSX e importação automática de dados financeiros no banco de dados.

## 📋 Visão Geral

Esta Edge Function implementa um sistema robusto de automação que:

- 🔐 **Login Automático**: Acessa a plataforma HITSS usando credenciais seguras
- 📥 **Download Inteligente**: Baixa arquivos XLSX automaticamente
- 📊 **Processamento de Dados**: Valida e transforma dados do Excel
- 💾 **Importação Segura**: Insere dados no banco com validação
- ⏰ **Execução Agendada**: Roda diariamente via Supabase Cron
- 📝 **Logs Detalhados**: Sistema completo de auditoria e monitoramento

## 🏗️ Arquitetura

```
📁 hitss-automation/
├── 📄 index.ts                    # Endpoint principal da Edge Function
├── 📄 types.ts                    # Definições de tipos TypeScript
├── 📄 hitss-automation-service.ts # Serviço principal de automação
├── 📄 hitss-data-processor.ts     # Processador de dados XLSX
└── 📄 README.md                   # Esta documentação
```

## 🚀 Configuração Inicial

### 1. Credenciais no Supabase Vault

Configure as credenciais da HITSS no Supabase Vault:

```sql
-- Inserir credenciais no Vault
INSERT INTO vault.secrets (name, secret) VALUES 
('hitss_username', 'seu_usuario_hitss'),
('hitss_password', 'sua_senha_hitss'),
('hitss_base_url', 'https://hitss.exemplo.com');
```

### 2. Configurar Cron Job

O cron job já foi configurado na migração para executar diariamente às 08:00:

```sql
-- Configurar execução diária
SELECT cron.schedule(
  'hitss-automation-daily', 
  '0 8 * * *', 
  'SELECT net.http_post(
    url := ''https://seu-projeto.supabase.co/functions/v1/hitss-automation'',
    headers := jsonb_build_object(''Authorization'', ''Bearer '' || current_setting(''app.service_role_key''))
  );'
);
```

### 3. Deploy da Edge Function

```bash
# Deploy da função
supabase functions deploy hitss-automation

# Verificar se está funcionando
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/hitss-automation' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## 📊 Estrutura do Banco de Dados

### Tabela `hitss_data`
Armazena os dados financeiros importados:

```sql
CREATE TABLE hitss_data (
  id UUID PRIMARY KEY,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  categoria VARCHAR(255) NOT NULL,
  tipo VARCHAR(10) CHECK (tipo IN ('debito', 'credito')),
  execution_id UUID,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela `hitss_automation_executions`
Log de execuções da automação:

```sql
CREATE TABLE hitss_automation_executions (
  id UUID PRIMARY KEY,
  execution_id UUID UNIQUE NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  file_downloaded BOOLEAN DEFAULT FALSE,
  records_imported INTEGER DEFAULT 0,
  execution_time INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela `hitss_automation_logs`
Logs detalhados para debugging:

```sql
CREATE TABLE hitss_automation_logs (
  id UUID PRIMARY KEY,
  execution_id UUID,
  level VARCHAR(10) CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Uso da API

### Execução Manual

```bash
# POST para executar manualmente
curl -X POST 'https://seu-projeto.supabase.co/functions/v1/hitss-automation' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Resposta da API

```json
{
  "success": true,
  "timestamp": "2024-12-06T10:30:00.000Z",
  "fileDownloaded": true,
  "fileName": "hitss_data_20241206.xlsx",
  "fileSize": 15420,
  "recordsProcessed": 150,
  "recordsImported": 148,
  "executionTime": 12500,
  "errors": []
}
```

## 📈 Monitoramento

### Verificar Estatísticas

```sql
-- Obter estatísticas gerais
SELECT * FROM get_hitss_automation_stats();

-- Últimas execuções
SELECT 
  execution_id,
  success,
  records_imported,
  execution_time,
  timestamp
FROM hitss_automation_executions 
ORDER BY timestamp DESC 
LIMIT 10;

-- Logs de erro recentes
SELECT 
  message,
  context,
  timestamp
FROM hitss_automation_logs 
WHERE level = 'error' 
ORDER BY timestamp DESC 
LIMIT 20;
```

### Dashboard de Monitoramento

```sql
-- Taxa de sucesso dos últimos 30 dias
SELECT 
  DATE(timestamp) as data,
  COUNT(*) as total_execucoes,
  COUNT(*) FILTER (WHERE success = true) as sucessos,
  ROUND(COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*), 2) as taxa_sucesso
FROM hitss_automation_executions 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY data DESC;
```

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Erro de Login
```
❌ Falha no login - credenciais inválidas
```
**Solução**: Verificar credenciais no Supabase Vault

```sql
-- Verificar se credenciais existem
SELECT name FROM vault.secrets WHERE name LIKE 'hitss_%';

-- Atualizar credenciais se necessário
UPDATE vault.secrets SET secret = 'nova_senha' WHERE name = 'hitss_password';
```

#### 2. Timeout na Automação
```
❌ Erro na automação HITSS: Timeout
```
**Solução**: Aumentar timeout na configuração

#### 3. Arquivo não Encontrado
```
❌ Arquivo XLSX não encontrado
```
**Solução**: Verificar seletores CSS na função `downloadFile()`

### Logs de Debug

```sql
-- Habilitar logs de debug (temporariamente)
-- Modificar nível de log no código se necessário

-- Verificar logs de uma execução específica
SELECT 
  level,
  message,
  context,
  timestamp
FROM hitss_automation_logs 
WHERE execution_id = 'UUID_DA_EXECUCAO'
ORDER BY timestamp;
```

## 🔒 Segurança

### Credenciais
- ✅ Credenciais armazenadas no Supabase Vault
- ✅ Não expostas em logs ou código
- ✅ Acesso via service_role apenas

### Permissões
- ✅ RLS habilitado em todas as tabelas
- ✅ Políticas específicas por role
- ✅ Logs de auditoria completos

### Rate Limiting
- ✅ Execução limitada a 1x por dia via cron
- ✅ Timeout configurado para evitar execuções longas
- ✅ Cleanup automático de logs antigos

## 📅 Manutenção

### Limpeza Automática
O sistema inclui limpeza automática de logs:

```sql
-- Job de limpeza (já configurado)
SELECT cron.schedule(
  'hitss-logs-cleanup', 
  '0 2 * * 0',  -- Domingos às 02:00
  'SELECT cleanup_old_hitss_logs();'
);
```

### Backup de Dados
```sql
-- Backup dos dados importantes
COPY hitss_data TO '/backup/hitss_data_backup.csv' WITH CSV HEADER;
```

## 🚀 Próximos Passos

1. **Configurar Alertas**: Implementar notificações para falhas
2. **Dashboard Web**: Criar interface para monitoramento
3. **Múltiplos Arquivos**: Suporte a download de vários arquivos
4. **Validações Avançadas**: Regras de negócio específicas
5. **Integração com BI**: Conectar com ferramentas de análise

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs no Supabase Dashboard
2. Consultar tabela `hitss_automation_logs`
3. Executar função `get_hitss_automation_stats()`
4. Revisar configurações do Vault

---

**Desenvolvido com ❤️ usando Supabase Edge Functions + Deno + Puppeteer**