# 🐳 Guia de Containerização - App Financeiro

Este guia descreve como executar o App Financeiro em containers Docker, tornando-o portável para qualquer ambiente.

## 📋 Pré-requisitos

- Docker Desktop instalado (Windows/Mac) ou Docker Engine (Linux)
- Docker Compose v2.0+
- Arquivo `.env` configurado com as credenciais do Supabase

## 🚀 Início Rápido

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 2. Construir a Imagem Docker

```bash
docker-compose build
```

Ou com argumentos específicos:

```bash
docker-compose build --build-arg VITE_SUPABASE_URL=https://seu-projeto.supabase.co --build-arg VITE_SUPABASE_ANON_KEY=sua-chave
```

### 3. Executar o Container

```bash
docker-compose up -d
```

A aplicação estará disponível em: **http://localhost:3000**

### 4. Verificar Status

```bash
# Ver logs
docker-compose logs -f

# Verificar health
docker-compose ps

# Acessar o container
docker-compose exec app-financeiro sh
```

## 🛠️ Comandos Úteis

### Gerenciamento do Container

```bash
# Parar o container
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Reiniciar
docker-compose restart

# Reconstruir sem cache
docker-compose build --no-cache

# Ver uso de recursos
docker stats app-financeiro
```

### Logs e Debug

```bash
# Logs em tempo real
docker-compose logs -f app-financeiro

# Últimas 100 linhas
docker-compose logs --tail=100 app-financeiro

# Inspecionar container
docker inspect app-financeiro
```

## 🏗️ Arquitetura do Container

### Multi-stage Build

O Dockerfile utiliza build multi-estágio para otimizar o tamanho final:

1. **Stage 1 - Builder**: Compila a aplicação React com Vite
2. **Stage 2 - Production**: Serve os arquivos estáticos com Nginx

### Estrutura

```
┌─────────────────────────────────────┐
│  Docker Container (app-financeiro)  │
├─────────────────────────────────────┤
│  Nginx (Alpine)                     │
│  ├─ Porta 80                        │
│  ├─ Healthcheck endpoint            │
│  └─ Arquivos estáticos (/dist)      │
└─────────────────────────────────────┘
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente Suportadas

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Sim |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase | Sim |
| `NODE_ENV` | Ambiente de execução | Não (default: production) |

### Customizar Porta

Edite o `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Mude 3000 para a porta desejada
```

### Healthcheck

O container inclui healthcheck automático:

- **Intervalo**: 30s
- **Timeout**: 10s
- **Retries**: 3
- **Start Period**: 40s

## 🌐 Deploy em Produção

### Docker Hub

```bash
# Tag da imagem
docker tag app-financeiro:latest seu-usuario/app-financeiro:v1.0.0

# Push para Docker Hub
docker push seu-usuario/app-financeiro:v1.0.0
```

### Servidor Linux

```bash
# Copiar arquivos necessários
scp docker-compose.yml .env usuario@servidor:/app/

# No servidor
ssh usuario@servidor
cd /app
docker-compose up -d
```

### Cloud Platforms

#### AWS ECS/Fargate
- Use o Dockerfile para criar task definition
- Configure variáveis de ambiente no ECS

#### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/seu-projeto/app-financeiro
gcloud run deploy --image gcr.io/seu-projeto/app-financeiro --platform managed
```

#### Azure Container Instances
```bash
az container create \
  --resource-group seu-grupo \
  --name app-financeiro \
  --image seu-registro/app-financeiro:latest \
  --dns-name-label app-financeiro \
  --ports 80
```

## 🔒 Segurança

### Boas Práticas Implementadas

✅ Multi-stage build (reduz superfície de ataque)
✅ Imagem Alpine (menor e mais segura)
✅ Non-root user no Nginx
✅ Healthcheck configurado
✅ Secrets via environment variables
✅ .dockerignore otimizado

### Recomendações Adicionais

- Use secrets management (Docker Secrets, Vault, etc.)
- Implemente HTTPS com reverse proxy (Traefik, Nginx Proxy Manager)
- Configure rate limiting
- Monitore logs e métricas

## 📊 Monitoramento

### Prometheus + Grafana

Adicione ao `docker-compose.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Logs Centralizados

Use ELK Stack ou Loki para agregação de logs.

## 🐛 Troubleshooting

### Container não inicia

```bash
# Verificar logs
docker-compose logs app-financeiro

# Verificar configuração
docker-compose config

# Testar build localmente
docker build -t app-financeiro-test .
```

### Problemas de Rede

```bash
# Verificar networks
docker network ls
docker network inspect app-financeiro_app-network

# Recriar network
docker-compose down
docker network prune
docker-compose up -d
```

### Healthcheck Falhando

```bash
# Testar manualmente
docker-compose exec app-financeiro curl -f http://localhost:80/health

# Verificar Nginx
docker-compose exec app-financeiro nginx -t
```

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

## 🤝 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker-compose logs -f`
2. Consulte este guia
3. Abra uma issue no repositório

---

**Versão**: 1.0.0  
**Última Atualização**: 2025-11-28
