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

// Cores para output no console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class DRETestSuite {
  constructor() {
    this.results = {
      cronStatus: { status: 'pending', details: null, duration: 0 },
      hitssDownload: { status: 'pending', details: null, duration: 0 },
      fileUpload: { status: 'pending', details: null, duration: 0 },
      dreProcessing: { status: 'pending', details: null, duration: 0 },
      emailNotification: { status: 'pending', details: null, duration: 0 },
      dataInsertion: { status: 'pending', details: null, duration: 0 },
      logsVerification: { status: 'pending', details: null, duration: 0 }
    };
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logStep(step, message) {
    this.log(`\n${colors.bold}[${step}]${colors.reset} ${message}`, 'cyan');
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  logError(message) {
    this.log(`❌ ${message}`, 'red');
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  async measureTime(fn) {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }

  // 1. Verificar status do cron job HITSS
  async testCronStatus() {
    this.logStep('1/7', 'Verificando status do cron job HITSS...');
    
    try {
      const { result, duration } = await this.measureTime(async () => {
        const { data, error } = await supabase
          .from('pg_cron_jobs')
          .select('*')
          .eq('jobname', 'hitss_automation_job');
        
        if (error) throw error;
        return data;
      });

      if (result && result.length > 0) {
        const job = result[0];
        this.results.cronStatus = {
          status: 'success',
          details: {
            jobname: job.jobname,
            schedule: job.schedule,
            active: job.active,
            last_run: job.last_run
          },
          duration
        };
        this.logSuccess(`Cron job encontrado: ${job.jobname} (${job.active ? 'Ativo' : 'Inativo'})`);
      } else {
        throw new Error('Cron job HITSS não encontrado');
      }
    } catch (error) {
      this.results.cronStatus = {
        status: 'error',
        details: { error: error.message },
        duration: 0
      };
      this.logError(`Erro ao verificar cron job: ${error.message}`);
    }
  }

  // 2. Testar download e processamento de dados HITSS
  async testHitssDownload() {
    this.logStep('2/7', 'Testando download e processamento HITSS...');
    
    try {
      const { result, duration } = await this.measureTime(async () => {
        const response = await fetch(`${supabaseUrl}/functions/v1/hitss-automation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: true })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      });

      this.results.hitssDownload = {
        status: 'success',
        details: result,
        duration
      };
      this.logSuccess(`Download HITSS executado com sucesso`);
    } catch (error) {
      this.results.hitssDownload = {
        status: 'error',
        details: { error: error.message },
        duration: 0
      };
      this.logError(`Erro no download HITSS: ${error.message}`);
    }
  }

  // 3. Simular upload de arquivo DRE
  async testFileUpload() {
    this.logStep('3/7', 'Simulando upload de arquivo DRE...');
    
    try {
      const { result, duration } = await this.measureTime(async () => {
        // Criar arquivo de teste
        const testData = 'Código,Descrição,Valor\n001,Receita Teste,1000.00\n002,Despesa Teste,-500.00';
        const fileName = `test-dre-${Date.now()}.csv`;
        
        const { data, error } = await supabase.storage
          .from('dre_reports')
          .upload(fileName, testData, {
            contentType: 'text/csv'
          });
        
        if (error) throw error;
        return { fileName, path: data.path };
      });

      this.results.fileUpload = {
        status: 'success',
        details: result,
        duration
      };
      this.logSuccess(`Arquivo DRE enviado: ${result.fileName}`);
    } catch (error) {
      this.results.fileUpload = {
        status: 'error',
        details: { error: error.message },
        duration: 0
      };
      this.logError(`Erro no upload: ${error.message}`);
    }
  }

  // 4. Verificar processamento da Edge Function
  async testDreProcessing() {
    this.logStep('4/7', 'Testando processamento DRE...');
    
    try {
      const { result, duration } = await this.measureTime(async () => {
        const response = await fetch(`${supabaseUrl}/functions/v1/process-dre-upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            test: true,
            fileName: this.results.fileUpload.details?.fileName || 'test-file.csv'
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      });

      this.results.dreProcessing = {
        status: 'success',
        details: result,
        duration
      };
      this.logSuccess(`Processamento DRE executado com sucesso`);
    } catch (error) {
      this.results.dreProcessing = {
        status: 'error',
        details: { error: error.message },
        duration: 0
      };
      this.logError(`Erro no processamento DRE: ${error.message}`);
    }
  }

  // 5. Testar notificação por email
  async testEmailNotification() {
    this.logStep('5/7', 'Testando notificação por email...');
    
    try {
      const { result, duration } = await this.measureTime(async () => {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-dre-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'test',
            data: {
              fileName: 'test-dre.csv',
              recordsProcessed: 10,
              status: 'success'
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      });

      this.results.emailNotification = {
        status: 'success',
        details: result,
        duration
      };
      this.logSuccess(`Email de notificação enviado com sucesso`);
    } catch (error) {
      this.results.emailNotification = {
        status: 'error',
        details: { error: error.message },
        duration: 0
      };
      this.logError(`Erro no envio de email: ${error.message}`);
    }
  }

  // 6. Validar inserção de dados
  async testDataInsertion() {
    this.logStep('6/7', 'Validando inserção de dados na tabela dre_hitss...');
    
    try {
      const { result, duration } = await this.measureTime(async () => {
        // Verificar registros recentes
        const { data, error } = await supabase
          .from('dre_hitss')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        return data;
      });

      this.results.dataInsertion = {
        status: 'success',
        details: {
          recordCount: result.length,
          latestRecords: result
        },
        duration
      };
      this.logSuccess(`${result.length} registros encontrados na tabela dre_hitss`);
    } catch (error) {
      this.results.dataInsertion = {
        status: 'error',
        details: { error: error.message },
        duration: 0
      };
      this.logError(`Erro ao verificar dados: ${error.message}`);
    }
  }

  // 7. Verificar logs de execução
  async testLogsVerification() {
    this.logStep('7/7', 'Verificando logs de execução...');
    
    try {
      const { result, duration } = await this.measureTime(async () => {
        const { data: automationLogs, error: error1 } = await supabase
          .from('automation_executions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error1) throw error1;

        const { data: hitssLogs, error: error2 } = await supabase
          .from('hitss_automation_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error2) throw error2;

        return {
          automationLogs,
          hitssLogs
        };
      });

      this.results.logsVerification = {
        status: 'success',
        details: {
          automationLogsCount: result.automationLogs.length,
          hitssLogsCount: result.hitssLogs.length,
          logs: result
        },
        duration
      };
      this.logSuccess(`Logs verificados: ${result.automationLogs.length} execuções, ${result.hitssLogs.length} logs HITSS`);
    } catch (error) {
      this.results.logsVerification = {
        status: 'error',
        details: { error: error.message },
        duration: 0
      };
      this.logError(`Erro ao verificar logs: ${error.message}`);
    }
  }

  // Gerar relatório final
  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const successCount = Object.values(this.results).filter(r => r.status === 'success').length;
    const errorCount = Object.values(this.results).filter(r => r.status === 'error').length;
    const totalTests = Object.keys(this.results).length;
    
    this.log('\n' + '='.repeat(80), 'bold');
    this.log('RELATÓRIO FINAL - TESTE COMPLETO DO FLUXO DRE', 'bold');
    this.log('='.repeat(80), 'bold');
    
    this.log(`\n📊 RESUMO GERAL:`);
    this.log(`   • Total de testes: ${totalTests}`);
    this.log(`   • Sucessos: ${successCount}`, successCount === totalTests ? 'green' : 'yellow');
    this.log(`   • Erros: ${errorCount}`, errorCount === 0 ? 'green' : 'red');
    this.log(`   • Taxa de sucesso: ${((successCount / totalTests) * 100).toFixed(1)}%`);
    this.log(`   • Tempo total: ${(totalDuration / 1000).toFixed(2)}s`);
    
    this.log(`\n📋 DETALHES POR TESTE:`);
    
    const testNames = {
      cronStatus: '1. Status do Cron Job',
      hitssDownload: '2. Download HITSS',
      fileUpload: '3. Upload de Arquivo',
      dreProcessing: '4. Processamento DRE',
      emailNotification: '5. Notificação Email',
      dataInsertion: '6. Inserção de Dados',
      logsVerification: '7. Verificação de Logs'
    };
    
    Object.entries(this.results).forEach(([key, result]) => {
      const icon = result.status === 'success' ? '✅' : '❌';
      const duration = result.duration > 0 ? ` (${(result.duration / 1000).toFixed(2)}s)` : '';
      this.log(`   ${icon} ${testNames[key]}${duration}`);
      
      if (result.status === 'error') {
        this.log(`      Erro: ${result.details.error}`, 'red');
      }
    });
    
    this.log(`\n🎯 STATUS GERAL DO SISTEMA:`);
    if (successCount === totalTests) {
      this.log(`   ✅ SISTEMA 100% FUNCIONAL - Todos os componentes operando corretamente!`, 'green');
    } else if (successCount >= totalTests * 0.8) {
      this.log(`   ⚠️  SISTEMA PARCIALMENTE FUNCIONAL - ${errorCount} componente(s) com problema`, 'yellow');
    } else {
      this.log(`   ❌ SISTEMA COM PROBLEMAS CRÍTICOS - ${errorCount} componente(s) falhando`, 'red');
    }
    
    this.log('\n' + '='.repeat(80), 'bold');
    
    // Salvar relatório em arquivo
    this.saveReportToFile({
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        successCount,
        errorCount,
        successRate: ((successCount / totalTests) * 100).toFixed(1),
        totalDuration: (totalDuration / 1000).toFixed(2)
      },
      results: this.results
    });
  }

  saveReportToFile(report) {
    try {
      const reportPath = path.join(__dirname, `dre-test-report-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`\n📄 Relatório salvo em: ${reportPath}`, 'cyan');
    } catch (error) {
      this.logError(`Erro ao salvar relatório: ${error.message}`);
    }
  }

  // Executar todos os testes
  async runAllTests() {
    this.log('🚀 INICIANDO TESTE COMPLETO DO FLUXO DRE', 'bold');
    this.log('='.repeat(50));
    
    await this.testCronStatus();
    await this.testHitssDownload();
    await this.testFileUpload();
    await this.testDreProcessing();
    await this.testEmailNotification();
    await this.testDataInsertion();
    await this.testLogsVerification();
    
    this.generateReport();
  }
}

// Executar testes
const testSuite = new DRETestSuite();
testSuite.runAllTests().catch(error => {
  console.error('❌ Erro fatal durante execução dos testes:', error);
  process.exit(1);
});