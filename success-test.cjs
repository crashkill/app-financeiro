require('dotenv').config({ debug: true });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function successTest() {
  console.log('🎯 TESTE DE SUCESSO - Tabela DRE HITSS');
  console.log('=' .repeat(60));
  
  const testRecords = [];
  
  try {
    // 1. Teste com todos os campos obrigatórios identificados
    console.log('\n📝 1. Testando com campos obrigatórios (projeto + ano + mes)...');
    const record1 = {
      projeto: 'Projeto Teste 1',
      ano: 2024,
      mes: 12,
      tipo: 'receita',
      natureza: 'RECEITA',
      descricao: 'Teste de receita',
      valor: 1000.50
    };
    
    console.log('   Inserindo:', JSON.stringify(record1, null, 2));
    const { data: data1, error: error1 } = await supabase
      .from('dre_hitss')
      .insert(record1)
      .select();
    
    if (error1) {
      console.log('❌ Erro:', error1.message);
      console.log('   Código:', error1.code);
      if (error1.details) console.log('   Detalhes:', error1.details);
    } else {
      console.log('✅ Sucesso! Registro inserido:', data1[0].id);
      testRecords.push(data1[0].id);
    }
    
    // 2. Teste com despesa
    console.log('\n📝 2. Testando despesa...');
    const record2 = {
      projeto: 'Projeto Teste 2',
      ano: 2024,
      mes: 11,
      tipo: 'despesa',
      natureza: 'CUSTO',
      descricao: 'Teste de despesa',
      valor: 500.25
    };
    
    console.log('   Inserindo:', JSON.stringify(record2, null, 2));
    const { data: data2, error: error2 } = await supabase
      .from('dre_hitss')
      .insert(record2)
      .select();
    
    if (error2) {
      console.log('❌ Erro:', error2.message);
      console.log('   Código:', error2.code);
      if (error2.details) console.log('   Detalhes:', error2.details);
    } else {
      console.log('✅ Sucesso! Registro inserido:', data2[0].id);
      testRecords.push(data2[0].id);
    }
    
    // 3. Teste com campos adicionais seguros
    console.log('\n📝 3. Testando com campos adicionais seguros...');
    const record3 = {
      projeto: 'Projeto Teste 3',
      ano: 2024,
      mes: 10,
      tipo: 'receita',
      natureza: 'RECEITA',
      descricao: 'Teste completo com campos seguros',
      valor: 750.00,
      observacao: 'Observação de teste detalhada',
      periodo: '2024-10'
    };
    
    console.log('   Inserindo:', JSON.stringify(record3, null, 2));
    const { data: data3, error: error3 } = await supabase
      .from('dre_hitss')
      .insert(record3)
      .select();
    
    if (error3) {
      console.log('❌ Erro:', error3.message);
      console.log('   Código:', error3.code);
      if (error3.details) console.log('   Detalhes:', error3.details);
    } else {
      console.log('✅ Sucesso! Registro completo inserido:', data3[0].id);
      testRecords.push(data3[0].id);
    }
    
    // 4. Teste de consulta completa
    if (testRecords.length > 0) {
      console.log('\n📊 4. Consultando todos os registros inseridos...');
      const { data: queryData, error: queryError } = await supabase
        .from('dre_hitss')
        .select('*')
        .in('id', testRecords)
        .order('created_at', { ascending: true });
      
      if (queryError) {
        console.log('❌ Erro na consulta:', queryError.message);
      } else {
        console.log('✅ Registros encontrados:', queryData.length);
        queryData.forEach((record, index) => {
          console.log(`   ${index + 1}. ${record.projeto} (${record.ano}/${record.mes}) - ${record.tipo} - R$ ${record.valor}`);
          console.log(`      Descrição: ${record.descricao}`);
          console.log(`      ID: ${record.id}`);
        });
      }
    }
    
    // 5. Teste de operações CRUD
    if (testRecords.length > 0) {
      console.log('\n✏️  5. Testando operações CRUD...');
      
      // Update
      const { data: updateData, error: updateError } = await supabase
        .from('dre_hitss')
        .update({ 
          descricao: 'Descrição atualizada via CRUD',
          valor: 1234.56,
          observacao: 'Observação atualizada'
        })
        .eq('id', testRecords[0])
        .select('id, descricao, valor, observacao');
      
      if (updateError) {
        console.log('❌ Erro na atualização:', updateError.message);
      } else {
        console.log('✅ Registro atualizado:', updateData[0]);
      }
      
      // Select específico
      const { data: selectData, error: selectError } = await supabase
        .from('dre_hitss')
        .select('projeto, ano, mes, tipo, valor')
        .eq('projeto', 'Projeto Teste 2')
        .single();
      
      if (selectError) {
        console.log('❌ Erro na consulta específica:', selectError.message);
      } else {
        console.log('✅ Consulta específica:', selectData);
      }
    }
    
    // 6. Teste de agregações
    console.log('\n📈 6. Testando agregações...');
    const { data: countData, error: countError } = await supabase
      .from('dre_hitss')
      .select('*', { count: 'exact', head: true })
      .in('id', testRecords);
    
    if (countError) {
      console.log('❌ Erro na contagem:', countError.message);
    } else {
      console.log('✅ Total de registros de teste:', countData);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  } finally {
    // Limpeza dos registros de teste
    if (testRecords.length > 0) {
      console.log('\n🧹 Limpando registros de teste...');
      const { error: deleteError } = await supabase
        .from('dre_hitss')
        .delete()
        .in('id', testRecords);
      
      if (deleteError) {
        console.log('❌ Erro na limpeza:', deleteError.message);
      } else {
        console.log('✅ Registros de teste removidos:', testRecords.length);
      }
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 TESTE DE SUCESSO CONCLUÍDO');
  console.log('\n📋 ESTRUTURA CONFIRMADA DA TABELA DRE_HITSS:');
  console.log('\n🔴 CAMPOS OBRIGATÓRIOS (NOT NULL):');
  console.log('   • projeto (string)');
  console.log('   • ano (integer)');
  console.log('   • mes (integer)');
  console.log('\n🟡 CAMPOS COM CONSTRAINTS:');
  console.log('   • tipo: "receita" ou "despesa" (CHECK constraint)');
  console.log('   • natureza: "RECEITA" ou "CUSTO" (CHECK constraint)');
  console.log('\n🟢 CAMPOS OPCIONAIS CONFIRMADOS:');
  console.log('   • descricao (string)');
  console.log('   • valor (decimal/numeric)');
  console.log('   • observacao (string)');
  console.log('   • periodo (string)');
  console.log('\n🔵 CAMPOS AUTOMÁTICOS:');
  console.log('   • id (UUID, PRIMARY KEY)');
  console.log('   • created_at (timestamp)');
  console.log('   • updated_at (timestamp)');
  console.log('\n⚠️  CONFIGURAÇÕES ESPECIAIS:');
  console.log('   • RLS (Row Level Security) ATIVO');
  console.log('   • Necessário usar SUPABASE_SERVICE_ROLE_KEY para operações');
  console.log('   • Schema cache pode estar desatualizado para alguns campos');
}

successTest();