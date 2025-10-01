# 🔐 Configuração Doppler + MCP

Guia para migrar suas configurações MCP para o Doppler de forma segura.

## ⚠️ **IMPORTANTE: Segurança**
O arquivo MCP anterior continha **tokens e chaves de API expostas**. Agora tudo será gerenciado pelo Doppler de forma segura!

## 🚀 Passos para Configuração

### 1. Instalar Doppler CLI

**macOS:**
```bash
brew install dopplerhq/cli/doppler
```

**Linux:**
```bash
curl -Ls https://cli.doppler.com/install.sh | sh
```

### 2. Fazer Login no Doppler

```bash
doppler login
```

### 3. Configurar o Projeto

```bash
# Criar/configurar projeto
doppler setup --project app-financeiro --config dev

# Ou se o projeto já existir
doppler projects create app-financeiro
doppler configs create dev --project app-financeiro
```

### 4. Migrar Variáveis Automaticamente

```bash
# Usar o script que criamos
npm run doppler:setup

# Ou executar diretamente
node doppler-mcp-setup.js
```

### 5. Verificar Configuração

```bash
# Ver todas as variáveis
doppler secrets

# Testar MCP
npm run mcp:test
```

## 🎯 **Variáveis Migradas**

✅ **SUPABASE_ACCESS_TOKEN** - Token do Supabase
✅ **SMITHERY_API_KEY** - Chave da Smithery
✅ **MAGIC_21ST_API_KEY** - API Key do 21st Dev
✅ **AZURE_CLIENT_ID** - ID do cliente Azure
✅ **AZURE_CLIENT_SECRET** - Secret do Azure
✅ **AZURE_TENANT_ID** - ID do tenant Azure
✅ **GITHUB_PERSONAL_ACCESS_TOKEN** - Token do GitHub
✅ **GITLAB_PERSONAL_ACCESS_TOKEN** - Token do GitLab

## 🚀 **Uso no Desenvolvimento**

```bash
# Executar com Doppler
npm run doppler:dev          # Desenvolvimento
npm run doppler:start        # Produção
npm run doppler:build        # Build

# Ou comando direto
doppler run -- npm start
doppler run -- your-command
```

## 📁 **Arquivos Importantes**

- `mcp.json` → Agora usa variáveis de ambiente `${NOME_VARIAVEL}`
- `doppler-mcp-setup.js` → Script de configuração automática
- `~/.cursor/mcp.json` → **REMOVER** (contém dados sensíveis)

## 🔒 **Benefícios de Segurança**

✅ **Tokens não expostos** no código
✅ **Controle de acesso** por equipe
✅ **Auditoria** de quem acessa o quê
✅ **Rotação** fácil de chaves
✅ **Ambientes separados** (dev, prod, staging)

## 🔄 **Rotacionar Tokens**

```bash
# Atualizar um token
doppler secrets set SUPABASE_ACCESS_TOKEN="novo-token"

# Verificar mudança
doppler secrets get SUPABASE_ACCESS_TOKEN
```

## 🤝 **Equipe**

Para adicionar membros da equipe:
```bash
doppler team add usuario@email.com --role developer
```

## 🐛 **Troubleshooting**

**Erro: "Command not found: doppler"**
- Reinstalar Doppler CLI

**Erro: "Project not found"**
```bash
doppler projects create app-financeiro
```

**Erro: "Access denied"**
```bash
doppler login
doppler setup --project app-financeiro --config dev
```

---

**🎉 Pronto! Agora seu MCP está seguro com Doppler!** 