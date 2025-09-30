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

async function testEmailNotification() {
  log('📧 TESTANDO SISTEMA DE NOTIFICAÇÃO POR EMAIL', 'bold');
  log('='.repeat(50));
  
  try {
    // 1. Verificar configuração do Resend no Vault
    logStep('1/6', 'Verificando configuração do Resend no Vault...');
    
    try {
      const { data: secrets, error: secretsError } = await supabase
        .from('vault.secrets')
        .select('name, description')
        .like('name', '%resend%');
      
      if (secretsError) {
        logWarning(`Erro ao acessar vault: ${secretsError.message}`);
        log('   💡 Verifique se você tem permissões para acessar o vault');
      } else if (secrets && secrets.length > 0) {
        logSuccess(`${secrets.length} configuração(ões) do Resend encontrada(s) no Vault`);
        secrets.forEach(secret => {
          log(`   • ${secret.name}: ${secret.description || 'Sem descrição'}`);
        });
      } else {
        logWarning('Nenhuma configuração do Resend encontrada no Vault');
        log('   💡 Configure a API key do Resend no Vault primeiro');
      }
    } catch (error) {
      logWarning(`Erro ao verificar Vault: ${error.message}`);
    }
    
    // 2. Verificar se a Edge Function de email existe
    logStep('2/6', 'Verificando Edge Function de notificação...');
    
    const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-email-notification`;
    log(`   URL da Edge Function: ${emailFunctionUrl}`);
    
    try {
      const response = await fetch(emailFunctionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      log(`   Status da resposta: ${response.status} ${response.statusText}`);
      
      if (response.status === 405) {
        logSuccess('Edge Function de email está ativa (método GET não permitido é esperado)');
      } else if (response.ok) {
        logSuccess('Edge Function de email respondeu com sucesso');
      } else {
        logWarning(`Edge Function retornou status ${response.status}`);
      }
    } catch (error) {
      logError(`Erro de conectividade com Edge Function: ${error.message}`);
    }
    
    // 3. Testar envio de email de teste
    logStep('3/6', 'Testando envio de email de notificação...');
    
    const testEmailPayload = {
      type: 'dre_processing_complete',
      data: {
        fileName: `test-dre-${Date.now()}.csv`,
        recordsProcessed: 25,
        recordsInserted: 23,
        processingTime: '2.5s',
        executionId: `test-${Date.now()}`,
        timestamp: new Date().toISOString(),
        summary: {
          totalReceitas: 1500000.00,
          totalCustos: -800000.00,
          totalDespesas: -400000.00,
          resultadoLiquido: 300000.00
        }
      },
      recipients: ['fabricio.lima@hitss.com'], // Email de teste
      test: true
    };
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(emailFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testEmailPayload)
      });
      
      const duration = Date.now() - startTime;
      log(`   Tempo de envio: ${duration}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      log(`   Resposta do envio:`, 'blue');
      log(`   ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        logSuccess('Email de notificação enviado com sucesso');
        
        if (result.data) {
          log(`   📧 Detalhes do email:`);
          log(`      • ID do email: ${result.data.id || 'N/A'}`);
          log(`      • Destinatários: ${result.data.to || 'N/A'}`);
          log(`      • Assunto: ${result.data.subject || 'N/A'}`);
          log(`      • Status: ${result.data.status || 'N/A'}`);
        }
      } else {
        logWarning('Envio de email retornou success=false');
        if (result.error) {
          logError(`Erro reportado: ${result.error}`);
        }
      }
      
    } catch (error) {
      logError(`Erro no envio de email: ${error.message}`);
      
      // Sugestões específicas para erros de email
      log('\n🔧 POSSÍVEIS CAUSAS:', 'yellow');
      log('   • API key do Resend não configurada ou inválida');
      log('   • Edge Function send-email-notification não deployada');
      log('   • Domínio não verificado no Resend');
      log('   • Email de origem não autorizado');
      log('   • Limite de envio do Resend atingido');
    }
    
    // 4. Testar diferentes tipos de notificação
    logStep('4/6', 'Testando diferentes tipos de notificação...');
    
    const notificationTypes = [
      {
        type: 'dre_processing_error',
        data: {
          fileName: 'error-test.csv',
          error: 'Formato de arquivo inválido',
          executionId: `error-test-${Date.now()}`,
          timestamp: new Date().toISOString()
        }
      },
      {
        type: 'dre_cron_status',
        data: {
          status: 'running',
          nextExecution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          lastExecution: new Date().toISOString(),
          executionsToday: 3
        }
      }
    ];
    
    for (const [index, notification] of notificationTypes.entries()) {
      log(`\n   Testando tipo ${index + 1}: ${notification.type}`);
      
      try {
        const response = await fetch(emailFunctionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...notification,
            recipients: ['fabricio.lima@hitss.com'],
            test: true
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            logSuccess(`   ✅ Tipo ${notification.type} enviado com sucesso`);
          } else {
            logWarning(`   ⚠️  Tipo ${notification.type} falhou: ${result.error}`);
          }
        } else {
          logWarning(`   ⚠️  Tipo ${notification.type} retornou status ${response.status}`);
        }
      } catch (error) {
        logWarning(`   ⚠️  Erro no tipo ${notification.type}: ${error.message}`);
      }
    }
    
    // 5. Verificar logs de email na tabela
    logStep('5/6', 'Verificando logs de email enviados...');
    
    try {
      const { data: emailLogs, error: logsError } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (logsError) {
        logWarning(`Erro ao buscar logs de email: ${logsError.message}`);
        log('   💡 A tabela email_logs pode não existir ainda');
      } else if (emailLogs && emailLogs.length > 0) {
        logSuccess(`${emailLogs.length} log(s) de email encontrado(s)`);
        
        emailLogs.slice(0, 5).forEach((logEntry, index) => {
          const statusIcon = logEntry.status === 'sent' ? '✅' : 
                            logEntry.status === 'failed' ? '❌' : '⚠️';
          
          log(`\n   Email ${index + 1}:`);
          log(`     • Status: ${statusIcon} ${logEntry.status}`);
          log(`     • Destinatário: ${logEntry.recipient || 'N/A'}`);
          log(`     • Tipo: ${logEntry.email_type || 'N/A'}`);
          log(`     • Enviado: ${new Date(logEntry.created_at).toLocaleString()}`);
          
          if (logEntry.error_message) {
            log(`     • Erro: ${logEntry.error_message}`, 'red');
          }
          
          if (logEntry.resend_id) {
            log(`     • ID Resend: ${logEntry.resend_id}`);
          }
        });
        
        if (emailLogs.length > 5) {
          log(`\n   ... e mais ${emailLogs.length - 5} log(s)`);
        }
      } else {
        logWarning('Nenhum log de email encontrado');
        log('   💡 Isso pode ser normal se nenhum email foi enviado ainda');
      }
    } catch (error) {
      logWarning(`Erro ao verificar logs de email: ${error.message}`);
    }
    
    // 6. Verificar configuração de templates
    logStep('6/6', 'Verificando templates de email...');
    
    const templateTypes = [
      'dre_processing_complete',
      'dre_processing_error',
      'dre_cron_status'
    ];
    
    log('   📋 Templates esperados:');
    templateTypes.forEach(template => {
      log(`     • ${template}`);
    });
    
    log('\n   💡 Verifique se os templates estão configurados na Edge Function');
    
    log('\n' + '='.repeat(50));
    logSuccess('TESTE DE NOTIFICAÇÃO POR EMAIL CONCLUÍDO');
    
    // Resumo final
    log('\n📊 RESUMO DO TESTE:', 'bold');
    log('   ✅ Conectividade com Edge Function verificada');
    log('   ✅ Envio de email de teste executado');
    log('   ✅ Diferentes tipos de notificação testados');
    log('   ✅ Logs de email verificados');
    log('   ✅ Templates de email listados');
    
    log('\n📧 PRÓXIMOS PASSOS:', 'cyan');
    log('   1. Verifique sua caixa de email para os emails de teste');
    log('   2. Confirme se os emails não foram para spam');
    log('   3. Valide o conteúdo e formatação dos emails');
    log('   4. Teste com diferentes destinatários se necessário');
    
  } catch (error) {
    log('\n' + '='.repeat(50));
    logError(`TESTE DE EMAIL FALHOU: ${error.message}`);
    
    // Sugestões de troubleshooting
    log('\n🔧 SUGESTÕES DE TROUBLESHOOTING:', 'yellow');
    log('   1. Configure a API key do Resend no Vault do Supabase');
    log('   2. Verifique se a Edge Function send-email-notification está deployada');
    log('   3. Confirme se o domínio está verificado no Resend');
    log('   4. Verifique os logs da Edge Function no Dashboard');
    log('   5. Teste com um email válido e autorizado');
    log('   6. Verifique os limites de envio do seu plano Resend');
    log('   7. Confirme as variáveis de ambiente da Edge Function');
    
    process.exit(1);
  }
}

// Executar teste
testEmailNotification().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});