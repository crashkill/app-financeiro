#!/usr/bin/env tsx
/**
 * Script para migrar segredos do Doppler para o Supabase Vault
 * 
 * Uso:
 * 1. Certifique-se de que as variáveis SUPABASE estão configuradas
 * 2. Execute: doppler run -- npx tsx scripts/migrate-secrets.ts
 * 
 * O script irá:
 * - Ler todos os segredos do ambiente Doppler atual
 * - Migrar cada segredo para o Supabase Vault
 * - Gerar relatório de migração
 */

import { DopplerToVaultMigrator, validateVaultConfig } from '../src/utils/supabaseVault';

// Lista de segredos importantes do projeto
const SECRETS_TO_MIGRATE = [
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  
  // Database
  'DATABASE_URL',
  'DIRECT_URL',
  
  // Auth
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  
  // OAuth Providers
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  
  // Email
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM',
  
  // Storage
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  
  // Analytics
  'GOOGLE_ANALYTICS_ID',
  'MIXPANEL_TOKEN',
  
  // Payment
  'STRIPE_PUBLIC_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  
  // External APIs
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'RESEND_API_KEY',
  
  // App Config
  'APP_ENV',
  'APP_URL',
  'API_BASE_URL'
];

async function main() {
  console.log('🚀 Iniciando migração de segredos do Doppler para Supabase Vault\n');
  
  // Validar configuração
  console.log('🔍 Validando configuração do Supabase Vault...');
  if (!validateVaultConfig()) {
    console.error('❌ Configuração do Supabase Vault inválida!');
    console.error('Certifique-se de que as seguintes variáveis estão configuradas:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  console.log('✅ Configuração válida\n');
  
  // Coletar segredos do ambiente atual (Doppler)
  console.log('📋 Coletando segredos do ambiente Doppler...');
  const secretsToMigrate: Record<string, string> = {};
  const missingSecrets: string[] = [];
  
  for (const secretName of SECRETS_TO_MIGRATE) {
    const value = process.env[secretName];
    if (value) {
      secretsToMigrate[secretName] = value;
      console.log(`  ✅ ${secretName}`);
    } else {
      missingSecrets.push(secretName);
      console.log(`  ⚠️  ${secretName} (não encontrado)`);
    }
  }
  
  console.log(`\n📊 Resumo da coleta:`);
  console.log(`  - Segredos encontrados: ${Object.keys(secretsToMigrate).length}`);
  console.log(`  - Segredos ausentes: ${missingSecrets.length}`);
  
  if (missingSecrets.length > 0) {
    console.log(`\n⚠️  Segredos ausentes no Doppler:`);
    missingSecrets.forEach(secret => console.log(`    - ${secret}`));
    console.log('\nContinuando com os segredos disponíveis...\n');
  }
  
  if (Object.keys(secretsToMigrate).length === 0) {
    console.error('❌ Nenhum segredo encontrado para migrar!');
    process.exit(1);
  }
  
  // Executar migração
  console.log('🔄 Iniciando migração para o Supabase Vault...\n');
  
  try {
    const migrator = new DopplerToVaultMigrator();
    await migrator.migrateMultipleSecrets(secretsToMigrate);
    
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Verificar se todos os segredos foram migrados corretamente');
    console.log('2. Atualizar o código para usar o Supabase Vault');
    console.log('3. Testar a aplicação com os novos segredos');
    console.log('4. Considerar remover segredos do Doppler após validação');
    
  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Função para listar segredos atuais no Vault
async function listVaultSecrets() {
  console.log('📋 Listando segredos atuais no Supabase Vault...\n');
  
  try {
    const { vaultManager } = await import('../src/utils/supabaseVault');
    const secrets = await vaultManager.listSecrets();
    
    if (secrets.length === 0) {
      console.log('📭 Nenhum segredo encontrado no Vault.');
    } else {
      console.log(`📊 ${secrets.length} segredos encontrados:`);
      secrets.forEach((secret, index) => {
        console.log(`  ${index + 1}. ${secret.name}`);
        console.log(`     ID: ${secret.id}`);
        console.log(`     Criado: ${new Date(secret.created_at).toLocaleString('pt-BR')}`);
        console.log(`     Atualizado: ${new Date(secret.updated_at).toLocaleString('pt-BR')}`);
        if (secret.description) {
          console.log(`     Descrição: ${secret.description}`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Erro ao listar segredos:', error);
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--list') || args.includes('-l')) {
  listVaultSecrets();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log('🔧 Script de Migração de Segredos - Doppler → Supabase Vault\n');
  console.log('Uso:');
  console.log('  doppler run -- npx tsx scripts/migrate-secrets.ts     # Migrar segredos');
  console.log('  doppler run -- npx tsx scripts/migrate-secrets.ts -l  # Listar segredos do Vault');
  console.log('  npx tsx scripts/migrate-secrets.ts --help             # Mostrar esta ajuda\n');
  console.log('Opções:');
  console.log('  -l, --list    Listar segredos atuais no Supabase Vault');
  console.log('  -h, --help    Mostrar esta mensagem de ajuda\n');
  console.log('Exemplo:');
  console.log('  # Migrar todos os segredos do Doppler para o Vault');
  console.log('  doppler run -- npx tsx scripts/migrate-secrets.ts\n');
} else {
  main().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}