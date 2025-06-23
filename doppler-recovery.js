#!/usr/bin/env node

/**
 * Script de Recuperação e Verificação - Doppler + MCP
 * App Financeiro - Diagnóstico e Recuperação
 */

const { execSync } = require('child_process');

console.log('🔍 Verificando configuração Doppler + MCP...\n');

// Função para executar comandos silenciosamente
function runQuiet(command) {
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Função para verificar status
function checkStatus() {
  console.log('📊 Status do Sistema:\n');
  
  // 1. Verificar Doppler CLI
  const dopplerVersion = runQuiet('doppler --version');
  if (dopplerVersion.success) {
    console.log(`✅ Doppler CLI: ${dopplerVersion.output}`);
  } else {
    console.log('❌ Doppler CLI: Não instalado');
    return false;
  }

  // 2. Verificar login
  const dopplerMe = runQuiet('doppler me');
  if (dopplerMe.success) {
    console.log(`✅ Login: Conectado como ${dopplerMe.output}`);
  } else {
    console.log('❌ Login: Não logado');
    console.log('💡 Execute: doppler login');
    return false;
  }

  // 3. Verificar projeto
  const dopplerProjects = runQuiet('doppler projects');
  if (dopplerProjects.success && dopplerProjects.output.includes('app-financeiro')) {
    console.log('✅ Projeto: app-financeiro encontrado');
  } else {
    console.log('❌ Projeto: app-financeiro não encontrado');
  }

  // 4. Verificar configuração local
  const dopplerSetup = runQuiet('doppler configure get');
  if (dopplerSetup.success) {
    console.log('✅ Configuração local: OK');
  } else {
    console.log('❌ Configuração local: Não configurado');
  }

  // 5. Listar secrets
  const secrets = runQuiet('doppler secrets --only-names');
  if (secrets.success) {
    const secretList = secrets.output.split('\n').filter(s => s.trim());
    console.log(`✅ Secrets: ${secretList.length} variáveis configuradas`);
    console.log(`   ${secretList.join(', ')}`);
  } else {
    console.log('❌ Secrets: Erro ao listar');
  }

  return true;
}

// Função de recuperação automática
function autoRecover() {
  console.log('\n🔧 Iniciando recuperação automática...\n');
  
  // Tentar criar projeto
  console.log('1. Criando projeto...');
  const createProject = runQuiet('doppler projects create app-financeiro');
  if (createProject.success) {
    console.log('✅ Projeto criado');
  } else {
    console.log('⚠️ Projeto já existe ou erro');
  }

  // Tentar criar config
  console.log('2. Criando configuração dev...');
  const createConfig = runQuiet('doppler configs create dev --project app-financeiro');
  if (createConfig.success) {
    console.log('✅ Config dev criada');
  } else {
    console.log('⚠️ Config já existe ou erro');
  }

  // Configurar localmente
  console.log('3. Configurando localmente...');
  const setup = runQuiet('doppler setup --project app-financeiro --config dev --no-interactive');
  if (setup.success) {
    console.log('✅ Configuração local OK');
  } else {
    console.log('❌ Erro na configuração local');
  }

  // Verificar se precisa das variáveis
  const checkVars = runQuiet('doppler secrets --only-names');
  if (checkVars.success) {
    const vars = checkVars.output.split('\n').filter(s => s.trim());
    if (vars.length === 0) {
      console.log('4. Executando configuração das variáveis...');
      try {
        execSync('node doppler-mcp-setup.js', { stdio: 'inherit' });
      } catch (error) {
        console.log('❌ Erro ao configurar variáveis');
      }
    } else {
      console.log('✅ Variáveis já configuradas');
    }
  }
}

// Função para testar MCP
function testMCP() {
  console.log('\n🧪 Testando MCP com Doppler...\n');
  
  const testCommand = 'doppler run -- node -e "console.log(\'🎯 Variáveis MCP encontradas:\'); Object.keys(process.env).filter(k => k.includes(\'SUPABASE\') || k.includes(\'AZURE\') || k.includes(\'GITHUB\') || k.includes(\'MCP\')).forEach(k => console.log(\`✅ \${k}: \${process.env[k] ? \'[DEFINIDA]\' : \'[VAZIA]\'}\`));"';
  
  const result = runQuiet(testCommand);
  if (result.success) {
    console.log(result.output);
  } else {
    console.log('❌ Erro ao testar MCP:', result.error);
  }
}

// Menu interativo
function showMenu() {
  console.log('\n🎯 Opções disponíveis:');
  console.log('1. Verificar status');
  console.log('2. Recuperação automática');
  console.log('3. Testar MCP');
  console.log('4. Mostrar todas as variáveis');
  console.log('5. Sair');
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Modo interativo
    checkStatus();
    console.log('\n💡 Execute com parâmetros para ações específicas:');
    console.log('   node doppler-recovery.js status');
    console.log('   node doppler-recovery.js recover');
    console.log('   node doppler-recovery.js test');
    console.log('   node doppler-recovery.js secrets');
  } else {
    // Modo de comando
    switch (args[0]) {
      case 'status':
        checkStatus();
        break;
      case 'recover':
        autoRecover();
        break;
      case 'test':
        testMCP();
        break;
      case 'secrets':
        const secrets = runQuiet('doppler secrets');
        if (secrets.success) {
          console.log('🔐 Secrets configuradas:\n');
          console.log(secrets.output);
        } else {
          console.log('❌ Erro ao listar secrets');
        }
        break;
      default:
        console.log('❌ Comando inválido. Use: status, recover, test, secrets');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkStatus, autoRecover, testMCP }; 