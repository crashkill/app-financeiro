#!/usr/bin/env node

/**
 * Script para configurar Doppler com MCP
 * App Financeiro - Gestão de Variáveis de Ambiente
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Configurando Doppler para MCP...\n');

// Função para executar comandos
function runCommand(command, description) {
  try {
    console.log(`⚙️ ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Erro ao ${description.toLowerCase()}: ${error.message}`);
    return false;
  }
}

// Verificar se Doppler está instalado
function checkDopplerInstallation() {
  try {
    execSync('doppler --version', { encoding: 'utf8' });
    console.log('✅ Doppler CLI encontrado');
    return true;
  } catch {
    console.log('❌ Doppler CLI não encontrado');
    console.log('📦 Para instalar:');
    console.log('   macOS: brew install dopplerhq/cli/doppler');
    console.log('   Linux: curl -Ls https://cli.doppler.com/install.sh | sh');
    return false;
  }
}

// Configurar variáveis do MCP
function setupMCPVariables() {
  const mcpVariables = {
    // Supabase
    'SUPABASE_ACCESS_TOKEN': process.env.SUPABASE_ACCESS_TOKEN || 'CONFIGURE_NO_DOPPLER',
    
    // Smithery
    'SMITHERY_API_KEY': process.env.SMITHERY_API_KEY || 'CONFIGURE_NO_DOPPLER',
    
    // 21st Dev Magic
    'MAGIC_21ST_API_KEY': process.env.MAGIC_21ST_API_KEY || 'CONFIGURE_NO_DOPPLER',
    
    // Azure
    'AZURE_CLIENT_ID': process.env.AZURE_CLIENT_ID || 'CONFIGURE_NO_DOPPLER',
    'AZURE_CLIENT_SECRET': process.env.AZURE_CLIENT_SECRET || 'CONFIGURE_NO_DOPPLER',
    'AZURE_TENANT_ID': process.env.AZURE_TENANT_ID || 'CONFIGURE_NO_DOPPLER',
    
    // GitHub
    'GITHUB_PERSONAL_ACCESS_TOKEN': process.env.GITHUB_PERSONAL_ACCESS_TOKEN || 'CONFIGURE_NO_DOPPLER',
    
    // GitLab
    'GITLAB_PERSONAL_ACCESS_TOKEN': process.env.GITLAB_PERSONAL_ACCESS_TOKEN || 'CONFIGURE_NO_DOPPLER',
    
    // Configurações MCP
    'MCP_TIMEOUT': '30000',
    'MCP_RETRIES': '3',
    'MCP_DEBUG': 'false',
    'PLAYWRIGHT_BROWSER': 'chromium',
    
    // Ambiente
    'NODE_ENV': 'development'
  };

  console.log('\n🔧 Configurando variáveis do MCP no Doppler...');
  
  for (const [key, value] of Object.entries(mcpVariables)) {
    // Configurar todas as variáveis automaticamente
    const command = `doppler secrets set ${key}="${value}"`;
    if (runCommand(command, `Configurando ${key}`)) {
      console.log(`✅ ${key} configurado com sucesso`);
    }
  }
}

// Função principal
async function main() {
  if (!checkDopplerInstallation()) {
    process.exit(1);
  }

  console.log('\n🔐 Configurando projeto automaticamente...');
  
  // Verificar se já está logado
  try {
    execSync('doppler me', { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Usuário já logado no Doppler');
  } catch {
    console.log('❌ Precisa fazer login no Doppler primeiro:');
    console.log('   doppler login');
    console.log('\nApós fazer login, execute novamente o script.');
    process.exit(1);
  }

  // Criar projeto se não existir
  console.log('📦 Configurando projeto...');
  try {
    runCommand('doppler projects create app-financeiro 2>/dev/null || true', 'Criando projeto');
    runCommand('doppler configs create dev --project app-financeiro 2>/dev/null || true', 'Criando config dev');
    runCommand('doppler setup --project app-financeiro --config dev --no-interactive', 'Configurando projeto local');
    console.log('✅ Projeto configurado com sucesso');
  } catch (error) {
    console.log('⚠️ Projeto pode já existir, continuando...');
  }

  setupMCPVariables();

  console.log('\n✅ Configuração concluída!');
  console.log('\n💡 Para usar o MCP com Doppler:');
  console.log('   doppler run -- node seu-script.js');
  console.log('   doppler run -- npm start');
  console.log('\n📋 Para ver todas as variáveis:');
  console.log('   doppler secrets');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupMCPVariables, checkDopplerInstallation }; 