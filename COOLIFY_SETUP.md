# Configuração do Coolify - App Financeiro

## 📋 Resumo da Configuração

A aplicação **App Financeiro** foi configurada com sucesso no Coolify para deploy automatizado via Docker.

## 🏗️ Estrutura Criada

### Projeto
- **Nome**: App Financeiro
- **UUID**: `to8k0o4kccg8w4ssogk04800`
- **Descrição**: Projeto para aplicacao financeira React com Supabase

### Aplicação
- **Nome**: app-financeiro
- **UUID**: `awokww0kg0ogsgkgggsgws8w`
- **Repositório**: `https://github.com/fabriciolimadev/app-financeiro.git`
- **Branch**: `main`
- **Build Pack**: Dockerfile
- **Porta Exposta**: 80

## 🔧 Variáveis de Ambiente Configuradas

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Chave anônima do Supabase |
| `RESEND_API_KEY` | `your-resend-api-key` | Chave da API Resend para emails |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Chave de service role do Supabase |
| `VITE_APP_NAME` | `App Financeiro` | Nome da aplicação |
| `VITE_APP_VERSION` | `1.0.0` | Versão da aplicação |
| `VITE_APP_ENVIRONMENT` | `production` | Ambiente de execução |
| `VITE_DEBUG` | `false` | Flag de debug |
| `VITE_LOG_LEVEL` | `info` | Nível de log |

## 🐳 Configuração Docker

### Dockerfile
- **Multi-stage build** com Node.js 18 Alpine para build e Nginx Alpine para produção
- **Nginx customizado** com configurações otimizadas para SPA React
- **Variáveis de ambiente** injetadas durante o build
- **Porta 80** exposta para o Nginx

### Arquivos Criados
- `Dockerfile` - Configuração de containerização
- `nginx.conf` - Configuração customizada do Nginx
- `.dockerignore` - Otimização do contexto de build

## 🚀 Status Atual

### Deploy
- **Status**: Em progresso (in_progress)
- **Último Deploy**: `dg0swggw04008oc048gwws0k`
- **Commit**: HEAD (main branch)

### Aplicação
- **Status**: exited:unhealthy
- **Servidor**: localhost (host.docker.internal)
- **Rede**: coolify

## 📝 Próximos Passos

### 1. Configurar Variáveis de Ambiente Reais
Substitua os valores placeholder pelas credenciais reais:

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-real
VITE_SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-real

# Resend (se usado)
RESEND_API_KEY=sua-chave-resend-real
```

### 2. Configurar Domínio (Opcional)
- Adicionar FQDN personalizado na configuração da aplicação
- Configurar SSL/TLS automático via Traefik

### 3. Monitoramento
- Habilitar health checks
- Configurar logs centralizados
- Monitorar métricas de performance

### 4. CI/CD
- Configurar webhooks do GitHub para deploy automático
- Implementar testes automatizados antes do deploy
- Configurar ambientes de staging/production

## 🔍 Comandos Úteis

### Verificar Status
```bash
# Via MCP Coolify
mcp_coolify-mcp_applications get <app-uuid>
mcp_coolify-mcp_deployments get <deploy-uuid>
```

### Logs de Deploy
```bash
# Acessar logs via interface do Coolify
# URL: /project/to8k0o4kccg8w4ssogk04800/environment/ascc8s8kg80k4ggks040880s/application/awokww0kg0ogsgkgggsgws8w
```

## 🛡️ Segurança

- ✅ Variáveis de ambiente protegidas
- ✅ Dockerfile otimizado com multi-stage
- ✅ Nginx com configurações de segurança
- ✅ Rede isolada do Coolify
- ⚠️ **Pendente**: Configurar credenciais reais do Supabase

## 📚 Documentação de Referência

- [Coolify Documentation](https://coolify.io/docs)
- [Docker Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/)
- [Nginx SPA Configuration](https://nginx.org/en/docs/)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/environment-variables)