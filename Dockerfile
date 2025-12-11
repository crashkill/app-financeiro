# Multi-stage build para otimizar o tamanho da imagem final

# Estágio 1: Build da aplicação
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (inclui devDependencies para build)
RUN npm ci --silent

# Copiar código fonte
COPY . .

# Variáveis de ambiente de build (injetadas pelo Coolify como build args)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Gerar build de produção
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:alpine AS production

# Remover configuração padrão e usar a customizada
# Usar configuração principal customizada
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar arquivos gerados do build
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck simples
RUN apk add --no-cache curl \
 && echo '#!/bin/sh\ncurl -f http://localhost:80/health || exit 1' > /usr/local/bin/healthcheck.sh \
 && chmod +x /usr/local/bin/healthcheck.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]