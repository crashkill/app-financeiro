const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDreData() {
  console.log('🔍 Verificando dados na tabela dre_hitss...');
  console.log('=' .repeat(50));

  try {
    // 1. Consultar registros recentes (últimas 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentRecords, error: recentError } = await supabase
      .from('dre_hitss')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('❌ Erro ao consultar registros recentes:', recentError);
      return;
    }

    console.log(`📊 Registros das últimas 24 horas: ${recentRecords.length}`);
    
    if (recentRecords.length > 0) {
      console.log('\n📋 Últimos 5 registros:');
      recentRecords.slice(0, 5).forEach((record, index) => {
        console.log(`\n${index + 1}. ID: ${record.id}`);
        console.log(`   Arquivo: ${record.file_name || 'N/A'}`);
        console.log(`   Criado em: ${new Date(record.created_at).toLocaleString('pt-BR')}`);
        console.log(`   Status: ${record.status || 'N/A'}`);
        if (record.error_message) {
          console.log(`   ⚠️  Erro: ${record.error_message}`);
        }
      });
    }

    // 2. Estatísticas gerais
    const { data: totalRecords, error: totalError } = await supabase
      .from('dre_hitss')
      .select('id', { count: 'exact' });

    if (totalError) {
      console.error('❌ Erro ao consultar total de registros:', totalError);
    } else {
      console.log(`\n📈 Total de registros na tabela: ${totalRecords.length}`);
    }

    // 3. Verificar registros por upload_batch_id
    const { data: batchStats, error: batchError } = await supabase
      .from('dre_hitss')
      .select('upload_batch_id, file_name, uploaded_at')
      .order('uploaded_at', { ascending: false })
      .limit(20);

    if (batchError) {
      console.error('❌ Erro ao consultar estatísticas por lote:', batchError);
    } else {
      console.log(`\n📦 Últimos uploads por lote:`);
      const batchGroups = batchStats.reduce((acc, record) => {
        if (!acc[record.upload_batch_id]) {
          acc[record.upload_batch_id] = [];
        }
        acc[record.upload_batch_id].push(record);
        return acc;
      }, {});
      
      Object.entries(batchGroups).slice(0, 5).forEach(([batchId, records]) => {
        console.log(`\n   Lote: ${batchId}`);
        console.log(`   Arquivo: ${records[0].file_name}`);
        console.log(`   Registros: ${records.length}`);
        console.log(`   Upload: ${new Date(records[0].uploaded_at).toLocaleString('pt-BR')}`);
      });
    }

    // 4. Validar estrutura dos dados
    if (recentRecords.length > 0) {
      console.log('\n🔍 Validando estrutura dos dados...');
      const sampleRecord = recentRecords[0];
      const requiredFields = ['id', 'upload_batch_id', 'file_name', 'uploaded_at', 'descricao', 'valor', 'data', 'lancamento'];
      const missingFields = requiredFields.filter(field => !(field in sampleRecord));
      
      if (missingFields.length === 0) {
        console.log('✅ Estrutura dos dados está correta');
      } else {
        console.log(`❌ Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
      }

      console.log('\n📋 Campos disponíveis no registro:');
      Object.keys(sampleRecord).forEach(field => {
        console.log(`   - ${field}: ${typeof sampleRecord[field]}`);
      });
    }

    // 5. Estatísticas por tipo e natureza
    const { data: typeStats, error: typeError } = await supabase
      .from('dre_hitss')
      .select('tipo, natureza')
      .not('tipo', 'is', null);

    if (typeError) {
      console.error('❌ Erro ao consultar estatísticas por tipo:', typeError);
    } else {
      console.log('\n📊 Estatísticas por tipo:');
      const typeCount = typeStats.reduce((acc, record) => {
        const key = `${record.tipo || 'N/A'} - ${record.natureza || 'N/A'}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }

    // 6. Verificar valores e períodos
    const { data: valueStats, error: valueError } = await supabase
      .from('dre_hitss')
      .select('valor, lancamento, periodo')
      .not('valor', 'is', null)
      .limit(1000);

    if (valueError) {
      console.error('❌ Erro ao consultar estatísticas de valores:', valueError);
    } else {
      const totalValor = valueStats.reduce((sum, record) => sum + parseFloat(record.valor || 0), 0);
      const totalLancamento = valueStats.reduce((sum, record) => sum + parseFloat(record.lancamento || 0), 0);
      
      console.log('\n💰 Estatísticas financeiras:');
      console.log(`   Total valor: R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   Total lançamento: R$ ${totalLancamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      
      const periodos = [...new Set(valueStats.map(r => r.periodo).filter(Boolean))];
      console.log(`   Períodos únicos: ${periodos.length}`);
      if (periodos.length > 0) {
        console.log(`   Períodos: ${periodos.slice(0, 5).join(', ')}${periodos.length > 5 ? '...' : ''}`);
      }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
verifyDreData();