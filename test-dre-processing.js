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

async function testDREProcessing() {
  log('⚙️  TESTANDO PROCESSAMENTO DRE EDGE FUNCTION', 'bold');
  log('='.repeat(50));
  
  try {
    // 1. Verificar se a Edge Function existe
    logStep('1/7', 'Verificando disponibilidade da Edge Function process-dre-upload...');
    
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/process-dre-upload`;
    log(`   URL da Edge Function: ${edgeFunctionUrl}`);
    
    // 2. Testar conectividade básica
    logStep('2/7', 'Testando conectividade básica...');
    
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
    
    // 3. Criar arquivo de teste no bucket
    logStep('3/7', 'Criando arquivo de teste no bucket...');
    
    const testData = `Código,Descrição,Valor,Tipo\n3.01.01,Receita de Vendas,1000000.00,Receita\n3.02.01,Custo dos Produtos,-600000.00,Custo\n3.03.01,Despesas Operacionais,-200000.00,Despesa\n3.04.01,Resultado Líquido,200000.00,Resultado`;
    const testFileName = `test-dre-processing-${Date.now()}.csv`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('dre_reports')
      .upload(testFileName, testData, {
        contentType: 'text/csv'
      });
    
    if (uploadError) {
      logError(`Erro no upload do arquivo de teste: ${uploadError.message}`);
      throw uploadError;
    }
    
    logSuccess(`Arquivo de teste criado: ${testFileName}`);
    log(`   • Caminho: ${uploadData.path}`);
    log(`   • Tamanho: ${testData.length} bytes`);
    
    // 4. Testar processamento com arquivo real
    logStep('4/7', 'Testando processamento com arquivo real...');
    
    const processingPayload = {
      fileName: testFileName,
      bucketName: 'dre_reports',
      source: 'manual_test',
      test: true
    };
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processingPayload)
      });
      
      const duration = Date.now() - startTime;
      log(`   Tempo de processamento: ${duration}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      log(`   Resposta do processamento:`, 'blue');
      log(`   ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        logSuccess('Processamento DRE concluído com sucesso');
        
        if (result.data) {
          log(`   📊 Dados processados:`);
          log(`      • Registros processados: ${result.data.recordsProcessed || 'N/A'}`);
          log(`      • Registros inseridos: ${result.data.recordsInserted || 'N/A'}`);
          log(`      • Arquivo processado: ${result.data.fileName || 'N/A'}`);
          log(`      • Tamanho do arquivo: ${result.data.fileSize || 'N/A'}`);
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
      logError(`Erro no processamento: ${error.message}`);
      throw error;
    }
    
    // 5. Testar processamento com dados inválidos
    logStep('5/7', 'Testando processamento com dados inválidos...');
    
    const invalidPayload = {
      fileName: 'arquivo-inexistente.csv',
      bucketName: 'dre_reports',
      source: 'error_test'
    };
    
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidPayload)
      });
      
      const result = await response.json();
      
      if (result.success === false) {
        logSuccess('Edge Function tratou corretamente dados inválidos');
        log(`   Erro esperado: ${result.error}`);
      } else {
        logWarning('Edge Function não detectou dados inválidos como esperado');
      }
      
    } catch (error) {
      logSuccess('Edge Function rejeitou dados inválidos corretamente');
      log(`   Erro capturado: ${error.message}`);
    }
    
    // 6. Verificar dados inseridos na tabela
    logStep('6/7', 'Verificando dados inseridos na tabela dre_hitss...');
    
    try {
      const { data: insertedData, error: dataError } = await supabase
        .from('dre_hitss')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (dataError) {
        logWarning(`Erro ao buscar dados inseridos: ${dataError.message}`);
      } else if (insertedData && insertedData.length > 0) {
        logSuccess(`${insertedData.length} registro(s) encontrado(s) na tabela dre_hitss`);
        
        // Mostrar os últimos registros
        insertedData.slice(0, 3).forEach((record, index) => {
          log(`\n   Registro ${index + 1}:`);
          log(`     • ID: ${record.id}`);
          log(`     • Código: ${record.codigo || 'N/A'}`);
          log(`     • Descrição: ${record.descricao || 'N/A'}`);
          log(`     • Valor: ${record.valor || 'N/A'}`);
          log(`     • Tipo: ${record.tipo || 'N/A'}`);
          log(`     • Criado: ${new Date(record.created_at).toLocaleString()}`);
        });
        
        if (insertedData.length > 3) {
          log(`\n   ... e mais ${insertedData.length - 3} registro(s)`);
        }
      } else {
        logWarning('Nenhum dado encontrado na tabela dre_hitss');
      }
    } catch (error) {
      logWarning(`Erro ao verificar dados inseridos: ${error.message}`);
    }
    
    // 7. Verificar logs de processamento
    logStep('7/7', 'Verificando logs de processamento...');
    
    try {
      const { data: processingLogs, error: logsError } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('automation_type', 'dre_processing')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (logsError) {
        logWarning(`Erro ao buscar logs de processamento: ${logsError.message}`);
      } else if (processingLogs && processingLogs.length > 0) {
        logSuccess(`${processingLogs.length} log(s) de processamento encontrado(s)`);
        
        processingLogs.forEach((logEntry, index) => {
          const statusIcon = logEntry.status === 'success' ? '✅' : 
                            logEntry.status === 'error' ? '❌' : '⚠️';
          
          log(`\n   Log ${index + 1}:`);
          log(`     • Status: ${statusIcon} ${logEntry.status}`);
          log(`     • Criado: ${new Date(logEntry.created_at).toLocaleString()}`);
          log(`     • Atualizado: ${new Date(logEntry.updated_at).toLocaleString()}`);
          
          if (logEntry.error_message) {
            log(`     • Erro: ${logEntry.error_message}`, 'red');
          }
          
          if (logEntry.metadata) {
            const metadata = typeof logEntry.metadata === 'string' ? 
                           JSON.parse(logEntry.metadata) : logEntry.metadata;
            log(`     • Arquivo: ${metadata.fileName || 'N/A'}`);
            log(`     • Registros: ${metadata.recordsProcessed || 'N/A'}`);
          }
        });
      } else {
        logWarning('Nenhum log de processamento encontrado');
      }
    } catch (error) {
      logWarning(`Erro ao verificar logs: ${error.message}`);
    }
    
    // Limpeza: remover arquivo de teste
    try {
      const { error: deleteError } = await supabase.storage
        .from('dre_reports')
        .remove([testFileName]);
      
      if (deleteError) {
        logWarning(`Erro ao remover arquivo de teste: ${deleteError.message}`);
      } else {
        log(`\n🧹 Arquivo de teste removido: ${testFileName}`, 'cyan');
      }
    } catch (error) {
      logWarning(`Erro na limpeza: ${error.message}`);
    }
    
    log('\n' + '='.repeat(50));
    logSuccess('TESTE DE PROCESSAMENTO DRE CONCLUÍDO');
    
  } catch (error) {
    log('\n' + '='.repeat(50));
    logError(`TESTE FALHOU: ${error.message}`);
    
    // Sugestões de troubleshooting
    log('\n🔧 SUGESTÕES DE TROUBLESHOOTING:', 'yellow');
    log('   1. Verifique se a Edge Function process-dre-upload está deployada');
    log('   2. Confirme as variáveis de ambiente no Supabase Dashboard');
    log('   3. Verifique as permissões da tabela dre_hitss');
    log('   4. Consulte os logs da Edge Function no Dashboard');
    log('   5. Verifique a estrutura da tabela dre_hitss');
    log('   6. Confirme as políticas RLS da tabela');
    
    process.exit(1);
  }
}

// Executar teste
testDREProcessing().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});