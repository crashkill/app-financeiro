# 🔐 Configuração do Supabase Vault para Automação HITSS

Este guia explica como configurar as credenciais da HITSS no Supabase Vault para que a automação funcione corretamente.

## 📋 Pré-requisitos

- Acesso ao painel do Supabase
- Credenciais válidas da HITSS (usuário e senha)
- Permissões de administrador no projeto

## 🔧 Configuração das Credenciais

### 1. Acessar o Supabase Vault

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, vá em **Settings** → **Vault**

### 2. Adicionar Credenciais da HITSS

Adicione os seguintes segredos no Vault:

#### 🔑 Credencial: `hitss_username`
```
Nome: hitss_username
Valor: seu_usuario_hitss
Descrição: Usuário para login na plataforma HITSS
```

#### 🔑 Credencial: `hitss_password`
```
Nome: hitss_password
Valor: sua_senha_hitss
Descrição: Senha para login na plataforma HITSS
```

#### 🔑 Credencial: `hitss_base_url`
```
Nome: hitss_base_url
Valor: https://url-da-hitss.com.br
Descrição: URL base da plataforma HITSS
```

### 3. Configurar Variáveis do Projeto

No painel do Supabase, vá em **Settings** → **API** e configure:

#### 📊 Configurações do Projeto
```sql
-- Execute no SQL Editor do Supabase
ALTER DATABASE postgres SET app.project_url = 'https://seu-projeto.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = 'sua_service_role_key';
```

## 🧪 Testando a Configuração

### 1. Verificar Credenciais no Vault

```sql
-- Execute no SQL Editor para verificar se as credenciais estão configuradas
SELECT 
    name,
    description,
    created_at
FROM vault.secrets 
WHERE name IN ('hitss_username', 'hitss_password', 'hitss_base_url');
```

### 2. Testar Acesso às Credenciais

```sql
-- Teste se as credenciais podem ser acessadas (não mostra os valores por segurança)
SELECT 
    vault.decrypted_secrets.name,
    CASE 
        WHEN vault.decrypted_secrets.decrypted_secret IS NOT NULL THEN 'Configurado ✅'
        ELSE 'Não configurado ❌'
    END as status
FROM vault.decrypted_secrets
WHERE vault.decrypted_secrets.name IN ('hitss_username', 'hitss_password', 'hitss_base_url');
```

### 3. Executar Teste Manual da Automação

```sql
-- Teste manual da função de automação
SELECT call_hitss_automation();
```

### 4. Verificar Status do Cron Job

```sql
-- Verificar se o cron job está configurado
SELECT * FROM get_hitss_cron_status();
```

## 🔍 Verificação de Logs

### Consultar Logs de Execução

```sql
-- Ver últimos logs da automação
SELECT 
    execution_id,
    level,
    message,
    context,
    created_at
FROM hitss_automation_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Consultar Execuções

```sql
-- Ver últimas execuções
SELECT 
    id,
    status,
    started_at,
    completed_at,
    records_processed,
    error_message
FROM hitss_automation_executions
ORDER BY started_at DESC
LIMIT 5;
```

## 🚨 Troubleshooting

### Problema: "Credenciais não encontradas"

**Solução:**
1. Verifique se as credenciais estão no Vault com os nomes corretos
2. Confirme que a Edge Function tem permissão para acessar o Vault
3. Verifique se não há espaços extras nos nomes das credenciais

### Problema: "Erro de autenticação na HITSS"

**Solução:**
1. Verifique se as credenciais estão corretas
2. Teste o login manual na plataforma HITSS
3. Verifique se a URL base está correta
4. Confirme se não há mudanças na página de login da HITSS

### Problema: "Cron job não executa"

**Solução:**
1. Verifique se o pg_cron está habilitado
2. Confirme se as variáveis do projeto estão configuradas
3. Verifique os logs do cron job
4. Teste a execução manual da função

## 📝 Comandos Úteis

### Reconfigurar Cron Job

```sql
-- Reconfigurar o cron job
SELECT setup_hitss_cron_job();
```

### Desabilitar Cron Job

```sql
-- Desabilitar temporariamente
SELECT disable_hitss_cron_job();
```

### Limpar Logs Antigos

```sql
-- Executar limpeza manual de logs
SELECT cleanup_old_logs();
```

## 🔒 Segurança

### Boas Práticas

1. **Rotação de Credenciais**: Atualize as credenciais periodicamente
2. **Monitoramento**: Verifique os logs regularmente
3. **Acesso Restrito**: Limite quem tem acesso ao Vault
4. **Backup**: Mantenha backup das configurações importantes

### Permissões Necessárias

- Acesso de leitura ao Vault para a Edge Function
- Permissões de execução para o usuário do cron job
- Acesso às tabelas de dados e logs

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs de execução
2. Teste cada componente individualmente
3. Consulte a documentação do Supabase Vault
4. Verifique se há atualizações na plataforma HITSS

---

**Nota**: Mantenha este documento atualizado conforme mudanças na configuração ou na plataforma HITSS.