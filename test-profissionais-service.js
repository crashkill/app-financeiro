// Teste do serviço de profissionais
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY1OTQ4NzEsImV4cCI6MjA0MjE3MDg3MX0.Zt1Ej_Oa8Nt8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfissionaisService() {
  console.log('🔍 Testando serviço de profissionais...');
  
  try {
    // 1. Testar listagem de profissionais
    console.log('\n1. Testando listagem de profissionais...');
    const { data: profissionais, error: listError } = await supabase
      .from('profissionais')
      .select('*')
      .order('criado_em', { ascending: false });

    if (listError) {
      console.error('❌ Erro ao listar profissionais:', listError);
      return;
    }

    console.log(`✅ ${profissionais?.length || 0} profissionais encontrados`);
    if (profissionais && profissionais.length > 0) {
      console.log('📋 Primeiros 3 profissionais:');
      profissionais.slice(0, 3).forEach((prof, index) => {
        console.log(`   ${index + 1}. ${prof.nome} (${prof.email}) - ${prof.regime_trabalho || 'N/A'}`);
      });
    }

    // 2. Testar criação de um novo profissional
    console.log('\n2. Testando criação de profissional...');
    const novoProfissional = {
      nome: 'Teste Profissional',
      email: 'teste@exemplo.com',
      regime_trabalho: 'CLT',
      local_alocacao: 'São Paulo',
      proficiencia_cargo: 'Pleno',
      tecnologias: ['JavaScript', 'React'],
      disponivel_compartilhamento: true,
      percentual_compartilhamento: 50,
      observacoes: 'Profissional criado para teste',
      valor_hora: 100.00,
      valor_mensal: 8000.00
    };

    const { data: novoProfData, error: createError } = await supabase
      .from('profissionais')
      .insert([novoProfissional])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar profissional:', createError);
    } else {
      console.log('✅ Profissional criado com sucesso:', novoProfData.nome);
      
      // 3. Testar atualização
      console.log('\n3. Testando atualização de profissional...');
      const { data: updatedData, error: updateError } = await supabase
        .from('profissionais')
        .update({ observacoes: 'Profissional atualizado para teste' })
        .eq('id', novoProfData.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar profissional:', updateError);
      } else {
        console.log('✅ Profissional atualizado com sucesso');
      }

      // 4. Testar exclusão
      console.log('\n4. Testando exclusão de profissional...');
      const { error: deleteError } = await supabase
        .from('profissionais')
        .delete()
        .eq('id', novoProfData.id);

      if (deleteError) {
        console.error('❌ Erro ao excluir profissional:', deleteError);
      } else {
        console.log('✅ Profissional excluído com sucesso');
      }
    }

    // 5. Verificar estrutura da tabela
    console.log('\n5. Verificando estrutura da tabela...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('profissionais')
      .select('*')
      .limit(1);

    if (!tableError && tableInfo && tableInfo.length > 0) {
      console.log('📊 Campos disponíveis na tabela:');
      Object.keys(tableInfo[0]).forEach(field => {
        console.log(`   - ${field}`);
      });
    }

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('💥 Erro geral no teste:', error);
  }
}

testProfissionaisService();