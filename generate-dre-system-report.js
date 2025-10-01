import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

class DRESystemReport {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      systemStatus: 'unknown',
      components: {},
      metrics: {},
      issues: [],
      recommendations: []
    };
  }

  addComponent(name, status, details = {}) {
    this.report.components[name] = {
      status,
      details,
      timestamp: new Date().toISOString()
    };
  }

  addMetric(name, value, unit = '') {
    this.report.metrics[name] = {
      value,
      unit,
      timestamp: new Date().toISOString()
    };
  }

  addIssue(severity, component, description, suggestion = '') {
    this.report.issues.push({
      severity,
      component,
      description,
      suggestion,
      timestamp: new Date().toISOString()
    });
  }

  addRecommendation(priority, description, action = '') {
    this.report.recommendations.push({
      priority,
      description,
      action,
      timestamp: new Date().toISOString()
    });
  }

  calculateOverallStatus() {
    const componentStatuses = Object.values(this.report.components).map(c => c.status);
    const criticalIssues = this.report.issues.filter(i => i.severity === 'critical').length;
    const highIssues = this.report.issues.filter(i => i.severity === 'high').length;

    if (criticalIssues > 0) {
      this.report.systemStatus = 'critical';
    } else if (highIssues > 2 || componentStatuses.filter(s => s === 'error').length > 1) {
      this.report.systemStatus = 'warning';
    } else if (componentStatuses.filter(s => s === 'success').length >= componentStatuses.length * 0.8) {
      this.report.systemStatus = 'healthy';
    } else {
      this.report.systemStatus = 'degraded';
    }
  }

  generateReport() {
    this.calculateOverallStatus();
    return this.report;
  }

  saveReport(filename = null) {
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename = `dre-system-report-${timestamp}.json`;
    }

    try {
      fs.writeFileSync(filename, JSON.stringify(this.report, null, 2));
      return filename;
    } catch (error) {
      logError(`Erro ao salvar relatório: ${error.message}`);
      return null;
    }
  }
}

