import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGliaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class EdgeFunctionTester {
  constructor() {
    this.executionId = `test_edge_${Date.now()}`;
    console.log(`🧪 TESTE DA EDGE FUNCTION SIMULADA - ${this.executionId}`);
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}\n`);
  }

  async log(step, status, message = '') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${step}: ${status} - ${message}`);
  }

  async testEdgeFunction() {
    console.log('🚀 TESTANDO EDGE FUNCTION: download-hitss-simulated');
    await this.log('EDGE_TEST', 'INICIADO', 'Testando Edge Function simulada de download');

    try {
      console.log('⚡ Chamando Edge Function simulada...');

      const startTime = Date.now();

      // Chamar a Edge Function simulada
      const { data, error } = await supabase.functions.invoke('download-hitss-simulated');

      const executionTime = (Date.now() - startTime) / 1000;

      if (error) {
        console.log(`❌ Erro na Edge Function: ${error.message}`);

        // Verificar se a função existe
        console.log('\n🔍 Verificando funções disponíveis...');
        try {
          const { data: functions, error: listError } = await supabase.functions.list();
          if (listError) {
            console.log(`⚠️ Erro ao listar funções: ${listError.message}`);
          } else {
            console.log('📋 Funções disponíveis:');
            functions?.forEach(func => {
              console.log(`  • ${func.name} (${func.status})`);
            });
          }
        } catch (listErr) {
          console.log(`⚠️ Erro ao verificar funções: ${listErr.message}`);
        }

        await this.log('EDGE_TEST', 'ERRO', error.message);
        return false;
      }

      console.log(`✅ Edge Function executada com sucesso em ${executionTime.toFixed(2)}s`);
      console.log(`📊 Resultados:`);
      console.log(`  • Status: ${data.success ? '✅ SUCESSO' : '❌ FALHA'}`);
      console.log(`  • Tempo de Download: ${data.downloadTime?.toFixed(2) || 'N/A'}s`);
      console.log(`  • Tempo Total: ${data.totalTime?.toFixed(2) || 'N/A'}s`);
      console.log(`  • Arquivo: ${data.fileName || 'N/A'}`);
      console.log(`  • Tamanho: ${data.fileSize || 'N/A'} MB`);
      console.log(`  • Registros: ${data.recordCount || 'N/A'}`);
      console.log(`  • Inseridos: ${data.insertedCount || 'N/A'}`);
      console.log(`  • Storage: ${data.storagePath || 'N/A'}`);
      console.log(`  • Dados Mock: ${data.mockData ? '✅ Sim' : '❌ Não'}`);

      await this.log('EDGE_TEST', 'SUCESSO',
        `Download: ${data.downloadTime?.toFixed(2)}s, Total: ${data.totalTime?.toFixed(2)}s, Arquivo: ${data.fileName}, Inseridos: ${data.insertedCount}`);

      // Verificar se os dados foram realmente inseridos na tabela
      console.log('\n🔍 VERIFICANDO DADOS NA TABELA DRE_HITSS...');

      const { data: insertedData, error: queryError } = await supabase
        .from('dre_hitss')
        .select('*')
        .eq('metadata->>source', 'edge_function_simulation')
        .order('created_at', { ascending: false })
        .limit(5);

      if (queryError) {
        console.log(`⚠️ Erro ao verificar tabela: ${queryError.message}`);
      } else {
        console.log(`✅ Registros encontrados: ${insertedData?.length || 0}`);
        if (insertedData && insertedData.length > 0) {
          console.log('📋 Exemplo dos registros inseridos:');
          insertedData.forEach((record, index) => {
            console.log(`  ${index + 1}. Projeto: ${record.projeto}`);
            console.log(`     Valor: R$ ${record.valor}`);
            console.log(`     Natureza: ${record.natureza}`);
            console.log(`     Fonte: ${record.metadata?.source}`);
            console.log('');
          });
        }
      }

      // Verificar se o arquivo foi enviado para o Storage
      console.log('\n🔍 VERIFICANDO ARQUIVO NO STORAGE...');

      if (data.storagePath) {
        const { data: files, error: listError } = await supabase.storage
          .from('dre-files')
          .list('uploads', {
            search: data.fileName
          });

        if (listError) {
          console.log(`⚠️ Erro ao verificar Storage: ${listError.message}`);
        } else {
          const foundFile = files?.find(file => file.name === data.fileName);
          if (foundFile) {
            console.log(`✅ Arquivo encontrado no Storage:`);
            console.log(`  • Nome: ${foundFile.name}`);
            console.log(`  • Tamanho: ${(foundFile.metadata?.size / (1024 * 1024)).toFixed(2)} MB`);
            console.log(`  • Atualizado: ${new Date(foundFile.updated_at).toLocaleString('pt-BR')}`);
            console.log(`  • URL: ${supabaseUrl}/storage/v1/object/public/dre-files/${data.storagePath}`);
          } else {
            console.log(`❌ Arquivo não encontrado no Storage`);
          }
        }
      }

      console.log('\n📋 ANÁLISE DE VIABILIDADE PARA EDGE FUNCTIONS:');
      console.log('-'.repeat(50));

      const downloadTime = data.downloadTime || 0;
      const totalTime = data.totalTime || 0;

      console.log(`📥 Download: ${downloadTime.toFixed(2)}s - ${downloadTime > 300 ? '❌ Muito lento para Edge Function' : '✅ Aceitável'}`);
      console.log(`⚡ Processamento: ${totalTime.toFixed(2)}s - ${totalTime > 60 ? '⚠️ Pode ter timeout' : '✅ OK'}`);
      console.log(`🏆 Total: ${totalTime.toFixed(2)}s - ${totalTime > 300 ? '❌ Não viável' : totalTime > 180 ? '⚠️ Viável com otimizações' : '✅ Perfeito'}`);

      if (totalTime <= 180) {
        console.log('✅ Sistema viável para Edge Functions!');
      } else {
        console.log('❌ Sistema muito lento - considerar otimizações');
      }

      return true;

    } catch (error) {
      console.log(`❌ Erro no teste da Edge Function: ${error.message}`);

      // Verificar se a função existe
      console.log('\n🔍 Verificando funções disponíveis...');
      try {
        const { data: functions, error: listError } = await supabase.functions.list();
        if (listError) {
          console.log(`⚠️ Erro ao listar funções: ${listError.message}`);
        } else {
          console.log('📋 Funções disponíveis:');
          functions?.forEach(func => {
            console.log(`  • ${func.name} (${func.status})`);
          });
        }
      } catch (listErr) {
        console.log(`⚠️ Erro ao verificar funções: ${listErr.message}`);
      }

      await this.log('EDGE_TEST', 'ERRO', error.message);
      return false;
    }
  }

  async execute() {
    console.log('🧪 EXECUTANDO TESTE DA EDGE FUNCTION SIMULADA\n');

    const success = await this.testEdgeFunction();

    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESULTADO DO TESTE: ${success ? '✅ SUCESSO' : '❌ FALHA'}`);
    console.log(`🆔 ID da Execução: ${this.executionId}`);
    console.log(`⏱️ Duração: ${((Date.now() - new Date(this.executionId.split('_')[2]).getTime()) / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));

    return success;
  }
}

async function main() {
  try {
    const tester = new EdgeFunctionTester();
    const result = await tester.execute();

    console.log(`\n${result ? '🎉' : '💥'} Teste da Edge Function simulada ${result ? 'concluído com sucesso' : 'falhou'}`);
    process.exit(result ? 0 : 1);

  } catch (error) {
    console.error('💥 Erro crítico no teste:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

main();

export default EdgeFunctionTester;
