#!/bin/bash

# Script para corrigir problemas de segredos do Docker MCP Gateway
# Resolve o erro: "Error: open /.s0: file does not exist"

echo "🔧 Corrigindo configuração do Docker MCP Gateway..."

# 1. Limpar segredos duplicados
echo "🧹 Removendo segredos duplicados..."
docker mcp secret rm github.personal_access_token 2>/dev/null || true
docker mcp secret rm gitlab.personal_access_token 2>/dev/null || true
docker mcp secret rm notion.internal_integration_token 2>/dev/null || true

# 2. Verificar se Doppler está configurado
if ! doppler me &> /dev/null; then
    echo "❌ Doppler não está configurado. Execute: doppler login"
    exit 1
fi

# 3. Configurar projeto Doppler se necessário
echo "📦 Configurando Doppler..."
doppler setup --project app-financeiro --config dev --no-interactive

# 4. Sincronizar segredos do Doppler para Docker MCP
echo "🔐 Sincronizando segredos..."

# GitHub Token
if doppler secrets get GITHUB_PERSONAL_ACCESS_TOKEN &> /dev/null; then
    echo "  ✅ Configurando GitHub token..."
    doppler run -- bash -c 'docker mcp secret set github.personal_access_token="$GITHUB_PERSONAL_ACCESS_TOKEN"'
else
    echo "  ⚠️  GitHub token não encontrado no Doppler"
fi

# GitLab Token
if doppler secrets get GITLAB_PERSONAL_ACCESS_TOKEN &> /dev/null; then
    echo "  ✅ Configurando GitLab token..."
    doppler run -- bash -c 'docker mcp secret set gitlab.personal_access_token="$GITLAB_PERSONAL_ACCESS_TOKEN"'
else
    echo "  ⚠️  GitLab token não encontrado no Doppler"
fi

# Notion Token
if doppler secrets get NOTION_INTERNAL_INTEGRATION_TOKEN &> /dev/null; then
    echo "  ✅ Configurando Notion token..."
    doppler run -- bash -c 'docker mcp secret set notion.internal_integration_token="$NOTION_INTERNAL_INTEGRATION_TOKEN"'
else
    echo "  ⚠️  Notion token não encontrado no Doppler"
fi

# 5. Verificar configuração
echo "🔍 Verificando segredos configurados..."
docker mcp secret ls

# 6. Testar gateway
echo "🧪 Testando Docker MCP Gateway..."
if timeout 3 docker mcp gateway run --help &> /dev/null; then
    echo "✅ Docker MCP Gateway está funcionando!"
else
    echo "❌ Ainda há problemas com o Docker MCP Gateway"
    echo "💡 Tente reiniciar o Docker Desktop e executar novamente"
fi

echo "🎉 Configuração concluída!"
echo "📋 Para usar: docker mcp gateway run"