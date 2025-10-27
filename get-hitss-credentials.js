#!/usr/bin/env node

/**
 * Script para obter credenciais do projeto HITSS
 * 
 * Este script ajuda a obter as credenciais necessárias do projeto HITSS
 * para configurar a migração.
 * 
 * Instruções:
 * 1. Acesse https://supabase.com/dashboard/project/pwksgdjjkryqryqrvyja
 * 2. Vá para Settings > API
 * 3. Copie as chaves e execute este script
 */

const readline = require('readline');
const fs = require('fs').promises;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function obterCredenciais() {
  console.log('🔑 Configuração de Credenciais do Projeto HITSS');
  console.log('================================================');
  console.log('');
  console.log('Para obter as credenciais do projeto HITSS:');
  console.log('1. Acesse: https://supabase.com/dashboard/project/pwksgdjjkryqryqrvyja');
  console.log('2. Vá para Settings > API');
  console.log('3. Copie as chaves abaixo:');
  console.log('');

  try {
    const anonKey = await question('Cole a ANON KEY do projeto HITSS: ');
    const serviceKey = await question('Cole a SERVICE ROLE KEY do projeto HITSS: ');

    if (!anonKey || !serviceKey) {
      console.log('❌ Credenciais não fornecidas. Cancelando...');
      rl.close();
      return;
    }

    // Validar formato básico das chaves
    if (!anonKey.startsWith('eyJ') || !serviceKey.startsWith('eyJ')) {
      console.log('⚠️  Formato das chaves parece incorreto. Continuando mesmo assim...');
    }

    console.log('');
    console.log('✅ Credenciais obtidas! Atualizando script de migração...');

    // Ler o arquivo de migração atual
    const migrationFile = './migration-to-hitss.js';
    let content = await fs.readFile(migrationFile, 'utf8');

    // Substituir as chaves placeholder
    content = content.replace(
      'anonKey: \'HITSS_ANON_KEY_AQUI\'',
      `anonKey: '${anonKey}'`
    );
    content = content.replace(
      'serviceKey: \'HITSS_SERVICE_KEY_AQUI\'',
      `serviceKey: '${serviceKey}'`
    );

    // Salvar o arquivo atualizado
    await fs.writeFile(migrationFile, content);

    console.log('✅ Script de migração atualizado com as credenciais HITSS!');
    console.log('');
    console.log('🚀 Agora você pode executar a migração:');
    console.log('   node migration-to-hitss.js');
    console.log('');

    // Criar arquivo de backup das credenciais
    const credentials = {
      projeto: 'HITSS',
      url: 'https://pwksgdjjkryqryqrvyja.supabase.co',
      anonKey: anonKey,
      serviceKey: serviceKey,
      timestamp: new Date().toISOString()
    };

    await fs.writeFile(
      './hitss-credentials.json',
      JSON.stringify(credentials, null, 2)
    );

    console.log('💾 Credenciais salvas em hitss-credentials.json');
    console.log('⚠️  IMPORTANTE: Não commite este arquivo no Git!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    rl.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  obterCredenciais();
}

module.exports = { obterCredenciais }