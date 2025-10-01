import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

console.log('🚀 Iniciando Teste End-to-End do Fluxo DRE');
console.log('=' .repeat(50));

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('📋 Configurações:');
console.log(`URL Supabase: ${supabaseUrl}`);
console.log(`Chave Anon: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
  console.error('Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Classe para relatório de testes
class SimpleTestReporter {
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
    console.log(`${statusIcon} [${step}] ${message}`);
    
    if (details && Object.keys(details).length > 0) {
      console.log('   📊 Detalhes:', JSON.stringify(details, null, 2));
    }
    console.log('');
  }

  generateReport() {
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    const report = {
      testSuite: 'Teste End-to-End Simplificado do Fluxo DRE',
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
    const reportFileName = `dre-simple-test-report-${Date.now()}.json`;
    const reportPath = path.join(__dirname, reportFileName);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 RELATÓRIO FINAL DO TESTE');
    console.log('=' .repeat(40));
    console.log(`⏱️  Duração total: ${duration}ms`);
    console.log(`📈 Total de etapas: ${report.totalSteps}`);
    console.log(`✅ Sucessos: ${report.successCount}`);
    console.log(`❌ Erros: ${report.errorCount}`);
    console.log(`⚠️  Avisos: ${report.warningCount}`);
    console.log(`💾 Relatório salvo em: ${reportFileName}`);
    
    return report;
  }
}

// Classe principal de teste
class SimpleDREFlowTester {
  constructor() {
    this.reporter = new SimpleTestReporter();
  }

  async runAllTests() {
    try {
      await this.testSupabaseConnection();
      await this.testCronJobStatus();
      await this.testBucketAccess();
      await this.testEdgeFunctions();
      await this.testDatabaseTables();
      await this.testVaultCredentials();
      await this.testEmailConfiguration();
      
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

  // Teste 1: Conectividade com Supabase
  async testSupabaseConnection() {
    try {
      this.reporter.addResult('CONECTIVIDADE', 'INFO', 'Testando conexão com Supabase...');
      
      // Teste básico de conectividade
      const { data, error } = await supabase
        .from('vault')
        .select('count')
        .limit(1);
      
      if (error) {
        this.reporter.addResult(
          'CONECTIVIDADE',
          'ERROR',
          `Erro na conexão: ${error.message}`,
          { error }
        );
        return;
      }
      
      this.reporter.addResult(
        'CONECTIVIDADE',
        'SUCCESS',
        'Conexão com Supabase estabelecida com sucesso'
      );
      
    } catch (error) {
      this.reporter.addResult(
        'CONECTIVIDADE',
        'ERROR',
        `Erro na conectividade: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Teste 2: Status do Cron Job
  async testCronJobStatus() {
    try {
      this.reporter.addResult('CRON_JOB', 'INFO', 'Verificando status do cron job...');
      
      // Verificar se existe a tabela pg_cron_jobs
      const { data: cronJobs, error } = await supabase
        .rpc('get_cron_jobs_status');
      
      if (error) {
        this.reporter.addResult(
          'CRON_JOB',
          'WARNING',
          `Não foi possível verificar cron jobs: ${error.message}`,
          { error }
        );
        return;
      }
      
      this.reporter.addResult(
        'CRON_JOB',
        'SUCCESS',
        `Cron jobs verificados`,
        { cronJobsCount: cronJobs?.length || 0 }
      );
      
    } catch (error) {
      this.reporter.addResult(
        'CRON_JOB',
        'WARNING',
        `Erro na verificação do cron job: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Teste 3: Acesso ao Bucket
  async testBucketAccess() {
    try {
      this.reporter.addResult('BUCKET', 'INFO', 'Testando acesso ao bucket dre-files...');
      
      // Listar buckets disponíveis
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        this.reporter.addResult(
          'BUCKET',
          'ERROR',
          `Erro ao listar buckets: ${bucketsError.message}`,
          { error: bucketsError }
        );
        return;
      }
      
      const bucketNames = buckets.map(b => b.name);
      const dreFilesExists = bucketNames.includes('dre-files');
      
      if (dreFilesExists) {
        this.reporter.addResult(
          'BUCKET',
          'SUCCESS',
          'Bucket dre-files encontrado',
          { availableBuckets: bucketNames }
        );
      } else {
        this.reporter.addResult(
          'BUCKET',
          'WARNING',
          'Bucket dre-files não encontrado',
          { availableBuckets: bucketNames }
        );
      }
      
    } catch (error) {
      this.reporter.addResult(
        'BUCKET',
        'ERROR',
        `Erro no teste de bucket: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Teste 4: Edge Functions
  async testEdgeFunctions() {
    try {
      this.reporter.addResult('EDGE_FUNCTIONS', 'INFO', 'Testando Edge Functions...');
      
      const functions = [
        'hitss-automation',
        'process-dre-upload',
        'send-dre-notification'
      ];
      
      for (const functionName of functions) {
        try {
          const { data, error } = await supabase.functions
            .invoke(functionName, {
              body: { test: true, ping: true }
            });
          
          if (error) {
            this.reporter.addResult(
              'EDGE_FUNCTIONS',
              'WARNING',
              `Edge Function ${functionName}: ${error.message}`,
              { functionName, error }
            );
          } else {
            this.reporter.addResult(
              'EDGE_FUNCTIONS',
              'SUCCESS',
              `Edge Function ${functionName} respondeu`,
              { functionName, response: data }
            );
          }
        } catch (err) {
          this.reporter.addResult(
            'EDGE_FUNCTIONS',
            'WARNING',
            `Edge Function ${functionName} não acessível: ${err.message}`,
            { functionName, error: err.message }
          );
        }
      }
      
    } catch (error) {
      this.reporter.addResult(
        'EDGE_FUNCTIONS',
        'ERROR',
        `Erro no teste de Edge Functions: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Teste 5: Tabelas do Banco de Dados
  async testDatabaseTables() {
    try {
      this.reporter.addResult('DATABASE', 'INFO', 'Verificando tabelas do banco de dados...');
      
      const tables = [
        'dre_reports',
        'dre_items', 
        'dre_categories',
        'automation_executions',
        'system_logs',
        'vault'
      ];
      
      for (const table of tables) {
        try {
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            this.reporter.addResult(
              'DATABASE',
              'WARNING',
              `Tabela ${table}: ${error.message}`,
              { table, error }
            );
          } else {
            this.reporter.addResult(
              'DATABASE',
              'SUCCESS',
              `Tabela ${table} acessível`,
              { table, recordCount: count }
            );
          }
        } catch (err) {
          this.reporter.addResult(
            'DATABASE',
            'WARNING',
            `Tabela ${table} não acessível: ${err.message}`,
            { table, error: err.message }
          );
        }
      }
      
    } catch (error) {
      this.reporter.addResult(
        'DATABASE',
        'ERROR',
        `Erro no teste de tabelas: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Teste 6: Credenciais no Vault
  async testVaultCredentials() {
    try {
      this.reporter.addResult('VAULT', 'INFO', 'Verificando credenciais no vault...');
      
      const requiredKeys = [
        'HITSS_USERNAME',
        'HITSS_PASSWORD', 
        'HITSS_BASE_URL',
        'RESEND_API_KEY'
      ];
      
      const { data: vaultData, error } = await supabase
        .from('vault')
        .select('key, value')
        .in('key', requiredKeys);
      
      if (error) {
        this.reporter.addResult(
          'VAULT',
          'ERROR',
          `Erro ao acessar vault: ${error.message}`,
          { error }
        );
        return;
      }
      
      const foundKeys = vaultData?.map(item => item.key) || [];
      const missingKeys = requiredKeys.filter(key => !foundKeys.includes(key));
      const configuredKeys = vaultData?.filter(item => item.value && item.value.trim() !== '') || [];
      
      this.reporter.addResult(
        'VAULT',
        missingKeys.length === 0 ? 'SUCCESS' : 'WARNING',
        `Credenciais verificadas`,
        {
          totalRequired: requiredKeys.length,
          found: foundKeys.length,
          configured: configuredKeys.length,
          missingKeys
        }
      );
      
    } catch (error) {
      this.reporter.addResult(
        'VAULT',
        'ERROR',
        `Erro na verificação do vault: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  // Teste 7: Configuração de Email
  async testEmailConfiguration() {
    try {
      this.reporter.addResult('EMAIL', 'INFO', 'Verificando configuração de email...');
      
      // Verificar se a chave do Resend está configurada
      const { data: resendConfig } = await supabase
        .from('vault')
        .select('value')
        .eq('key', 'RESEND_API_KEY')
        .single();
      
      if (!resendConfig || !resendConfig.value) {
        this.reporter.addResult(
          'EMAIL',
          'WARNING',
          'Chave API do Resend não configurada no vault',
          { missingKey: 'RESEND_API_KEY' }
        );
        return;
      }
      
      this.reporter.addResult(
        'EMAIL',
        'SUCCESS',
        'Configuração de email encontrada',
        { configured: true }
      );
      
    } catch (error) {
      this.reporter.addResult(
        'EMAIL',
        'ERROR',
        `Erro na verificação de email: ${error.message}`,
        { error: error.stack }
      );
    }
  }
}

// Função principal
async function main() {
  const tester = new SimpleDREFlowTester();
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
  
  console.log('🎯 RESULTADO FINAL');
  console.log('=' .repeat(30));
  console.log(`📊 Status Geral: ${overallStatus}`);
  console.log(`📈 Percentual de Sucesso: ${Math.round((report.successCount / report.totalSteps) * 100)}%`);
  
  if (hasErrors) {
    console.log('\n❌ Problemas críticos encontrados:');
    report.results
      .filter(r => r.status === 'ERROR')
      .forEach(r => console.log(`   🔸 ${r.step}: ${r.message}`));
  }
  
  if (hasWarnings) {
    console.log('\n⚠️ Avisos que merecem atenção:');
    report.results
      .filter(r => r.status === 'WARNING')
      .forEach(r => console.log(`   🔸 ${r.step}: ${r.message}`));
  }
  
  console.log('\n✅ Teste End-to-End Simplificado concluído!');
  console.log('🔗 Para executar o teste completo, use: node test-end-to-end-dre.js');
  
  return report;
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SimpleDREFlowTester, main };