import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testSupabaseConnection() {
  log('🔍 TESTANDO CONECTIVIDADE COM SUPABASE', 'bold');
  log('='.repeat(50));
  
  // Verificar variáveis de ambiente
  log('\n1. Verificando configurações...');
  
  if (!supabaseUrl) {
    logError('VITE_SUPABASE_URL não encontrada');
    return false;
  }
  
  if (!supabaseKey) {
    logError('VITE_SUPABASE_ANON_KEY não encontrada');
    return false;
  }
  
  logSuccess('Variáveis de ambiente carregadas');
  logInfo(`URL: ${supabaseUrl}`);
  logInfo(`Anon Key: ${supabaseKey.substring(0, 20)}...`);
  
  // Criar cliente Supabase
  log('\n2. Criando cliente Supabase...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  
  logSuccess('Cliente Supabase criado');
  
  // Testar conectividade básica
  log('\n3. Testando conectividade básica...');
  
  try {
    // Teste simples de autenticação
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      logWarning(`Auth error (esperado): ${authError.message}`);
    } else {
      logSuccess('Conexão com auth estabelecida');
    }
    
    logSuccess('Conectividade básica OK');
  } catch (error) {
    logError(`Erro de conectividade: ${error.message}`);
    return false;
  }
  
  // Testar acesso ao banco de dados
  log('\n4. Testando acesso ao banco de dados...');
  
  try {
    // Tentar listar tabelas usando service role
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (tablesError) {
      logWarning(`Erro ao listar tabelas: ${tablesError.message}`);
      
      // Tentar uma consulta mais simples
      const { data: simpleTest, error: simpleError } = await supabase
        .from('dre_hitss')
        .select('count', { count: 'exact', head: true });
      
      if (simpleError) {
        logError(`Erro ao acessar tabela dre_hitss: ${simpleError.message}`);
        
        if (simpleError.message.includes('does not exist')) {
          logWarning('Tabela dre_hitss não existe - sistema pode não estar configurado');
        } else if (simpleError.message.includes('permission denied')) {
          logWarning('Sem permissão para acessar tabela - verificar RLS');
        }
      } else {
        logSuccess('Acesso à tabela dre_hitss OK');
      }
    } else {
      logSuccess(`${tables?.length || 0} tabelas encontradas no schema public`);
      if (tables && tables.length > 0) {
        logInfo('Tabelas: ' + tables.map(t => t.table_name).join(', '));
      }
    }
  } catch (error) {
    logError(`Erro ao testar banco de dados: ${error.message}`);
  }
  
  // Testar Storage
  log('\n5. Testando Supabase Storage...');
  
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      logWarning(`Erro ao listar buckets: ${bucketsError.message}`);
    } else {
      logSuccess(`${buckets?.length || 0} buckets encontrados`);
      
      if (buckets && buckets.length > 0) {
        logInfo('Buckets: ' + buckets.map(b => b.name).join(', '));
        
        // Verificar bucket específico
        const dreBucket = buckets.find(b => b.name === 'dre_reports');
        if (dreBucket) {
          logSuccess('Bucket dre_reports encontrado');
          
          // Tentar listar arquivos
          const { data: files, error: filesError } = await supabase.storage
            .from('dre_reports')
            .list('', { limit: 5 });
          
          if (filesError) {
            logWarning(`Erro ao listar arquivos: ${filesError.message}`);
          } else {
            logSuccess(`${files?.length || 0} arquivos no bucket dre_reports`);
          }
        } else {
          logWarning('Bucket dre_reports não encontrado');
        }
      }
    }
  } catch (error) {
    logError(`Erro ao testar storage: ${error.message}`);
  }
  
  // Testar Edge Functions
  log('\n6. Testando Edge Functions...');
  
  const edgeFunctions = [
    'process-dre-upload',
    'send-email-notification', 
    'download-hitss-data'
  ];
  
  for (const funcName of edgeFunctions) {
    try {
      const { data, error } = await supabase.functions.invoke(funcName, {
        body: { test: true }
      });
      
      if (error) {
        if (error.message.includes('not found') || error.message.includes('404')) {
          logWarning(`Edge Function ${funcName} não encontrada`);
        } else {
          logWarning(`Edge Function ${funcName}: ${error.message}`);
        }
      } else {
        logSuccess(`Edge Function ${funcName} respondeu`);
      }
    } catch (error) {
      logWarning(`Erro ao testar ${funcName}: ${error.message}`);
    }
  }
  
  log('\n' + '='.repeat(50));
  logSuccess('TESTE DE CONECTIVIDADE CONCLUÍDO');
  
  return true;
}

// Executar teste
testSupabaseConnection().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});