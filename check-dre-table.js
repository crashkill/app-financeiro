import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDRETable() {
  console.log('🔍 VERIFICANDO TABELA dre_hitss');
  console.log('='.repeat(50));
  
  try {
    // Contar total de registros
    const { count, error: countError } = await supabase
      .from('dre_hitss')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError.message);
      return;
    }
    
    console.log(`📊 Total de registros na tabela: ${count}`);
    
    if (count === 0) {
      console.log('📭 A tabela dre_hitss está VAZIA');
      console.log('\n💡 Possíveis causas:');
      console.log('   - Os dados não foram inseridos corretamente');
      console.log('   - Houve erro na inserção durante o processamento');
      console.log('   - A tabela foi limpa recentemente');
      return;
    }
    
    // Buscar alguns registros de exemplo
    const { data: sampleData, error: sampleError } = await supabase
      .from('dre_hitss')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false });
    
    if (sampleError) {
      console.error('❌ Erro ao buscar registros de exemplo:', sampleError.message);
      return;
    }
    
    console.log('\n📋 REGISTROS MAIS RECENTES (últimos 5):');
    console.log('-'.repeat(80));
    
    sampleData.forEach((record, index) => {
      console.log(`\n${index + 1}. ID: ${record.id}`);
      console.log(`   Execution ID: ${record.execution_id}`);
      console.log(`   Conta: ${record.conta}`);
      console.log(`   Descrição: ${record.descricao}`);
      console.log(`   Valor: R$ ${record.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   Tipo: ${record.tipo}`);
      console.log(`   Período: ${record.periodo}`);
      console.log(`   Empresa: ${record.empresa}`);
      console.log(`   Criado em: ${new Date(record.created_at).toLocaleString('pt-BR')}`);
    });
    
    // Estatísticas por execution_id
    const { data: execStats, error: execError } = await supabase
      .from('dre_hitss')
      .select('execution_id')
      .order('created_at', { ascending: false });
    
    if (!execError && execStats.length > 0) {
      const execCounts = {};
      execStats.forEach(record => {
        execCounts[record.execution_id] = (execCounts[record.execution_id] || 0) + 1;
      });
      
      console.log('\n📈 ESTATÍSTICAS POR EXECUÇÃO:');
      console.log('-'.repeat(50));
      Object.entries(execCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([execId, count]) => {
          console.log(`   ${execId}: ${count} registros`);
        });
    }
    
    // Verificar últimas execuções
    const { data: recentExecs, error: recentError } = await supabase
      .from('dre_hitss')
      .select('execution_id, created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!recentError && recentExecs.length > 0) {
      const lastExec = recentExecs[0];
      console.log('\n🕒 ÚLTIMA INSERÇÃO:');
      console.log(`   Execution ID: ${lastExec.execution_id}`);
      console.log(`   Data/Hora: ${new Date(lastExec.created_at).toLocaleString('pt-BR')}`);
    }
    
  } catch (error) {
    console.error('💥 Erro ao verificar tabela:', error.message);
  }
}

// Executar verificação
checkDRETable();