async function generateSystemReport() {
  log('📋 GERANDO RELATÓRIO COMPLETO DO SISTEMA DRE', 'bold');
  log('='.repeat(60));
  
  const reporter = new DRESystemReport();
  
  try {
    // 1. Verificar logs de automação
    logStep('1/7', 'Analisando logs de automação...');
    
    try {
      const { data: automationLogs, error: autoError } = await supabase
        .from('automation_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (autoError) {
        reporter.addComponent('automation_logs', 'error', { error: autoError.message });
        reporter.addIssue('high', 'automation_logs', `Erro ao acessar logs: ${autoError.message}`);
      } else {
        const totalLogs = automationLogs?.length || 0;
        const successLogs = automationLogs?.filter(log => log.status === 'success').length || 0;
        const errorLogs = automationLogs?.filter(log => log.status === 'error').length || 0;
        const runningLogs = automationLogs?.filter(log => log.status === 'running').length || 0;
        
        reporter.addComponent('automation_logs', 'success', {
          totalLogs,
          successLogs,
          errorLogs,
          runningLogs,
          successRate: totalLogs > 0 ? ((successLogs / totalLogs) * 100).toFixed(1) : 0
        });
        
        reporter.addMetric('total_executions', totalLogs, 'execuções');
        reporter.addMetric('success_rate', totalLogs > 0 ? ((successLogs / totalLogs) * 100).toFixed(1) : 0, '%');
        
        logSuccess(`${totalLogs} logs de automação analisados`);
        log(`   • Sucessos: ${successLogs} (${totalLogs > 0 ? ((successLogs / totalLogs) * 100).toFixed(1) : 0}%)`);
        log(`   • Erros: ${errorLogs}`);
        log(`   • Em execução: ${runningLogs}`);
        
        if (errorLogs > successLogs) {
          reporter.addIssue('high', 'automation', 'Taxa de erro alta nas execuções', 'Investigar causas dos erros');
        }
        
        // Analisar logs recentes
        const recentLogs = automationLogs?.filter(log => {
          const logDate = new Date(log.created_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return logDate > oneDayAgo;
        }) || [];
        
        reporter.addMetric('executions_24h', recentLogs.length, 'execuções');
        
        if (recentLogs.length === 0) {
          reporter.addIssue('medium', 'automation', 'Nenhuma execução nas últimas 24h', 'Verificar cron job');
        }
      }
    } catch (error) {
      reporter.addComponent('automation_logs', 'error', { error: error.message });
      logError(`Erro ao analisar logs de automação: ${error.message}`);
    }
    
    // 2. Verificar status do cron job
    logStep('2/7', 'Verificando status do cron job...');
    
    try {
      const { data: cronJobs, error: cronError } = await supabase
        .rpc('cron.job_list');
      
      if (cronError) {
        reporter.addComponent('cron_job', 'warning', { error: cronError.message });
        logWarning(`Erro ao verificar cron jobs: ${cronError.message}`);
      } else {
        const hitssJob = cronJobs?.find(job => job.jobname?.includes('hitss') || job.command?.includes('hitss'));
        
        if (hitssJob) {
          reporter.addComponent('cron_job', 'success', {
            jobname: hitssJob.jobname,
            schedule: hitssJob.schedule,
            active: hitssJob.active
          });
          
          logSuccess(`Cron job HITSS encontrado: ${hitssJob.jobname}`);
          log(`   • Schedule: ${hitssJob.schedule}`);
          log(`   • Ativo: ${hitssJob.active ? 'Sim' : 'Não'}`);
          
          if (!hitssJob.active) {
            reporter.addIssue('critical', 'cron_job', 'Cron job HITSS está inativo', 'Ativar o cron job');
          }
        } else {
          reporter.addComponent('cron_job', 'error', { message: 'Cron job HITSS não encontrado' });
          reporter.addIssue('critical', 'cron_job', 'Cron job HITSS não encontrado', 'Criar e configurar cron job');
        }
      }
    } catch (error) {
      reporter.addComponent('cron_job', 'error', { error: error.message });
      logWarning(`Erro ao verificar cron job: ${error.message}`);
    }
    
    // 3. Verificar dados na tabela DRE
    logStep('3/7', 'Analisando dados da tabela DRE...');
    
    try {
      const { count: totalRecords, error: countError } = await supabase
        .from('dre_hitss')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        reporter.addComponent('dre_data', 'error', { error: countError.message });
        reporter.addIssue('critical', 'dre_data', `Erro ao acessar tabela DRE: ${countError.message}`);
      } else {
        reporter.addComponent('dre_data', 'success', { totalRecords });
        reporter.addMetric('total_dre_records', totalRecords, 'registros');
        
        logSuccess(`${totalRecords} registros na tabela DRE`);
        
        if (totalRecords === 0) {
          reporter.addIssue('high', 'dre_data', 'Tabela DRE está vazia', 'Executar processamento inicial');
        } else if (totalRecords < 100) {
          reporter.addIssue('medium', 'dre_data', 'Poucos registros na tabela DRE', 'Verificar processamento');
        }
        
        // Verificar registros recentes
        const { data: recentRecords, error: recentError } = await supabase
          .from('dre_hitss')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });
        
        if (!recentError && recentRecords) {
          reporter.addMetric('records_last_7_days', recentRecords.length, 'registros');
          
          if (recentRecords.length === 0) {
            reporter.addIssue('medium', 'dre_data', 'Nenhum registro novo nos últimos 7 dias');
          }
        }
      }
    } catch (error) {
      reporter.addComponent('dre_data', 'error', { error: error.message });
      logError(`Erro ao analisar dados DRE: ${error.message}`);
    }
    
    // 4. Verificar bucket de storage
    logStep('4/7', 'Verificando bucket de storage...');
    
    try {
      const { data: bucketFiles, error: bucketError } = await supabase.storage
        .from('dre_reports')
        .list('', { limit: 100 });
      
      if (bucketError) {
        reporter.addComponent('storage_bucket', 'error', { error: bucketError.message });
        reporter.addIssue('high', 'storage_bucket', `Erro ao acessar bucket: ${bucketError.message}`);
      } else {
        const totalFiles = bucketFiles?.length || 0;
        const recentFiles = bucketFiles?.filter(file => {
          const fileDate = new Date(file.created_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return fileDate > oneDayAgo;
        }).length || 0;
        
        reporter.addComponent('storage_bucket', 'success', {
          totalFiles,
          recentFiles
        });
        
        reporter.addMetric('total_files', totalFiles, 'arquivos');
        reporter.addMetric('files_24h', recentFiles, 'arquivos');
        
        logSuccess(`${totalFiles} arquivos no bucket DRE`);
        log(`   • Arquivos recentes (24h): ${recentFiles}`);
        
        if (totalFiles > 1000) {
          reporter.addRecommendation('medium', 'Considerar limpeza de arquivos antigos no bucket');
        }
      }
    } catch (error) {
      reporter.addComponent('storage_bucket', 'error', { error: error.message });
      logError(`Erro ao verificar bucket: ${error.message}`);
    }
    
    // 5. Verificar Edge Functions
    logStep('5/7', 'Testando Edge Functions...');
    
    const edgeFunctions = [
      { name: 'process-dre-upload', url: `${supabaseUrl}/functions/v1/process-dre-upload` },
      { name: 'send-email-notification', url: `${supabaseUrl}/functions/v1/send-email-notification` },
      { name: 'download-hitss-data', url: `${supabaseUrl}/functions/v1/download-hitss-data` }
    ];
    
    for (const func of edgeFunctions) {
      try {
        const response = await fetch(func.url, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${supabaseKey}` }
        });
        
        const status = response.status === 405 || response.ok ? 'success' : 'warning';
        reporter.addComponent(`edge_function_${func.name}`, status, {
          status: response.status,
          statusText: response.statusText
        });
        
        if (status === 'success') {
          logSuccess(`Edge Function ${func.name} está ativa`);
        } else {
          logWarning(`Edge Function ${func.name} retornou status ${response.status}`);
        }
        
      } catch (error) {
        reporter.addComponent(`edge_function_${func.name}`, 'error', { error: error.message });
        reporter.addIssue('high', 'edge_functions', `Edge Function ${func.name} inacessível: ${error.message}`);
        logError(`Erro ao testar ${func.name}: ${error.message}`);
      }
    }
    
    // 6. Verificar logs de email
    logStep('6/7', 'Verificando logs de email...');
    
    try {
      const { data: emailLogs, error: emailError } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (emailError && !emailError.message.includes('does not exist')) {
        reporter.addComponent('email_logs', 'warning', { error: emailError.message });
        logWarning(`Erro ao verificar logs de email: ${emailError.message}`);
      } else if (emailLogs) {
        const totalEmails = emailLogs.length;
        const sentEmails = emailLogs.filter(log => log.status === 'sent').length;
        const failedEmails = emailLogs.filter(log => log.status === 'failed').length;
        
        reporter.addComponent('email_system', 'success', {
          totalEmails,
          sentEmails,
          failedEmails,
          successRate: totalEmails > 0 ? ((sentEmails / totalEmails) * 100).toFixed(1) : 0
        });
        
        reporter.addMetric('emails_sent', sentEmails, 'emails');
        reporter.addMetric('email_success_rate', totalEmails > 0 ? ((sentEmails / totalEmails) * 100).toFixed(1) : 0, '%');
        
        logSuccess(`${totalEmails} logs de email encontrados`);
        log(`   • Enviados: ${sentEmails}`);
        log(`   • Falharam: ${failedEmails}`);
        
        if (failedEmails > sentEmails) {
          reporter.addIssue('medium', 'email_system', 'Alta taxa de falha no envio de emails');
        }
      } else {
        reporter.addComponent('email_system', 'warning', { message: 'Tabela email_logs não encontrada' });
        logWarning('Tabela email_logs não encontrada - sistema de email pode não estar configurado');
      }
    } catch (error) {
      reporter.addComponent('email_system', 'error', { error: error.message });
      logWarning(`Erro ao verificar sistema de email: ${error.message}`);
    }
    
    // 7. Gerar relatório final
    logStep('7/7', 'Gerando relatório final...');
    
    // Adicionar recomendações baseadas na análise
    const components = reporter.report.components;
    
    if (components.automation_logs?.details?.successRate < 80) {
      reporter.addRecommendation('high', 'Melhorar taxa de sucesso das automações', 'Investigar e corrigir erros recorrentes');
    }
    
    if (components.dre_data?.details?.totalRecords > 10000) {
      reporter.addRecommendation('medium', 'Considerar arquivamento de dados antigos', 'Implementar rotina de limpeza');
    }
    
    if (!components.cron_job || components.cron_job.status !== 'success') {
      reporter.addRecommendation('critical', 'Configurar cron job para automação', 'Criar job para execução automática');
    }
    
    const finalReport = reporter.generateReport();
    const reportFile = reporter.saveReport();
    
    // Exibir resumo do relatório
    log('\n' + '='.repeat(60));
    
    const statusIcon = {
      'healthy': '🟢',
      'degraded': '🟡',
      'warning': '🟠',
      'critical': '🔴'
    };
    
    log(`${statusIcon[finalReport.systemStatus]} STATUS GERAL DO SISTEMA: ${finalReport.systemStatus.toUpperCase()}`, 'bold');
    
    log('\n📊 COMPONENTES:', 'bold');
    Object.entries(finalReport.components).forEach(([name, component]) => {
      const icon = component.status === 'success' ? '✅' : 
                   component.status === 'warning' ? '⚠️' : '❌';
      log(`   ${icon} ${name}: ${component.status}`);
    });
    
    log('\n📈 MÉTRICAS PRINCIPAIS:', 'bold');
    Object.entries(finalReport.metrics).forEach(([name, metric]) => {
      log(`   • ${name}: ${metric.value} ${metric.unit}`);
    });
    
    if (finalReport.issues.length > 0) {
      log('\n⚠️  PROBLEMAS IDENTIFICADOS:', 'bold');
      finalReport.issues.forEach((issue, index) => {
        const severityIcon = {
          'critical': '🔴',
          'high': '🟠',
          'medium': '🟡',
          'low': '🟢'
        };
        log(`   ${index + 1}. ${severityIcon[issue.severity]} [${issue.component}] ${issue.description}`);
        if (issue.suggestion) {
          log(`      💡 Sugestão: ${issue.suggestion}`);
        }
      });
    }
    
    if (finalReport.recommendations.length > 0) {
      log('\n💡 RECOMENDAÇÕES:', 'bold');
      finalReport.recommendations.forEach((rec, index) => {
        const priorityIcon = {
          'critical': '🔴',
          'high': '🟠',
          'medium': '🟡',
          'low': '🟢'
        };
        log(`   ${index + 1}. ${priorityIcon[rec.priority]} ${rec.description}`);
        if (rec.action) {
          log(`      🎯 Ação: ${rec.action}`);
        }
      });
    }
    
    if (reportFile) {
      log(`\n💾 Relatório salvo em: ${reportFile}`, 'cyan');
    }
    
    log('\n' + '='.repeat(60));
    logSuccess('RELATÓRIO COMPLETO DO SISTEMA DRE GERADO');
    
    // Determinar código de saída baseado no status
    if (finalReport.systemStatus === 'critical') {
      process.exit(1);
    } else if (finalReport.systemStatus === 'warning') {
      process.exit(2);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    log('\n' + '='.repeat(60));
    logError(`ERRO FATAL NA GERAÇÃO DO RELATÓRIO: ${error.message}`);
    
    reporter.addIssue('critical', 'system', `Erro fatal: ${error.message}`);
    const errorReport = reporter.generateReport();
    reporter.saveReport('dre-system-report-error.json');
    
    process.exit(1);
  }
}

// Executar geração do relatório
generateSystemReport().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});