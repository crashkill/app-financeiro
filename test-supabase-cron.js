require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseCron() {
  console.log('🤖 Testando Cron Job do Supabase...');
  console.log('📅 Data/Hora:', new Date().toLocaleString('pt-BR'));
  console.log('');

  try {
    // 1. Verificar status do Cron Job
    console.log('1️⃣ Verificando status do Cron Job...');
    const { data: cronStatus, error: cronError } = await supabase
      .rpc('get_hitss_cron_status');

    if (cronError) {
      console.error('❌ Erro ao verificar status do Cron:', cronError);
    } else {
      console.log('✅ Status do Cron Job:');
      if (cronStatus && cronStatus.length > 0) {
        cronStatus.forEach(job => {
          console.log(`   📋 Job: ${job.job_name}`);
          console.log(`   ⏰ Schedule: ${job.schedule}`);
          console.log(`   🔧 Command: ${job.command}`);
          console.log(`   ✅ Ativo: ${job.active ? 'Sim' : 'Não'}`);
          console.log('');
        });
      } else {
        console.log('   ⚠️ Nenhum Cron Job encontrado');
      }
    }

    // 2. Executar manualmente o Cron Job
    console.log('2️⃣ Executando Cron Job manualmente...');
    const startTime = Date.now();
    
    const { data: cronResult, error: cronExecError } = await supabase
      .rpc('call_hitss_automation');

    const executionTime = Date.now() - startTime;

    if (cronExecError) {
      console.error('❌ Erro na execução do Cron:', cronExecError);
    } else {
      console.log('✅ Cron Job executado com sucesso!');
      console.log(`📊 Resultado: ${cronResult}`);
      console.log(`⏱️ Tempo de execução: ${executionTime}ms`);
    }

    // 3. Verificar logs da automação
    console.log('');
    console.log('3️⃣ Verificando logs da automação...');
    const { data: logs, error: logsError } = await supabase
      .from('hitss_automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError);
    } else {
      console.log('📋 Últimos 5 logs:');
      logs.forEach((log, index) => {
        const date = new Date(log.created_at).toLocaleString('pt-BR');
        const icon = log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : '✅';
        console.log(`${index + 1}. ${icon} [${log.level.toUpperCase()}] ${date}`);
        console.log(`   Mensagem: ${log.message}`);
        if (log.context) {
          console.log(`   Contexto: ${JSON.stringify(log.context, null, 2)}`);
        }
        console.log('');
      });
    }

    // 4. Verificar dados na tabela DRE
    console.log('4️⃣ Verificando dados na tabela DRE...');
    const { count: dreCount, error: dreError } = await supabase
      .from('dre_hitss')
      .select('*', { count: 'exact', head: true });

    if (dreError) {
      console.error('❌ Erro ao verificar tabela DRE:', dreError);
    } else {
      console.log(`📊 Total de registros na tabela DRE: ${dreCount}`);
    }

    // 5. Verificar últimas execuções
    console.log('');
    console.log('5️⃣ Verificando últimas execuções...');
    const { data: executions, error: execError } = await supabase
      .from('hitss_automation_executions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(3);

    if (execError) {
      console.error('❌ Erro ao buscar execuções:', execError);
    } else {
      console.log('📋 Últimas 3 execuções:');
      executions.forEach((exec, index) => {
        const date = new Date(exec.timestamp).toLocaleString('pt-BR');
        const icon = exec.success ? '✅' : '❌';
        console.log(`${index + 1}. ${icon} ${date}`);
        console.log(`   Registros importados: ${exec.records_imported || 0}`);
        console.log(`   Sucesso: ${exec.success ? 'Sim' : 'Não'}`);
        if (exec.error_message) {
          console.log(`   Erro: ${exec.error_message}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }

  console.log('==================================================');
  console.log('✅ Teste do Cron Job concluído!');
}

// Executar teste
testSupabaseCron();