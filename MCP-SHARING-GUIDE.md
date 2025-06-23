# 🔄 Guia Completo: Compartilhamento de Configurações MCP

Este guia mostra **5 formas seguras** de compartilhar suas configurações MCP entre diferentes sistemas, equipes e ambientes.

## 🎯 **Problema Resolvido**

❌ **ANTES:** Tokens expostos no código, arquivo corrompido  
✅ **AGORA:** Configurações seguras e sincronizadas via Doppler

## 🚀 **Métodos de Compartilhamento**

### 1. 🔐 **Via Doppler (Recomendado)**

**✅ Mais Seguro | ✅ Mais Fácil | ✅ Suporte a Equipes**

```bash
# Novo desenvolvedor no time
doppler login
doppler setup --project app-financeiro --config dev
npm run mcp:sync:cursor

# Pronto! MCP configurado automaticamente
```

**Vantagens:**
- 🔒 Tokens nunca expostos
- 👥 Controle de acesso por usuário
- 🌍 Disponível em qualquer lugar
- 📊 Auditoria completa
- 🔄 Sincronização automática

### 2. 🐳 **Via Docker Compose**

**Para ambientes containerizados:**

```bash
# Usar o docker-compose.yml gerado
docker-compose up app-financeiro

# Doppler injeta as variáveis automaticamente
```

```yaml
services:
  app-financeiro:
    build: .
    environment:
      - DOPPLER_PROJECT=app-financeiro
      - DOPPLER_CONFIG=dev
    command: doppler run -- npm start
```

### 3. 📜 **Via Script de Sincronização**

**Para instalação rápida em novos sistemas:**

```bash
# Executar em qualquer sistema
./sync-mcp.sh

# Ou usando npm
npm run mcp:sync:all
```

O script automaticamente:
- ✅ Verifica se Doppler está instalado
- ✅ Configura o projeto
- ✅ Sincroniza todas as configurações
- ✅ Valida os arquivos JSON

### 4. 🤖 **Via CI/CD (GitHub Actions)**

**Para automação completa:**

```yaml
# .github/workflows/sync-mcp.yml
name: 🔄 Sync MCP Configuration
on:
  push:
    paths: ['mcp.json']
    
jobs:
  sync-mcp:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging, prod]
    steps:
      - uses: actions/checkout@v4
      - name: Sync MCP
        run: npm run mcp:sync:all
```

### 5. 📋 **Via Templates + Variáveis**

**Para configuração manual:**

1. **Template Seguro** (`mcp.template.json`):
```json
{
  "mcpServers": {
    "supabase": {
      "args": ["--access-token", "${SUPABASE_ACCESS_TOKEN}"]
    }
  }
}
```

2. **Arquivo Resolvido** (`mcp.resolved.json`):
```json
{
  "mcpServers": {
    "supabase": {
      "args": ["--access-token", "sbp_actual_token_here"]
    }
  }
}
```

## 🛠️ **Scripts Disponíveis**

| Comando | Descrição |
|---------|-----------|
| `npm run mcp:sync` | Menu interativo de sincronização |
| `npm run mcp:sync:all` | Sincronizar tudo automaticamente |
| `npm run mcp:sync:cursor` | Sincronizar apenas com Cursor |
| `npm run mcp:sync:generate` | Gerar templates |
| `./sync-mcp.sh` | Script standalone para qualquer sistema |

## 🌐 **Cenários de Uso**

### 👨‍💻 **Novo Desenvolvedor**
```bash
# 1. Clone o repositório
git clone <repo>

# 2. Configure Doppler
doppler login
npm run doppler:setup

# 3. Sincronize MCP
npm run mcp:sync:cursor

# ✅ Pronto para desenvolver!
```

### 🖥️ **Novo Servidor/VM**
```bash
# 1. Instalar Doppler
curl -Ls https://cli.doppler.com/install.sh | sh

# 2. Executar script
./sync-mcp.sh

# ✅ Servidor configurado!
```

### 🐳 **Ambiente Docker**
```bash
# 1. Build da imagem
docker build -t app-financeiro .

# 2. Run com Doppler
docker run -e DOPPLER_TOKEN app-financeiro

# ✅ Container funcionando!
```

### ☁️ **Deploy em Cloud**
```bash
# 1. Configure secrets no provedor
# AWS: Systems Manager Parameter Store
# GCP: Secret Manager  
# Azure: Key Vault

# 2. Use variáveis de ambiente
export SUPABASE_ACCESS_TOKEN=$(aws ssm get-parameter...)
node app.js

# ✅ Cloud configurada!
```

## 🔒 **Boas Práticas de Segurança**

### ✅ **Faça:**
- Use Doppler como fonte única da verdade
- Rotacione tokens regularmente
- Use ambientes separados (dev/staging/prod)
- Configure auditoria de acessos
- Valide JSONs antes de usar

### ❌ **Não Faça:**
- Commit tokens no código
- Compartilhe tokens via email/chat
- Use o mesmo token em todos os ambientes
- Deixe tokens em arquivos temporários
- Ignore logs de auditoria

## 🚨 **Recuperação de Emergência**

Se algo der errado:

```bash
# 1. Verificar status
npm run doppler:status

# 2. Recuperação automática
npm run doppler:recover

# 3. Re-sincronizar
npm run mcp:sync:all

# 4. Testar
npm run mcp:test
```

## 📊 **Monitoramento**

### Verificações Regulares:
```bash
# Status geral
npm run doppler:status

# Testar conexões
npm run mcp:test

# Listar variáveis
npm run doppler:secrets

# Ver logs de auditoria
doppler activity
```

## 🤝 **Compartilhamento com Equipe**

### Adicionar Novo Membro:
```bash
# 1. Admin adiciona no Doppler
doppler team add usuario@email.com --role developer

# 2. Novo membro configura
doppler login
doppler setup --project app-financeiro --config dev

# 3. Sincroniza MCP
npm run mcp:sync:cursor
```

### Ambientes por Função:
- **Developers:** `dev` config
- **QA Team:** `staging` config  
- **DevOps:** `prod` config
- **Admin:** Todos os configs

## 📈 **Arquivos Gerados**

| Arquivo | Propósito | Compartilhar? |
|---------|-----------|---------------|
| `mcp.template.json` | Template com variáveis | ✅ Sim |
| `mcp.resolved.json` | Com valores reais | ❌ Não (local) |
| `sync-mcp.sh` | Script de instalação | ✅ Sim |
| `docker-compose.yml` | Container config | ✅ Sim |
| `~/.cursor/mcp.json` | Cursor config | ❌ Não (local) |

## 🎉 **Resultado Final**

✅ **Configurações MCP sincronizadas** em todos os sistemas  
✅ **Tokens seguros** no Doppler  
✅ **Novos devs** configurados em minutos  
✅ **Deploy automatizado** via CI/CD  
✅ **Recuperação automática** de falhas  
✅ **Auditoria completa** de acessos  

---

**🔐 Agora suas configurações MCP são verdadeiramente portáveis e seguras!** 