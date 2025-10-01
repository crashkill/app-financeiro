const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Arquivo para armazenar o último timestamp verificado
const fs = require('fs');
const path = require('path');
const lastCheckFile = path.join(__dirname, '.last-check.json');

function getLastCheckTime() {
  try {
    if (fs.existsSync(lastCheckFile)) {
      const data = JSON.parse(fs.readFileSync(lastCheckFile, 'utf8'));
      return new Date(data.lastCheck);
    }
  } catch (error) {
    console.warn('⚠️  Erro ao ler último timestamp:', error.message);
  }
  // Se não existe arquivo ou erro, retorna 1 hora atrás
  return new Date(Date.now() - 60 * 60 * 1000);
}

function saveLastCheckTime(timestamp) {
  try {
    fs.writeFileSync(lastCheckFile, JSON.stringify({ lastCheck: timestamp.toISOString() }));
  } catch (error) {
    console.warn('⚠️  Erro ao salvar timestamp:', error.message);
  }
}

async function monitorUploads() {
  const now = new Date();
  const lastCheck = getLastCheckTime();
  
  console.log(`🔍 Monitorando uploads desde ${lastCheck.toLocaleString('pt-BR')}`);
  console.log('=' .repeat(60));

  try {
    // Buscar novos registros desde a última verificação
    const { data: newRecords, error } = await supabase
      .from('dre_hitss')
      .select('*')
      .gte('uploaded_at', lastCheck.toISOString())
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao consultar novos registros:', error);
      return;
    }

    if (newRecords.length === 0) {
      console.log('✅ Nenhum novo upload detectado.');
    } else {
      console.log(`🆕 ${newRecords.length} novos registros encontrados!`);
      
      // Agrupar por upload_batch_id
      const batches = newRecords.reduce((acc, record) => {
        if (!acc[record.upload_batch_id]) {
          acc[record.upload_batch_id] = [];
        }
        acc[record.upload_batch_id].push(record);
        return acc;
      }, {});

      console.log(`\n📦 ${Object.keys(batches).length} lote(s) de upload:`);
      
      Object.entries(batches).forEach(([batchId, records]) => {
        const firstRecord = records[0];
        console.log(`\n   🔹 Lote: ${batchId}`);
        console.log(`     Arquivo: ${firstRecord.file_name}`);
        console.log(`     Registros: ${records.length}`);
        console.log(`     Upload: ${new Date(firstRecord.uploaded_at).toLocaleString('pt-BR')}`);
        
        // Estatísticas do lote
        const tipos = records.reduce((acc, r) => {
          const key = `${r.tipo || 'N/A'} - ${r.natureza || 'N/A'}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`     Tipos: ${Object.entries(tipos).map(([k, v]) => `${k}(${v})`).join(', ')}`);
        
        const totalValor = records.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0);
        console.log(`     Total: R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      });

      // Verificar integridade dos dados
      console.log('\n🔍 Verificação de integridade:');
      const invalidRecords = newRecords.filter(r => 
        !r.descricao || 
        !r.valor || 
        !r.data || 
        !r.lancamento
      );
      
      if (invalidRecords.length > 0) {
        console.log(`   ⚠️  ${invalidRecords.length} registros com dados incompletos`);
        invalidRecords.slice(0, 3).forEach((record, index) => {
          console.log(`     ${index + 1}. ID: ${record.id} - Arquivo: ${record.file_name}`);
        });
      } else {
        console.log('   ✅ Todos os registros estão íntegros');
      }
    }

    // Salvar timestamp da verificação
    saveLastCheckTime(now);
    
    console.log('\n' + '=' .repeat(60));
    console.log(`✅ Monitoramento concluído às ${now.toLocaleString('pt-BR')}`);
    
  } catch (error) {
    console.error('❌ Erro geral no monitoramento:', error);
  }
}

// Verificar se deve executar em modo contínuo
const args = process.argv.slice(2);
const watchMode = args.includes('--watch') || args.includes('-w');
const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 30;

if (watchMode) {
  console.log(`🔄 Iniciando monitoramento contínuo (intervalo: ${interval}s)`);
  console.log('Pressione Ctrl+C para parar\n');
  
  // Executar imediatamente
  monitorUploads();
  
  // Configurar execução periódica
  const intervalId = setInterval(monitorUploads, interval * 1000);
  
  // Capturar Ctrl+C para parar graciosamente
  process.on('SIGINT', () => {
    console.log('\n🛑 Parando monitoramento...');
    clearInterval(intervalId);
    process.exit(0);
  });
} else {
  // Executar uma única vez
  monitorUploads();
}