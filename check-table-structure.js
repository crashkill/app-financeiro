#!/usr/bin/env node

/**
 * Script para Verificar Estrutura das Tabelas
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS');
console.log('=' .repeat(50));

async function checkTableStructure() {
  try {
    // Verificar dados_dre
    console.log('\n📊 Tabela: dados_dre');
    const { data: dreData, error: dreError } = await supabase
      .from('dados_dre')
      .select('*')
      .limit(1);
    
    if (dreError) {
      console.log(`❌ Erro: ${dreError.message}`);
    } else {
      if (dreData && dreData.length > 0) {
        console.log('✅ Colunas encontradas:', Object.keys(dreData[0]));
      } else {
        console.log('⚠️  Tabela vazia - verificando esquema...');
        
        // Tentar inserir um registro mínimo para descobrir a estrutura
        const testInsert = await supabase
          .from('dados_dre')
          .insert({})
          .select();
        
        if (testInsert.error) {
          console.log('💡 Estrutura inferida do erro:', testInsert.error.message);
        }
      }
    }
    
    // Verificar automation_executions
    console.log('\n📊 Tabela: automation_executions');
    const { data: autoData, error: autoError } = await supabase
      .from('automation_executions')
      .select('*')
      .limit(1);
    
    if (autoError) {
      console.log(`❌ Erro: ${autoError.message}`);
    } else {
      if (autoData && autoData.length > 0) {
        console.log('✅ Colunas encontradas:', Object.keys(autoData[0]));
        console.log('📋 Exemplo de registro:', autoData[0]);
      } else {
        console.log('⚠️  Tabela vazia');
      }
    }
    
    // Verificar hitss_automation_logs
    console.log('\n📊 Tabela: hitss_automation_logs');
    const { data: logsData, error: logsError } = await supabase
      .from('hitss_automation_logs')
      .select('*')
      .limit(1);
    
    if (logsError) {
      console.log(`❌ Erro: ${logsError.message}`);
    } else {
      if (logsData && logsData.length > 0) {
        console.log('✅ Colunas encontradas:', Object.keys(logsData[0]));
        console.log('📋 Exemplo de registro:', logsData[0]);
      } else {
        console.log('⚠️  Tabela vazia');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
  }
}

// Executar verificação
checkTableStructure();