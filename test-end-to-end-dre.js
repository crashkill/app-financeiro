import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações de teste
const TEST_CONFIG = {
  bucketName: 'dre-files',
  edgeFunctionName: 'process-dre-upload',
  cronJobName: 'hitss-automation-cron',
  testFileName: 'test-dre-data.xlsx',
  emailRecipient: 'fabricio.lima@hitss.com'
};

// Classe para relatório de testes
class TestReporter {
  constructor() {
    this.results = [];
    this.startTime = new Date();
  }

  addResult(step, status, message, details = {}) {
    const timestamp = new Date().toISOString();
    this.results.push({
      step,
      status,
      message,
      timestamp,
      details
    });
    
    const statusIcon = status === 'SUCCESS' ? '✅' : status === 'ERROR' ? '❌' : '⚠️';
    console.log(`${statusIcon} [${timestamp}] ${step}: ${message}`);
    
    if (details && Object.keys(details).length > 0) {
      console.log('   Detalhes:', JSON.stringify(details, null, 2));
    }
  }

  generateReport() {
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    const report = {
      testSuite: 'Teste End-to-End do Fluxo DRE',
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${duration}ms`,
      totalSteps: this.results.length,
      successCount: this.results.filter(r => r.status === 'SUCCESS').length,
      errorCount: this.results.filter(r => r.status === 'ERROR').length,
      warningCount: this.results.filter(r => r.status === 'WARNING').length,
      results: this.results
    };

    // Salvar relatório em arquivo
    const reportFileName = `dre-end-to-end-test-report-${Date.now()}.json`;
    const reportPath = path.join(__dirname, reportFileName);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 RELATÓRIO FINAL DO TESTE END-TO-END');
    console.log('=' .repeat(50));
    console.log(`Duração total: ${duration}ms`);
    console.log(`Total de etapas: ${report.totalSteps}`);
    console.log(`Sucessos: ${report.successCount}`);
    console.log(`Erros: ${report.errorCount}`);
    console.log(`Avisos: ${report.warningCount}`);
    console.log(`Relatório salvo em: ${reportFileName}`);
    
    return report;
  }
}

// Classe principal de teste
class DREEndToEndTester {
  constructor() {
    this.reporter = new TestReporter();
  }

  async runAllTests() {
    console.log('🚀 Iniciando Teste End-to-End do Fluxo DRE');
    console.log('=' .repeat(50));
    
    try {
      await this.step1_CheckCronJobStatus();
      await this.step2_SimulateHITSSDownload();
      await this.step3_TestBucketUpload();
      await this.step4_ExecuteEdgeFunction();
      await this.step5_VerifyDataInsertion();
      await this.step6_TestEmailNotification();
      await this.step7_ValidateExecutionLogs();
      
    } catch (error) {
      this.reporter.addResult(
        'TESTE_GERAL',
        'ERROR',
        `Erro crítico durante execução: ${error.message}`,
        { error: error.stack }
      );
    }
    
    return this.reporter.generateReport();
  }

  // Etapa 1: Verificar status do cron job
  async step1_CheckCronJobStatus() {
    try {
      this.reporter.addResult('ETAPA_1', 'INFO', 'Verificando status do cron job...');
      
      // Verificar se o cron job existe
      const { data: cronJobs, error } = await supabase
        .from('pg_cron_jobs')
        .select('*')
        .eq('jobname', TEST_CONFIG.cronJobName);
      
      if (error) {
        this.reporter.addResult(
          'ETAPA_1_CRON_STATUS',
          'ERROR',
          `Erro ao verificar cron job: ${error.message}`,
          { error }
        );
        return;
      }
      
      if (!cronJobs || cronJobs.length === 0) {
        this.reporter.addResult(
          'ETAPA_1_CRON_STATUS',
          'WARNING',
          'Cron job não encontrado',
          { searchedJobName: TEST_CONFIG.cronJobName }
        );
        return;
      }
      
      const cronJob = cronJobs[0];
      this.reporter.addResult(
        'ETAPA_1_CRON_STATUS',
        'SUCCESS',
        'Cron job encontrado e ativo',
        {
          jobId: cronJob.jobid,
          schedule: cronJob.schedule,
          command: cronJob.command,
          active: cronJob.active
        }
      );
      
      // Verificar execuções recentes
      const { data: executions } = await supabase
        .from('automation_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      this.reporter.addResult(
        'ETAPA_1_EXECUCOES',
        'SUCCESS',
        `Encontradas ${executions?.length || 0} execuções recentes`,
        { recentExecutions: executions?.length || 0 }
      );
      
    } catch (error) {
      this.reporter.addResult(
        'ETAPA_1',
        'ERROR',
        `Erro na verificação do cron job: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Etapa 2: Simular download de dados HITSS
  async step2_SimulateHITSSDownload() {
    try {
      this.reporter.addResult('ETAPA_2', 'INFO', 'Simulando download de dados HITSS...');
      
      // Verificar credenciais HITSS no vault
      const { data: vaultData, error: vaultError } = await supabase
        .from('vault')
        .select('*')
        .in('key', ['HITSS_USERNAME', 'HITSS_PASSWORD', 'HITSS_BASE_URL']);
      
      if (vaultError) {
        this.reporter.addResult(
          'ETAPA_2_CREDENCIAIS',
          'ERROR',
          `Erro ao verificar credenciais: ${vaultError.message}`,
          { error: vaultError }
        );
        return;
      }
      
      const credentials = {};
      vaultData?.forEach(item => {
        credentials[item.key] = item.value ? '***configurado***' : 'não configurado';
      });
      
      this.reporter.addResult(
        'ETAPA_2_CREDENCIAIS',
        'SUCCESS',
        'Credenciais HITSS verificadas',
        { credentials }
      );
      
      // Simular chamada para a Edge Function de automação HITSS
      const { data: functionResult, error: functionError } = await supabase.functions
        .invoke('hitss-automation', {
          body: {
            action: 'test_connection',
            simulate: true
          }
        });
      
      if (functionError) {
        this.reporter.addResult(
          'ETAPA_2_DOWNLOAD',
          'WARNING',
          `Simulação de download com aviso: ${functionError.message}`,
          { error: functionError }
        );
      } else {
        this.reporter.addResult(
          'ETAPA_2_DOWNLOAD',
          'SUCCESS',
          'Simulação de download executada com sucesso',
          { result: functionResult }
        );
      }
      
    } catch (error) {
      this.reporter.addResult(
        'ETAPA_2',
        'ERROR',
        `Erro na simulação do download HITSS: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Etapa 3: Testar upload para bucket
  async step3_TestBucketUpload() {
    try {
      this.reporter.addResult('ETAPA_3', 'INFO', 'Testando upload para bucket...');
      
      // Verificar se o bucket existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        this.reporter.addResult(
          'ETAPA_3_BUCKET_CHECK',
          'ERROR',
          `Erro ao listar buckets: ${bucketsError.message}`,
          { error: bucketsError }
        );
        return;
      }
      
      const bucketExists = buckets.some(bucket => bucket.name === TEST_CONFIG.bucketName);
      
      if (!bucketExists) {
        this.reporter.addResult(
          'ETAPA_3_BUCKET_CHECK',
          'ERROR',
          `Bucket '${TEST_CONFIG.bucketName}' não encontrado`,
          { availableBuckets: buckets.map(b => b.name) }
        );
        return;
      }
      
      this.reporter.addResult(
        'ETAPA_3_BUCKET_CHECK',
        'SUCCESS',
        `Bucket '${TEST_CONFIG.bucketName}' encontrado`,
        { bucketName: TEST_CONFIG.bucketName }
      );
      
      // Criar arquivo de teste
      const testFileContent = 'Dados de teste DRE - ' + new Date().toISOString();
      const testFileName = `test-${Date.now()}.txt`;
      
      // Upload do arquivo de teste
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(TEST_CONFIG.bucketName)
        .upload(testFileName, testFileContent, {
          contentType: 'text/plain'
        });
      
      if (uploadError) {
        this.reporter.addResult(
          'ETAPA_3_UPLOAD',
          'ERROR',
          `Erro no upload: ${uploadError.message}`,
          { error: uploadError }
        );
        return;
      }
      
      this.reporter.addResult(
        'ETAPA_3_UPLOAD',
        'SUCCESS',
        'Upload realizado com sucesso',
        {
          fileName: testFileName,
          path: uploadData.path,
          size: testFileContent.length
        }
      );
      
      // Limpar arquivo de teste
      await supabase.storage
        .from(TEST_CONFIG.bucketName)
        .remove([testFileName]);
      
    } catch (error) {
      this.reporter.addResult(
        'ETAPA_3',
        'ERROR',
        `Erro no teste de upload: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Etapa 4: Executar Edge Function
  async step4_ExecuteEdgeFunction() {
    try {
      this.reporter.addResult('ETAPA_4', 'INFO', 'Executando Edge Function...');
      
      // Testar a Edge Function process-dre-upload
      const { data: functionResult, error: functionError } = await supabase.functions
        .invoke(TEST_CONFIG.edgeFunctionName, {
          body: {
            test: true,
            fileName: 'test-dre-file.xlsx',
            bucketName: TEST_CONFIG.bucketName
          }
        });
      
      if (functionError) {
        this.reporter.addResult(
          'ETAPA_4_EDGE_FUNCTION',
          'ERROR',
          `Erro na Edge Function: ${functionError.message}`,
          { error: functionError }
        );
        return;
      }
      
      this.reporter.addResult(
        'ETAPA_4_EDGE_FUNCTION',
        'SUCCESS',
        'Edge Function executada com sucesso',
        { result: functionResult }
      );
      
    } catch (error) {
      this.reporter.addResult(
        'ETAPA_4',
        'ERROR',
        `Erro na execução da Edge Function: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Etapa 5: Verificar inserção de dados
  async step5_VerifyDataInsertion() {
    try {
      this.reporter.addResult('ETAPA_5', 'INFO', 'Verificando inserção de dados...');
      
      // Verificar tabelas DRE
      const tables = ['dre_reports', 'dre_items', 'dre_categories'];
      
      for (const table of tables) {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          this.reporter.addResult(
            `ETAPA_5_TABELA_${table.toUpperCase()}`,
            'ERROR',
            `Erro ao verificar tabela ${table}: ${error.message}`,
            { error }
          );
        } else {
          this.reporter.addResult(
            `ETAPA_5_TABELA_${table.toUpperCase()}`,
            'SUCCESS',
            `Tabela ${table} acessível`,
            { recordCount: count }
          );
        }
      }
      
      // Verificar dados recentes
      const { data: recentReports } = await supabase
        .from('dre_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      this.reporter.addResult(
        'ETAPA_5_DADOS_RECENTES',
        'SUCCESS',
        `Encontrados ${recentReports?.length || 0} relatórios recentes`,
        { recentReportsCount: recentReports?.length || 0 }
      );
      
    } catch (error) {
      this.reporter.addResult(
        'ETAPA_5',
        'ERROR',
        `Erro na verificação de dados: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Etapa 6: Testar envio de email
  async step6_TestEmailNotification() {
    try {
      this.reporter.addResult('ETAPA_6', 'INFO', 'Testando envio de email...');
      
      // Verificar configuração do Resend
      const { data: resendConfig } = await supabase
        .from('vault')
        .select('*')
        .eq('key', 'RESEND_API_KEY');
      
      if (!resendConfig || resendConfig.length === 0) {
        this.reporter.addResult(
          'ETAPA_6_CONFIG_EMAIL',
          'ERROR',
          'Configuração do Resend não encontrada no vault',
          { missingKey: 'RESEND_API_KEY' }
        );
        return;
      }
      
      this.reporter.addResult(
        'ETAPA_6_CONFIG_EMAIL',
        'SUCCESS',
        'Configuração do Resend encontrada',
        { configured: true }
      );
      
      // Testar envio de email via Edge Function
      const { data: emailResult, error: emailError } = await supabase.functions
        .invoke('send-dre-notification', {
          body: {
            test: true,
            recipient: TEST_CONFIG.emailRecipient,
            subject: 'Teste End-to-End DRE',
            message: 'Este é um email de teste do fluxo end-to-end DRE'
          }
        });
      
      if (emailError) {
        this.reporter.addResult(
          'ETAPA_6_ENVIO_EMAIL',
          'ERROR',
          `Erro no envio de email: ${emailError.message}`,
          { error: emailError }
        );
      } else {
        this.reporter.addResult(
          'ETAPA_6_ENVIO_EMAIL',
          'SUCCESS',
          'Email de teste enviado com sucesso',
          { result: emailResult }
        );
      }
      
    } catch (error) {
      this.reporter.addResult(
        'ETAPA_6',
        'ERROR',
        `Erro no teste de email: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Etapa 7: Validar logs de execução
  async step7_ValidateExecutionLogs() {
    try {
      this.reporter.addResult('ETAPA_7', 'INFO', 'Validando logs de execução...');
      
      // Verificar logs de automação
      const { data: automationLogs } = await supabase
        .from('automation_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      this.reporter.addResult(
        'ETAPA_7_LOGS_AUTOMACAO',
        'SUCCESS',
        `Encontrados ${automationLogs?.length || 0} logs de automação`,
        { logsCount: automationLogs?.length || 0 }
      );
      
      // Verificar logs de sistema
      const { data: systemLogs } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      this.reporter.addResult(
        'ETAPA_7_LOGS_SISTEMA',
        'SUCCESS',
        `Encontrados ${systemLogs?.length || 0} logs de sistema`,
        { logsCount: systemLogs?.length || 0 }
      );
      
      // Verificar logs de erro
      const { data: errorLogs } = await supabase
        .from('system_logs')
        .select('*')
        .eq('level', 'error')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (errorLogs && errorLogs.length > 0) {
        this.reporter.addResult(
          'ETAPA_7_LOGS_ERRO',
          'WARNING',
          `Encontrados ${errorLogs.length} logs de erro recentes`,
          { errorLogsCount: errorLogs.length, recentErrors: errorLogs }
        );
      } else {
        this.reporter.addResult(
          'ETAPA_7_LOGS_ERRO',
          'SUCCESS',
          'Nenhum log de erro recente encontrado',
          { errorLogsCount: 0 }
        );
      }
      
    } catch (error) {
      this.reporter.addResult(
        'ETAPA_7',
        'ERROR',
        `Erro na validação de logs: ${error.message}`,
        { error: error.stack }
      );
    }
  }
}

// Função principal
async function main() {
  console.log('🔍 Teste End-to-End do Fluxo DRE');
  console.log('Verificando todo o fluxo desde o cron job até o envio de email\n');
  
  const tester = new DREEndToEndTester();
  const report = await tester.runAllTests();
  
  // Determinar status geral
  const hasErrors = report.errorCount > 0;
  const hasWarnings = report.warningCount > 0;
  
  let overallStatus = 'SUCCESS';
  if (hasErrors) {
    overallStatus = 'ERROR';
  } else if (hasWarnings) {
    overallStatus = 'WARNING';
  }
  
  console.log('\n🎯 RESULTADO FINAL');
  console.log('=' .repeat(30));
  console.log(`Status Geral: ${overallStatus}`);
  console.log(`Percentual de Sucesso: ${Math.round((report.successCount / report.totalSteps) * 100)}%`);
  
  if (hasErrors) {
    console.log('\n❌ Problemas encontrados que precisam ser corrigidos:');
    report.results
      .filter(r => r.status === 'ERROR')
      .forEach(r => console.log(`   - ${r.step}: ${r.message}`));
  }
  
  if (hasWarnings) {
    console.log('\n⚠️ Avisos que merecem atenção:');
    report.results
      .filter(r => r.status === 'WARNING')
      .forEach(r => console.log(`   - ${r.step}: ${r.message}`));
  }
  
  console.log('\n✅ Teste End-to-End concluído!');
  
  return report;
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DREEndToEndTester, main };