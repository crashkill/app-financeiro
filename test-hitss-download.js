import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

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

function logStep(step, message) {
  log(`\n${colors.bold}[${step}]${colors.reset} ${message}`, 'cyan');
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

async function testHitssDownload() {
  log('🔍 TESTANDO DOWNLOAD E PROCESSAMENTO HITSS', 'bold');
  log('='.repeat(50));
  
  try {
    // 1. Verificar se a Edge Function existe
    logStep('1/5', 'Verificando disponibilidade da Edge Function hitss-automation...');
    
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/hitss-automation`;
    log(`   URL da Edge Function: ${edgeFunctionUrl}`);
    
    // 2. Testar conectividade básica
    logStep('2/5', 'Testando conectividade básica...');
    
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      log(`   Status da resposta: ${response.status} ${response.statusText}`);
      
      if (response.status === 405) {
        logSuccess('Edge Function está ativa (método GET não permitido é esperado)');
      } else if (response.ok) {
        logSuccess('Edge Function respondeu com sucesso');
      } else {
        logWarning(`Edge Function retornou status ${response.status}`);
      }
    } catch (error) {
      logError(`Erro de conectividade: ${error.message}`);
      throw error;
    }
    
    // 3. Testar execução com parâmetros de teste
    logStep('3/5', 'Executando Edge Function com parâmetros de teste...');
    
    const testPayload = {
      test: true,
      dryRun: true,
      source: 'manual_test'
    };
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      const duration = Date.now() - startTime;
      log(`   Tempo de resposta: ${duration}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      log(`   Resposta recebida:`, 'blue');
      log(`   ${JSON.stringify(result, null, 2)}`);
      
      logSuccess('Edge Function executada com sucesso');
      
      // Analisar resposta
      if (result.success) {
        logSuccess('Processamento HITSS concluído com sucesso');
        
        if (result.data) {
          log(`   📊 Dados processados:`);
          log(`      • Registros: ${result.data.recordCount || 'N/A'}`);
          log(`      • Arquivo: ${result.data.fileName || 'N/A'}`);
          log(`      • Tamanho: ${result.data.fileSize || 'N/A'}`);
        }
        
        if (result.executionId) {
          log(`   🆔 ID da execução: ${result.executionId}`);
        }
      } else {
        logWarning('Processamento retornou success=false');
        if (result.error) {
          logError(`Erro reportado: ${result.error}`);
        }
      }
      
    } catch (error) {
      logError(`Erro na execução: ${error.message}`);
      throw error;
    }
    
    // 4. Verificar logs de execução
    logStep('4/5', 'Verificando logs de execução...');
    
    try {
      const { data: logs, error: logsError } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('automation_type', 'hitss')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (logsError) {
        logWarning(`Erro ao buscar logs: ${logsError.message}`);
      } else if (logs && logs.length > 0) {
        logSuccess(`${logs.length} log(s) de execução encontrado(s)`);
        
        logs.forEach((logEntry, index) => {
          const statusIcon = logEntry.status === 'success' ? '✅' : 
                            logEntry.status === 'error' ? '❌' : '⚠️';
          
          log(`\n   Log ${index + 1}:`);
          log(`     • Status: ${statusIcon} ${logEntry.status}`);
          log(`     • Criado: ${new Date(logEntry.created_at).toLocaleString()}`);
          
          if (logEntry.error_message) {
            log(`     • Erro: ${logEntry.error_message}`, 'red');
          }
          
          if (logEntry.metadata) {
            log(`     • Metadata: ${JSON.stringify(logEntry.metadata)}`);
          }
        });
      } else {
        logWarning('Nenhum log de execução encontrado');
      }
    } catch (error) {
      logWarning(`Erro ao verificar logs: ${error.message}`);
    }
    
    // 5. Verificar dados HITSS processados
    logStep('5/5', 'Verificando dados HITSS processados...');
    
    try {
      const { data: hitssData, error: dataError } = await supabase
        .from('dre_hitss')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (dataError) {
        logWarning(`Erro ao buscar dados HITSS: ${dataError.message}`);
      } else if (hitssData && hitssData.length > 0) {
        logSuccess(`${hitssData.length} registro(s) HITSS encontrado(s) na tabela`);
        
        const latestRecord = hitssData[0];
        log(`\n   Último registro:`);
        log(`     • ID: ${latestRecord.id}`);
        log(`     • Código: ${latestRecord.codigo || 'N/A'}`);
        log(`     • Descrição: ${latestRecord.descricao || 'N/A'}`);
        log(`     • Valor: ${latestRecord.valor || 'N/A'}`);
        log(`     • Criado: ${new Date(latestRecord.created_at).toLocaleString()}`);
      } else {
        logWarning('Nenhum dado HITSS encontrado na tabela');
      }
    } catch (error) {
      logWarning(`Erro ao verificar dados HITSS: ${error.message}`);
    }
    
    log('\n' + '='.repeat(50));
    logSuccess('TESTE DE DOWNLOAD HITSS CONCLUÍDO');
    
  } catch (error) {
    log('\n' + '='.repeat(50));
    logError(`TESTE FALHOU: ${error.message}`);
    
    // Sugestões de troubleshooting
    log('\n🔧 SUGESTÕES DE TROUBLESHOOTING:', 'yellow');
    log('   1. Verifique se a Edge Function hitss-automation está deployada');
    log('   2. Confirme as variáveis de ambiente no Supabase Dashboard');
    log('   3. Verifique as permissões da API key');
    log('   4. Consulte os logs da Edge Function no Dashboard');
    log('   5. Teste a conectividade de rede');
    
    process.exit(1);
  }
}

// Executar teste
testHitssDownload().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});