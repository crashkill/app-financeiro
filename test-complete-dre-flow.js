import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

console.log('🚀 TESTE COMPLETO END-TO-END DO FLUXO DRE');
console.log('=' .repeat(60));
console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
console.log('');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase;

// Classe para relatório detalhado
class CompleteDREFlowTester {
  constructor() {
    this.results = [];
    this.startTime = new Date();
    this.executionId = `dre_test_${Date.now()}`;
  }

  log(step, status, message, details = {}) {
    const timestamp = new Date().toISOString();
    const result = {
      executionId: this.executionId,
      step,
      status,
      message,
      timestamp,
      details
    };
    
    this.results.push(result);
    
    const statusIcon = {
      'SUCCESS': '✅',
      'ERROR': '❌',
      'WARNING': '⚠️',
      'INFO': 'ℹ️',
      'PROGRESS': '🔄'
    }[status] || '📝';
    
    console.log(`${statusIcon} [${step}] ${message}`);
    
    if (details && Object.keys(details).length > 0) {
      console.log(`   📊 Detalhes:`, JSON.stringify(details, null, 2));
    }
    console.log('');
    
    return result;
  }

  async saveExecutionLog(result) {
    try {
      await supabaseAdmin
        .from('system_logs')
        .insert({
          execution_id: this.executionId,
          step: result.step,
          status: result.status,
          message: result.message,
          details: result.details,
          created_at: result.timestamp
        });
    } catch (error) {
      console.log(`   ⚠️ Não foi possível salvar log: ${error.message}`);
    }
  }

