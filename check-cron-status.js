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

async function checkCronStatus() {
  log('🔍 VERIFICANDO STATUS DO CRON JOB HITSS', 'bold');
  log('='.repeat(50));
  
  try {
    // Verificar se a extensão pg_cron está habilitada
    log('\n1. Verificando extensão pg_cron...', 'cyan');
    const { data: extensions, error: extError } = await supabase
      .rpc('get_extensions');
    
    if (extError) {
      log(`   ⚠️  Não foi possível verificar extensões: ${extError.message}`, 'yellow');
    } else {
      const pgCronEnabled = extensions?.some(ext => ext.name === 'pg_cron' && ext.installed);
      if (pgCronEnabled) {
        log('   ✅ Extensão pg_cron está habilitada', 'green');
      } else {
        log('   ❌ Extensão pg_cron não está habilitada', 'red');
      }
    }
    
    // Verificar jobs do cron
    log('\n2. Verificando jobs do cron...', 'cyan');
    const { data: cronJobs, error: cronError } = await supabase
      .from('cron.job')
      .select('*');
    
    if (cronError) {
      log(`   ⚠️  Erro ao acessar tabela cron.job: ${cronError.message}`, 'yellow');
      
      // Tentar método alternativo
      log('\n   Tentando método alternativo...', 'yellow');
      const { data: altJobs, error: altError } = await supabase
        .rpc('get_cron_jobs');
      
      if (altError) {
        log(`   ❌ Método alternativo falhou: ${altError.message}`, 'red');
      } else {
        displayCronJobs(altJobs);
      }
    } else {
      displayCronJobs(cronJobs);
    }
    
    // Verificar histórico de execuções
    log('\n3. Verificando histórico de execuções...', 'cyan');
    const { data: jobRuns, error: runsError } = await supabase
      .from('cron.job_run_details')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(10);
    
    if (runsError) {
      log(`   ⚠️  Erro ao acessar histórico: ${runsError.message}`, 'yellow');
    } else {
      displayJobRuns(jobRuns);
    }
    
    // Verificar logs de automação
    log('\n4. Verificando logs de automação HITSS...', 'cyan');
    const { data: automationLogs, error: logsError } = await supabase
      .from('automation_executions')
      .select('*')
      .eq('automation_type', 'hitss')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (logsError) {
      log(`   ⚠️  Erro ao acessar logs de automação: ${logsError.message}`, 'yellow');
    } else {
      displayAutomationLogs(automationLogs);
    }
    
  } catch (error) {
    log(`\n❌ Erro geral: ${error.message}`, 'red');
  }
}

function displayCronJobs(jobs) {
  if (!jobs || jobs.length === 0) {
    log('   ⚠️  Nenhum job do cron encontrado', 'yellow');
    return;
  }
  
  log(`   📋 ${jobs.length} job(s) encontrado(s):`, 'blue');
  
  jobs.forEach((job, index) => {
    log(`\n   Job ${index + 1}:`);
    log(`     • ID: ${job.jobid || job.id}`);
    log(`     • Nome: ${job.jobname || job.name || 'N/A'}`);
    log(`     • Schedule: ${job.schedule}`);
    log(`     • Comando: ${job.command}`);
    log(`     • Ativo: ${job.active ? '✅ Sim' : '❌ Não'}`, job.active ? 'green' : 'red');
    log(`     • Banco: ${job.database || 'N/A'}`);
    log(`     • Usuário: ${job.username || 'N/A'}`);
    
    if (job.jobname && job.jobname.includes('hitss')) {
      log(`     🎯 Este é o job HITSS!`, 'green');
    }
  });
}

function displayJobRuns(runs) {
  if (!runs || runs.length === 0) {
    log('   ⚠️  Nenhuma execução encontrada no histórico', 'yellow');
    return;
  }
  
  log(`   📊 Últimas ${runs.length} execuções:`, 'blue');
  
  runs.forEach((run, index) => {
    const status = run.status || (run.return_message ? 'completed' : 'unknown');
    const statusIcon = status === 'succeeded' || status === 'completed' ? '✅' : 
                      status === 'failed' ? '❌' : '⚠️';
    
    log(`\n   Execução ${index + 1}:`);
    log(`     • Job ID: ${run.jobid}`);
    log(`     • Status: ${statusIcon} ${status}`);
    log(`     • Início: ${run.start_time}`);
    log(`     • Fim: ${run.end_time || 'N/A'}`);
    
    if (run.return_message) {
      log(`     • Mensagem: ${run.return_message}`);
    }
  });
}

function displayAutomationLogs(logs) {
  if (!logs || logs.length === 0) {
    log('   ⚠️  Nenhum log de automação HITSS encontrado', 'yellow');
    return;
  }
  
  log(`   📝 Últimos ${logs.length} logs de automação HITSS:`, 'blue');
  
  logs.forEach((logEntry, index) => {
    const statusIcon = logEntry.status === 'success' ? '✅' : 
                      logEntry.status === 'error' ? '❌' : '⚠️';
    
    log(`\n   Log ${index + 1}:`);
    log(`     • ID: ${logEntry.id}`);
    log(`     • Status: ${statusIcon} ${logEntry.status}`);
    log(`     • Criado: ${logEntry.created_at}`);
    log(`     • Atualizado: ${logEntry.updated_at}`);
    
    if (logEntry.error_message) {
      log(`     • Erro: ${logEntry.error_message}`, 'red');
    }
    
    if (logEntry.metadata) {
      log(`     • Metadata: ${JSON.stringify(logEntry.metadata)}`);
    }
  });
}

// Executar verificação
checkCronStatus().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});