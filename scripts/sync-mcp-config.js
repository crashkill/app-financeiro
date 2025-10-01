#!/usr/bin/env node

/**
 * Script para Sincronizar Configurações MCP entre Sistemas
 * Usando Doppler como fonte única da verdade
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Sincronizando configurações MCP...\n');

// Função para executar comandos
function runCommand(command, description) {
  try {
    console.log(`⚙️ ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output: result.trim() };
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 1. Gerar MCP config a partir do Doppler
function generateMCPFromDoppler() {
  console.log('📋 Gerando mcp.json a partir do Doppler...');
  
  const mcpTemplate = {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest", "--headless"]
      },
      "puppeteer": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
      },
      "server-sequential-thinking": {
        "command": "npx",
        "args": [
          "-y", "@smithery/cli@latest", "run",
          "@smithery-ai/server-sequential-thinking",
          "--key", "${SMITHERY_API_KEY}"
        ]
      },
      "MCP-Supabase": {
        "command": "npx",
        "args": [
          "-y", "@supabase/mcp-server-supabase@latest",
          "--access-token", "${SUPABASE_ACCESS_TOKEN}"
        ]
      },
      "browsermcp": {
        "command": "npx",
        "args": ["@browsermcp/mcp@latest"]
      },
      "@21st-dev/magic": {
        "command": "npx",
        "args": [
          "-y", "@21st-dev/magic@latest",
          "API_KEY=\"${MAGIC_21ST_API_KEY}\""
        ]
      },
      "azure-auth": {
        "command": "npx",
        "args": ["-y", "@azure/mcp@latest", "server", "start"],
        "env": {
          "AZURE_CLIENT_ID": "${AZURE_CLIENT_ID}",
          "AZURE_CLIENT_SECRET": "${AZURE_CLIENT_SECRET}",
          "AZURE_TENANT_ID": "${AZURE_TENANT_ID}",
          "AZURE_REGION": "brazilsouth",
          "LOCALE": "pt-BR",
          "TIMEZONE": "America/Sao_Paulo"
        },
        "enabled": true
      },
      "GitHub": {
        "command": "docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server",
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
        }
      },
      "gitlab": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-gitlab"],
        "env": {
          "GITLAB_PERSONAL_ACCESS_TOKEN": "${GITLAB_PERSONAL_ACCESS_TOKEN}"
        }
      }
    }
  };

  // Salvar template
  fs.writeFileSync('mcp.template.json', JSON.stringify(mcpTemplate, null, 2));
  console.log('✅ Template salvo em mcp.template.json');
  
  return mcpTemplate;
}

// 2. Gerar arquivo final com variáveis resolvidas
function generateResolvedMCP() {
  console.log('🔧 Gerando mcp.json com variáveis resolvidas...');
  
  const result = runCommand(
    'doppler run -- node -e "console.log(JSON.stringify(process.env, null, 2))"',
    'Carregando variáveis do Doppler'
  );
  
  if (!result.success) {
    console.log('❌ Erro ao carregar variáveis do Doppler');
    return false;
  }
  
  try {
    const env = JSON.parse(result.output);
    const template = JSON.parse(fs.readFileSync('mcp.template.json', 'utf8'));
    
    // Substituir variáveis
    let resolved = JSON.stringify(template, null, 2);
    
    // Substituir todas as variáveis ${VAR_NAME}
    Object.keys(env).forEach(key => {
      if (key.includes('SUPABASE') || key.includes('AZURE') || 
          key.includes('GITHUB') || key.includes('GITLAB') ||
          key.includes('SMITHERY') || key.includes('MAGIC')) {
        resolved = resolved.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), env[key]);
      }
    });
    
    // Salvar arquivo resolvido
    fs.writeFileSync('mcp.resolved.json', resolved);
    console.log('✅ Arquivo resolvido salvo em mcp.resolved.json');
    
    return true;
  } catch (error) {
    console.log('❌ Erro ao resolver variáveis:', error.message);
    return false;
  }
}

// 3. Sincronizar com Cursor
function syncWithCursor() {
  console.log('🎯 Sincronizando com Cursor...');
  
  const cursorPath = path.join(process.env.HOME, '.cursor', 'mcp.json');
  
  if (fs.existsSync('mcp.resolved.json')) {
    try {
      fs.copyFileSync('mcp.resolved.json', cursorPath);
      console.log('✅ Cursor sincronizado');
      
      // Validar JSON
      const content = fs.readFileSync(cursorPath, 'utf8');
      JSON.parse(content); // Teste de validação
      console.log('✅ JSON válido');
      
    } catch (error) {
      console.log('❌ Erro ao sincronizar Cursor:', error.message);
    }
  }
}

// 4. Gerar script de sincronização para outros sistemas
function generateSyncScript() {
  console.log('📝 Gerando script de sincronização...');
  
  const syncScript = `#!/bin/bash

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
`;

  fs.writeFileSync('sync-mcp.sh', syncScript);
  execSync('chmod +x sync-mcp.sh');
  console.log('✅ Script sync-mcp.sh criado');
}

// 5. Gerar Docker Compose
function generateDockerCompose() {
  console.log('🐳 Gerando Docker Compose...');
  
  const dockerCompose = `version: '3.8'

services:
  app-financeiro:
    build: .
    environment:
      # Doppler injeta as variáveis automaticamente
      - DOPPLER_PROJECT=app-financeiro
      - DOPPLER_CONFIG=dev
    volumes:
      - ./mcp.template.json:/app/mcp.template.json:ro
    command: doppler run -- npm start
    depends_on:
      - doppler-init

  doppler-init:
    image: dopplerhq/cli:latest
    volumes:
      - ~/.doppler:/root/.doppler:ro
      - ./:/app:rw
    working_dir: /app
    command: >
      sh -c "
        doppler setup --project app-financeiro --config dev --no-interactive &&
        doppler run -- node sync-mcp-config.js
      "
`;

  fs.writeFileSync('docker-compose.yml', dockerCompose);
  console.log('✅ Docker Compose criado');
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🎯 Opções disponíveis:');
    console.log('  generate    - Gerar template e arquivo resolvido');
    console.log('  cursor      - Sincronizar com Cursor');
    console.log('  script      - Gerar script de sincronização');
    console.log('  docker      - Gerar Docker Compose');
    console.log('  all         - Executar tudo');
    return;
  }
  
  switch (args[0]) {
    case 'generate':
      generateMCPFromDoppler();
      generateResolvedMCP();
      break;
    case 'cursor':
      syncWithCursor();
      break;
    case 'script':
      generateSyncScript();
      break;
    case 'docker':
      generateDockerCompose();
      break;
    case 'all':
      generateMCPFromDoppler();
      generateResolvedMCP();
      syncWithCursor();
      generateSyncScript();
      generateDockerCompose();
      console.log('\n🎉 Sincronização completa!');
      break;
    default:
      console.log('❌ Comando inválido');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  generateMCPFromDoppler, 
  generateResolvedMCP, 
  syncWithCursor,
  generateSyncScript,
  generateDockerCompose 
}; 