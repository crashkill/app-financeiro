import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDreInsert() {
  console.log('🧪 Testando inserção na tabela dre_hitss...');
  
  try {
    // Dados de teste
    const testData = {
      upload_batch_id: randomUUID(),
      file_name: 'teste_automatico.xlsx',
      tipo: 'receita',
      natureza: 'RECEITA',
      descricao: 'TESTE_AUTO - Projeto Teste',
      valor: '1000.00',
      data: '1/2025',
      categoria: 'Teste',
      observacao: null,
      lancamento: '1000.00',
      projeto: 'TESTE_AUTO - Projeto Teste',
      periodo: '1/2025',
      denominacao_conta: 'Conta Teste',
      conta_resumo: 'TESTE001',
      linha_negocio: 'Teste',
      relatorio: 'Realizado',
      raw_data: { teste: true }
    };

    console.log('📝 Inserindo dados de teste...');
    const { data, error } = await supabase
      .from('dre_hitss')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Erro na inserção:', error);
      return;
    }

    console.log('✅ Dados inseridos com sucesso!');
    console.log('📊 Dados inseridos:', data);

    // Verificar se os dados foram inseridos
    console.log('🔍 Verificando dados inseridos...');
    const { data: checkData, error: checkError } = await supabase
      .from('dre_hitss')
      .select('*')
      .eq('upload_batch_id', testData.upload_batch_id);

    if (checkError) {
      console.error('❌ Erro na verificação:', checkError);
      return;
    }

    console.log('✅ Verificação concluída!');
    console.log(`📊 ${checkData.length} registro(s) encontrado(s)`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testDreInsert().catch(console.error);