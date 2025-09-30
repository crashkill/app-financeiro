/**
 * Script para adicionar as credenciais do Supabase no Vault
 * Execute este script no backend para configurar os segredos de forma segura
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração direta do Supabase
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

// Cliente Supabase com service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Credenciais fornecidas pelo usuário
const SUPABASE_CREDENTIALS = {
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E',
  SUPABASE_PROJECT_ID: 'oomhhhfahdvavnhlbioa',
  SUPABASE_URL: 'https://oomhhhfahdvavnhlbioa.supabase.co',
  NEXT_PUBLIC_SUPABASE_URL: 'https://oomhhhfahdvavnhlbioa.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8'
};

async function addSupabaseCredentialsToVault() {
  console.log('🔐 Iniciando configuração das credenciais do Supabase no Vault...');
  
  try {
    console.log('✅ Cliente Supabase configurado');
    
    // Adicionar cada credencial ao Vault
    const results = [];
    
    for (const [key, value] of Object.entries(SUPABASE_CREDENTIALS)) {
      try {
        console.log(`📝 Adicionando ${key} ao Vault...`);
        
        // Verificar se já existe
        const { data: existing, error: getError } = await supabase.rpc('get_secret', {
          secret_name: key
        });
        
        if (existing) {
          console.log(`🔄 ${key} já existe. Atualizando...`);
          const { error: updateError } = await supabase.rpc('update_secret', {
            secret_name: key,
            new_secret_value: value
          });
          
          if (updateError) {
            throw new Error(`Erro ao atualizar: ${updateError.message}`);
          }
        } else {
          console.log(`➕ Criando novo segredo: ${key}`);
          const { error: insertError } = await supabase.rpc('insert_secret', {
            secret_name: key,
            secret_value: value
          });
          
          if (insertError) {
            throw new Error(`Erro ao inserir: ${insertError.message}`);
          }
        }
        
        results.push({ key, status: 'success' });
        console.log(`✅ ${key} configurado com sucesso`);
        
      } catch (error) {
        console.error(`❌ Erro ao configurar ${key}:`, error);
        results.push({ key, status: 'error', error: error.message });
      }
    }
    
    // Relatório final
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    console.log('\n📊 Relatório de Configuração:');
    console.log(`✅ Sucessos: ${successful}`);
    console.log(`❌ Falhas: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Credenciais com falha:');
      results
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`  - ${r.key}: ${r.error}`));
    }
    
    if (successful === Object.keys(SUPABASE_CREDENTIALS).length) {
      console.log('\n🎉 Todas as credenciais do Supabase foram configuradas no Vault com sucesso!');
      console.log('\n📋 Próximos passos:');
      console.log('1. Verificar se as Edge Functions estão funcionando');
      console.log('2. Testar a conectividade com o Supabase');
      console.log('3. Validar se a automação HITSS está operacional');
    } else {
      console.log('\n⚠️  Algumas credenciais falharam. Verifique os erros acima.');
    }
    
  } catch (error) {
    console.error('💥 Erro fatal ao configurar credenciais:', error);
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  addSupabaseCredentialsToVault()
    .then(() => {
      console.log('\n🏁 Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na execução:', error);
      process.exit(1);
    });
}

export { addSupabaseCredentialsToVault };