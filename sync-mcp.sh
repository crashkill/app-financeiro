#!/bin/bash

# Script de Sincronização MCP
# Executar em qualquer sistema para sincronizar com Doppler

echo "🔄 Sincronizando MCP com Doppler..."

# Verificar se Doppler está instalado
if ! command -v doppler &> /dev/null; then
    echo "❌ Doppler CLI não encontrado"
    echo "📦 Instalar:"
    echo "   macOS: brew install dopplerhq/cli/doppler"
    echo "   Linux: curl -Ls https://cli.doppler.com/install.sh | sh"
    exit 1
fi

# Login se necessário
if ! doppler me &> /dev/null; then
    echo "🔐 Execute: doppler login"
    exit 1
fi

# Configurar projeto
echo "📦 Configurando projeto..."
doppler setup --project app-financeiro --config dev --no-interactive

# Gerar mcp.json
echo "📋 Gerando mcp.json..."
doppler run -- node sync-mcp-config.js

echo "✅ Sincronização concluída!"
