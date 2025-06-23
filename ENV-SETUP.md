# 🔧 Configuração de Variáveis de Ambiente

Para configurar o sistema MCP, você precisa definir as seguintes variáveis de ambiente no Doppler:

## 🚀 Setup Rápido com Doppler

```bash
# 1. Login no Doppler
doppler login

# 2. Configurar projeto
doppler setup --project app-financeiro --config dev

# 3. Configurar variáveis (substitua pelos seus valores reais)
doppler secrets set SUPABASE_ACCESS_TOKEN="seu_token_supabase"
doppler secrets set SMITHERY_API_KEY="sua_chave_smithery"
doppler secrets set MAGIC_21ST_API_KEY="sua_chave_21st"
doppler secrets set AZURE_CLIENT_ID="seu_client_id_azure"
doppler secrets set AZURE_CLIENT_SECRET="seu_client_secret_azure"
doppler secrets set AZURE_TENANT_ID="seu_tenant_id_azure"
doppler secrets set GITHUB_PERSONAL_ACCESS_TOKEN="seu_token_github"
doppler secrets set GITLAB_PERSONAL_ACCESS_TOKEN="seu_token_gitlab"

# 4. Executar setup
npm run doppler:setup
```

## 📋 Variáveis Necessárias

### 🗄️ Supabase
- `SUPABASE_ACCESS_TOKEN` - Token de acesso do Supabase

### 🤖 IA e Automação
- `SMITHERY_API_KEY` - Chave da Smithery
- `MAGIC_21ST_API_KEY` - API Key do 21st Dev

### ☁️ Azure
- `AZURE_CLIENT_ID` - ID do cliente Azure
- `AZURE_CLIENT_SECRET` - Secret do Azure  
- `AZURE_TENANT_ID` - ID do tenant Azure

### 🐙 Git Repositories
- `GITHUB_PERSONAL_ACCESS_TOKEN` - Token do GitHub
- `GITLAB_PERSONAL_ACCESS_TOKEN` - Token do GitLab

### ⚙️ Configurações MCP (Opcionais)
- `MCP_TIMEOUT` - Timeout (padrão: 30000)
- `MCP_RETRIES` - Tentativas (padrão: 3)
- `MCP_DEBUG` - Debug (padrão: false)
- `PLAYWRIGHT_BROWSER` - Browser (padrão: chromium)
- `NODE_ENV` - Ambiente (padrão: development)

## 🔒 Como Obter os Tokens

### Supabase
1. Acesse https://supabase.com/dashboard
2. Vá em Settings > API
3. Copie o "service_role" token

### GitHub
1. Acesse GitHub Settings > Developer settings > Personal access tokens
2. Generate new token com scopes necessários
3. Copie o token gerado

### GitLab
1. Acesse GitLab > User Settings > Access Tokens
2. Crie novo token com scopes necessários
3. Copie o token gerado

### Azure
1. Acesse Azure Portal > App registrations
2. Registre nova aplicação
3. Copie Client ID, Client Secret e Tenant ID

## ⚠️ Importante

- **Nunca** commit tokens no código
- Use Doppler para gerenciar secrets
- Rotacione tokens regularmente
- Use ambientes separados (dev/staging/prod)

## 🆘 Problemas?

```bash
# Verificar status
npm run doppler:status

# Recuperar configuração
npm run doppler:recover

# Testar conexões
npm run mcp:test
``` 