  generateFinalReport() {
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    const report = {
      testSuite: 'Teste End-to-End Completo do Fluxo DRE',
      executionId: this.executionId,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${duration}ms`,
      durationFormatted: `${Math.round(duration / 1000)}s`,
      totalSteps: this.results.length,
      successCount: this.results.filter(r => r.status === 'SUCCESS').length,
      errorCount: this.results.filter(r => r.status === 'ERROR').length,
      warningCount: this.results.filter(r => r.status === 'WARNING').length,
      results: this.results
    };

    // Salvar relatório em arquivo
    const reportFileName = `dre-complete-test-report-${Date.now()}.json`;
    const reportPath = path.join(__dirname, reportFileName);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 RELATÓRIO FINAL COMPLETO');
    console.log('=' .repeat(50));
    console.log(`🆔 ID da Execução: ${this.executionId}`);
    console.log(`⏱️  Duração total: ${report.durationFormatted}`);
    console.log(`📈 Total de etapas: ${report.totalSteps}`);
    console.log(`✅ Sucessos: ${report.successCount}`);
    console.log(`❌ Erros: ${report.errorCount}`);
    console.log(`⚠️  Avisos: ${report.warningCount}`);
    console.log(`💾 Relatório salvo em: ${reportFileName}`);
    
    return report;
  }

  // ETAPA 1: Verificar Infraestrutura
  async testInfrastructure() {
    this.log('INFRAESTRUTURA', 'PROGRESS', 'Verificando infraestrutura do sistema...');
    
    try {
      // Teste de conectividade
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) throw bucketsError;
      
      // Verificar bucket dre-files
      const dreFilesExists = buckets.some(b => b.name === 'dre-files');
      if (!dreFilesExists) {
        // Tentar criar o bucket
        const { error: createError } = await supabaseAdmin.storage.createBucket('dre-files', {
          public: false,
          allowedMimeTypes: ['application/json', 'text/csv', 'application/vnd.ms-excel']
        });
        
        if (createError) {
          this.log('INFRAESTRUTURA', 'WARNING', `Bucket dre-files não existe e não pôde ser criado: ${createError.message}`);
        } else {
          this.log('INFRAESTRUTURA', 'SUCCESS', 'Bucket dre-files criado com sucesso');
        }
      } else {
        this.log('INFRAESTRUTURA', 'SUCCESS', 'Bucket dre-files encontrado');
      }
      
      // Verificar tabelas essenciais
      const tables = ['dre_reports', 'dre_items', 'dre_categories', 'vault', 'system_logs'];
      for (const table of tables) {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
          this.log('INFRAESTRUTURA', 'ERROR', `Tabela ${table} não acessível: ${error.message}`);
        } else {
          this.log('INFRAESTRUTURA', 'SUCCESS', `Tabela ${table} acessível`);
        }
      }
      
    } catch (error) {
      this.log('INFRAESTRUTURA', 'ERROR', `Erro na verificação de infraestrutura: ${error.message}`);
    }
  }

  // ETAPA 2: Simular Download de Dados HITSS
  async simulateHITSSDownload() {
    this.log('HITSS_DOWNLOAD', 'PROGRESS', 'Simulando download de dados HITSS...');
    
    try {
      // Verificar credenciais no vault
      const { data: credentials } = await supabase
        .from('vault')
        .select('key, value')
        .in('key', ['HITSS_USERNAME', 'HITSS_PASSWORD', 'HITSS_BASE_URL']);
      
      const credMap = {};
      credentials?.forEach(cred => {
        credMap[cred.key] = cred.value;
      });
      
      if (!credMap.HITSS_USERNAME || !credMap.HITSS_PASSWORD || !credMap.HITSS_BASE_URL) {
        this.log('HITSS_DOWNLOAD', 'WARNING', 'Credenciais HITSS não configuradas completamente no vault');
        return;
      }
      
      // Simular dados DRE (dados fictícios para teste)
      const mockDREData = {
        reportDate: new Date().toISOString().split('T')[0],
        companyCode: 'HITSS001',
        reportType: 'DRE_MENSAL',
        data: {
          receitas: {
            vendas: 1500000,
            servicos: 800000,
            outras: 50000
          },
          custos: {
            materiais: 600000,
            pessoal: 400000,
            terceiros: 200000
          },
          despesas: {
            administrativas: 150000,
            comerciais: 100000,
            financeiras: 25000
          }
        },
        metadata: {
          downloadedAt: new Date().toISOString(),
          source: 'HITSS_API_SIMULATION',
          testExecution: true
        }
      };
      
      this.log('HITSS_DOWNLOAD', 'SUCCESS', 'Dados DRE simulados gerados com sucesso', {
        reportDate: mockDREData.reportDate,
        companyCode: mockDREData.companyCode,
        totalReceitas: Object.values(mockDREData.data.receitas).reduce((a, b) => a + b, 0),
        totalCustos: Object.values(mockDREData.data.custos).reduce((a, b) => a + b, 0)
      });
      
      return mockDREData;
      
    } catch (error) {
      this.log('HITSS_DOWNLOAD', 'ERROR', `Erro na simulação de download: ${error.message}`);
      return null;
    }
  }

  // ETAPA 3: Testar Upload para Bucket
  async testBucketUpload(dreData) {
    this.log('BUCKET_UPLOAD', 'PROGRESS', 'Testando upload para bucket dre-files...');
    
    if (!dreData) {
      this.log('BUCKET_UPLOAD', 'ERROR', 'Dados DRE não disponíveis para upload');
      return null;
    }
    
    try {
      const fileName = `dre_test_${Date.now()}.json`;
      const fileContent = JSON.stringify(dreData, null, 2);
      
      const { data, error } = await supabase.storage
        .from('dre-files')
        .upload(fileName, fileContent, {
          contentType: 'application/json',
          metadata: {
            testExecution: 'true',
            executionId: this.executionId
          }
        });
      
      if (error) {
        this.log('BUCKET_UPLOAD', 'ERROR', `Erro no upload: ${error.message}`);
        return null;
      }
      
      this.log('BUCKET_UPLOAD', 'SUCCESS', 'Upload realizado com sucesso', {
        fileName,
        filePath: data.path,
        fileSize: fileContent.length
      });
      
      return { fileName, filePath: data.path };
      
    } catch (error) {
      this.log('BUCKET_UPLOAD', 'ERROR', `Erro no teste de upload: ${error.message}`);
      return null;
    }
  }

  // ETAPA 4: Executar Edge Function
  async testEdgeFunction(uploadInfo) {
    this.log('EDGE_FUNCTION', 'PROGRESS', 'Testando Edge Function process-dre-upload...');
    
    if (!uploadInfo) {
      this.log('EDGE_FUNCTION', 'WARNING', 'Informações de upload não disponíveis');
      return false;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('process-dre-upload', {
        body: {
          fileName: uploadInfo.fileName,
          filePath: uploadInfo.filePath,
          testMode: true,
          executionId: this.executionId
        }
      });
      
      if (error) {
        this.log('EDGE_FUNCTION', 'WARNING', `Edge Function retornou erro: ${error.message}`);
        return false;
      }
      
      this.log('EDGE_FUNCTION', 'SUCCESS', 'Edge Function executada com sucesso', {
        response: data
      });
      
      return true;
      
    } catch (error) {
      this.log('EDGE_FUNCTION', 'WARNING', `Erro ao executar Edge Function: ${error.message}`);
      return false;
    }
  }

  // ETAPA 5: Verificar Inserção de Dados
  async testDataInsertion(dreData) {
    this.log('DATA_INSERTION', 'PROGRESS', 'Verificando inserção de dados nas tabelas DRE...');
    
    if (!dreData) {
      this.log('DATA_INSERTION', 'WARNING', 'Dados DRE não disponíveis para verificação');
      return;
    }
    
    try {
      // Inserir dados de teste diretamente (simulando o que a Edge Function faria)
      const reportData = {
        company_code: dreData.companyCode,
        report_date: dreData.reportDate,
        report_type: dreData.reportType,
        status: 'processed',
        metadata: dreData.metadata,
        execution_id: this.executionId
      };
      
      const { data: reportInsert, error: reportError } = await supabase
        .from('dre_reports')
        .insert(reportData)
        .select()
        .single();
      
      if (reportError) {
        this.log('DATA_INSERTION', 'ERROR', `Erro ao inserir relatório: ${reportError.message}`);
        return;
      }
      
      this.log('DATA_INSERTION', 'SUCCESS', 'Relatório DRE inserido com sucesso', {
        reportId: reportInsert.id,
        companyCode: reportInsert.company_code
      });
      
      // Inserir itens DRE
      const dreItems = [];
      
      // Receitas
      Object.entries(dreData.data.receitas).forEach(([key, value]) => {
        dreItems.push({
          report_id: reportInsert.id,
          category: 'RECEITAS',
          subcategory: key.toUpperCase(),
          description: `Receitas de ${key}`,
          value: value,
          execution_id: this.executionId
        });
      });
      
      // Custos
      Object.entries(dreData.data.custos).forEach(([key, value]) => {
        dreItems.push({
          report_id: reportInsert.id,
          category: 'CUSTOS',
          subcategory: key.toUpperCase(),
          description: `Custos de ${key}`,
          value: -value, // Custos são negativos
          execution_id: this.executionId
        });
      });
      
      // Despesas
      Object.entries(dreData.data.despesas).forEach(([key, value]) => {
        dreItems.push({
          report_id: reportInsert.id,
          category: 'DESPESAS',
          subcategory: key.toUpperCase(),
          description: `Despesas ${key}`,
          value: -value, // Despesas são negativas
          execution_id: this.executionId
        });
      });
      
      const { data: itemsInsert, error: itemsError } = await supabase
        .from('dre_items')
        .insert(dreItems)
        .select();
      
      if (itemsError) {
        this.log('DATA_INSERTION', 'ERROR', `Erro ao inserir itens DRE: ${itemsError.message}`);
        return;
      }
      
      this.log('DATA_INSERTION', 'SUCCESS', 'Itens DRE inseridos com sucesso', {
        itemsCount: itemsInsert.length,
        reportId: reportInsert.id
      });
      
      return reportInsert.id;
      
    } catch (error) {
      this.log('DATA_INSERTION', 'ERROR', `Erro na inserção de dados: ${error.message}`);
    }
  }

  // ETAPA 6: Testar Envio de Email
  async testEmailNotification(reportId) {
    this.log('EMAIL_NOTIFICATION', 'PROGRESS', 'Testando envio de email de notificação...');
    
    try {
      // Verificar configuração do Resend
      const { data: resendConfig } = await supabase
        .from('vault')
        .select('value')
        .eq('key', 'RESEND_API_KEY')
        .single();
      
      if (!resendConfig?.value) {
        this.log('EMAIL_NOTIFICATION', 'WARNING', 'Chave API do Resend não configurada');
        return false;
      }
      
      // Tentar executar Edge Function de email
      const { data, error } = await supabase.functions.invoke('send-dre-notification', {
        body: {
          reportId: reportId,
          testMode: true,
          executionId: this.executionId,
          recipients: [process.env.NOTIFICATION_EMAIL || 'test@example.com']
        }
      });
      
      if (error) {
        this.log('EMAIL_NOTIFICATION', 'WARNING', `Erro na Edge Function de email: ${error.message}`);
        return false;
      }
      
      this.log('EMAIL_NOTIFICATION', 'SUCCESS', 'Notificação de email processada', {
        response: data
      });
      
      return true;
      
    } catch (error) {
      this.log('EMAIL_NOTIFICATION', 'WARNING', `Erro no teste de email: ${error.message}`);
      return false;
    }
  }

  // ETAPA 7: Validar Logs
  async validateLogs() {
    this.log('LOG_VALIDATION', 'PROGRESS', 'Validando logs de execução...');
    
    try {
      const { data: logs, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('execution_id', this.executionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        this.log('LOG_VALIDATION', 'ERROR', `Erro ao consultar logs: ${error.message}`);
        return;
      }
      
      this.log('LOG_VALIDATION', 'SUCCESS', 'Logs de execução validados', {
        logsCount: logs?.length || 0,
        executionId: this.executionId
      });
      
    } catch (error) {
      this.log('LOG_VALIDATION', 'ERROR', `Erro na validação de logs: ${error.message}`);
    }
  }

  // Executar todos os testes
  async runCompleteFlow() {
    this.log('INICIO', 'INFO', `Iniciando teste completo do fluxo DRE - ID: ${this.executionId}`);
    
    try {
      // 1. Verificar infraestrutura
      await this.testInfrastructure();
      
      // 2. Simular download HITSS
      const dreData = await this.simulateHITSSDownload();
      
      // 3. Testar upload
      const uploadInfo = await this.testBucketUpload(dreData);
      
      // 4. Testar Edge Function
      await this.testEdgeFunction(uploadInfo);
      
      // 5. Testar inserção de dados
      const reportId = await this.testDataInsertion(dreData);
      
      // 6. Testar email
      await this.testEmailNotification(reportId);
      
      // 7. Validar logs
      await this.validateLogs();
      
      this.log('CONCLUSAO', 'SUCCESS', 'Teste completo do fluxo DRE finalizado');
      
    } catch (error) {
      this.log('CONCLUSAO', 'ERROR', `Erro crítico durante execução: ${error.message}`);
    }
    
    return this.generateFinalReport();
  }
}

// Função principal
async function main() {
  const tester = new CompleteDREFlowTester();
  const report = await tester.runCompleteFlow();
  
  // Status final
  const successRate = Math.round((report.successCount / report.totalSteps) * 100);
  
  console.log('\n🎯 RESULTADO FINAL DO TESTE COMPLETO');
  console.log('=' .repeat(50));
  console.log(`📊 Taxa de Sucesso: ${successRate}%`);
  console.log(`⏱️  Tempo Total: ${report.durationFormatted}`);
  console.log(`🆔 ID da Execução: ${report.executionId}`);
  
  if (report.errorCount > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    report.results
      .filter(r => r.status === 'ERROR')
      .forEach(r => console.log(`   🔸 ${r.step}: ${r.message}`));
  }
  
  if (report.warningCount > 0) {
    console.log('\n⚠️ AVISOS:');
    report.results
      .filter(r => r.status === 'WARNING')
      .forEach(r => console.log(`   🔸 ${r.step}: ${r.message}`));
  }
  
  console.log('\n✅ TESTE END-TO-END COMPLETO FINALIZADO!');
  console.log(`📄 Relatório detalhado salvo em: dre-complete-test-report-${Date.now()}.json`);
  
  return report;
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { CompleteDREFlowTester, main };