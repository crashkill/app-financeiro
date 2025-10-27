const { createClient } = require('@supabase/supabase-js');

// Configurações dos projetos
const ORIGEM = {
  url: 'https://pwksgdjjkryqryqrvyja.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjAwNDgsImV4cCI6MjA2NDEzNjA0OH0.CbqU-Gx-QglerhxQzDjK6KFAi4CRLUl90LeKvDEKtbc'
};

const DESTINO = {
  url: 'https://vvlmbougufgrecyyjxzb.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bG1ib3VndWZncmVjeXlqeHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjQxOTYsImV4cCI6MjA3NDk0MDE5Nn0.S3Oy7gEQ9VRUrDick627LH_h3DIPowAaYBkCjjqrgB8'
};

const supabaseOrigem = createClient(ORIGEM.url, ORIGEM.key);
const supabaseDestino = createClient(DESTINO.url, DESTINO.key);

async function migrateColaboradores() {
  try {
    console.log('🚀 Iniciando migração de colaboradores...');
    console.log(`📤 Origem: ${ORIGEM.url}`);
    console.log(`📥 Destino: ${DESTINO.url}`);
    
    // 1. Verificar quantos registros existem na origem
    console.log('\n📊 Verificando dados na origem...');
    const { count: countOrigem, error: countOrigemError } = await supabaseOrigem
      .from('colaboradores')
      .select('*', { count: 'exact', head: true });
    
    if (countOrigemError) {
      console.error('❌ Erro ao contar registros na origem:', countOrigemError);
      return;
    }
    
    console.log(`✅ Total de colaboradores na origem: ${countOrigem}`);
    
    // 2. Verificar quantos registros existem no destino
    console.log('\n📊 Verificando dados no destino...');
    const { count: countDestino, error: countDestinoError } = await supabaseDestino
      .from('colaboradores')
      .select('*', { count: 'exact', head: true });
    
    if (countDestinoError) {
      console.error('❌ Erro ao contar registros no destino:', countDestinoError);
      console.log('🔄 Tentando verificar se a tabela existe...');
      
      // Tentar uma consulta simples para verificar se a tabela existe
      const { data: testData, error: testError } = await supabaseDestino
        .from('colaboradores')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Erro ao acessar tabela colaboradores no destino:', testError);
        return;
      } else {
        console.log('✅ Tabela colaboradores existe no destino');
      }
    } else {
      console.log(`📋 Total de colaboradores no destino (antes): ${countDestino}`);
    }
    
    // 3. Buscar todos os dados da origem
    console.log('\n📤 Buscando dados da origem...');
    const { data: dadosOrigem, error: errorOrigem } = await supabaseOrigem
      .from('colaboradores')
      .select('*');
    
    if (errorOrigem) {
      console.error('❌ Erro ao buscar dados da origem:', errorOrigem);
      return;
    }
    
    console.log(`✅ ${dadosOrigem.length} registros encontrados na origem`);
    
    if (dadosOrigem.length === 0) {
      console.log('⚠️ Nenhum dado encontrado na origem. Migração cancelada.');
      return;
    }
    
    // 4. Preparar dados para inserção (remover campos que podem causar conflito)
    const dadosParaInserir = dadosOrigem.map(colaborador => {
      const { id, created_at, ...dadosLimpos } = colaborador;
      return {
        ...dadosLimpos,
        // Garantir que campos obrigatórios estejam presentes
        email: colaborador.email || `colaborador_${Date.now()}@temp.com`,
        nome_completo: colaborador.nome_completo || 'Nome não informado'
      };
    });
    
    console.log('\n📥 Iniciando inserção no destino...');
    console.log(`📊 Preparando ${dadosParaInserir.length} registros para inserção`);
    
    // 5. Inserir dados em lotes para evitar timeout
    const BATCH_SIZE = 10;
    let totalInseridos = 0;
    let totalErros = 0;
    
    for (let i = 0; i < dadosParaInserir.length; i += BATCH_SIZE) {
      const lote = dadosParaInserir.slice(i, i + BATCH_SIZE);
      console.log(`\n🔄 Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(dadosParaInserir.length / BATCH_SIZE)} (${lote.length} registros)`);
      
      const { data: dadosInseridos, error: errorInsercao } = await supabaseDestino
        .from('colaboradores')
        .insert(lote)
        .select();
      
      if (errorInsercao) {
        console.error(`❌ Erro ao inserir lote ${Math.floor(i / BATCH_SIZE) + 1}:`, errorInsercao);
        totalErros += lote.length;
        
        // Tentar inserir um por vez para identificar registros problemáticos
        console.log('🔄 Tentando inserção individual...');
        for (const registro of lote) {
          const { error: errorIndividual } = await supabaseDestino
            .from('colaboradores')
            .insert([registro]);
          
          if (errorIndividual) {
            console.error(`❌ Erro ao inserir registro ${registro.nome_completo}:`, errorIndividual.message);
          } else {
            totalInseridos++;
            console.log(`✅ Inserido: ${registro.nome_completo}`);
          }
        }
      } else {
        totalInseridos += dadosInseridos.length;
        console.log(`✅ Lote inserido com sucesso: ${dadosInseridos.length} registros`);
      }
      
      // Pequena pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 6. Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    const { count: countFinal, error: countFinalError } = await supabaseDestino
      .from('colaboradores')
      .select('*', { count: 'exact', head: true });
    
    if (countFinalError) {
      console.error('❌ Erro ao contar registros finais:', countFinalError);
    } else {
      console.log(`📋 Total de colaboradores no destino (depois): ${countFinal}`);
    }
    
    // 7. Resumo da migração
    console.log('\n🎉 Migração concluída!');
    console.log(`✅ Registros inseridos com sucesso: ${totalInseridos}`);
    console.log(`❌ Registros com erro: ${totalErros}`);
    console.log(`📊 Total processado: ${totalInseridos + totalErros}/${dadosOrigem.length}`);
    
    if (totalErros > 0) {
      console.log('\n⚠️ Alguns registros não foram migrados devido a erros.');
      console.log('💡 Verifique os logs acima para mais detalhes.');
    }
    
  } catch (error) {
    console.error('💥 Erro geral na migração:', error);
  }
}

// Executar migração
migrateColaboradores();