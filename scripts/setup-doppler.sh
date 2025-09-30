#!/bin/bash

# Script para configurar Doppler com MCP
# Autor: Assistente de Vibe Coding

echo "🚀 Configurando Doppler para MCP..."

# Verificar se Doppler CLI está instalado
if ! command -v doppler &> /dev/null; then
    echo "❌ Doppler CLI não encontrado. Instalando..."
    
    # Instalar Doppler CLI (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install dopplerhq/cli/doppler
    else
        # Linux
        curl -Ls https://cli.doppler.com/install.sh | sh
    fi
fi

# Login no Doppler (se necessário)
echo "🔐 Fazendo login no Doppler..."
doppler login

# Configurar projeto e ambiente
echo "📦 Configurando projeto Doppler..."
doppler setup --project app-financeiro --config dev

# Definir variáveis do MCP
echo "⚙️ Configurando variáveis do MCP..."

# Supabase
echo "Digite seu SUPABASE_ACCESS_TOKEN:"
read -s SUPABASE_ACCESS_TOKEN
doppler secrets set SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN"

echo "Digite seu SUPABASE_PROJECT_ID:"
read SUPABASE_PROJECT_ID
doppler secrets set SUPABASE_PROJECT_ID="$SUPABASE_PROJECT_ID"

# Outras configurações
doppler secrets set NODE_ENV="development"
doppler secrets set MCP_DEBUG="false"
doppler secrets set MCP_TIMEOUT="30000"

echo "✅ Configuração do Doppler concluída!"
echo "💡 Para usar: doppler run -- npm start" 