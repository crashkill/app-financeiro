const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

// Cliente Supabase com service role para testes
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para criar arquivo de teste
function createTestFile() {
  const testData = {
    empresa: 'HITSS Test',
    periodo: '2024-01',
    receitas: {
      vendas: 1000000,
      servicos: 500000
    },
    custos: {
      materiais: 300000,
      pessoal: 400000
    },
    despesas: {
      administrativas: 150000,
      comerciais: 100000
    }
  };
  
  const fileName = `test-dre-${Date.now()}.json`;
  const filePath = path.join(process.cwd(), fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(testData, null, 2));
  console.log(`✅ Arquivo de teste criado: ${fileName}`);
  
  return { fileName, filePath, testData };
}

// Função para fazer upload do arquivo
async function uploadTestFile(fileName, filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from('dre_reports')
      .upload(`test/${fileName}`, fileBuffer, {
        contentType: 'application/json',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Upload realizado com sucesso:`, data);
    return data;
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw error;
  }
}

// Função para verificar se os dados foram inseridos na tabela
async function verifyDataInsertion(fileName, testData) {
  try {
    // Aguardar um pouco para o trigger processar
    console.log('⏳ Aguardando processamento do trigger...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const { data, error } = await supabase
      .from('dre_hitss')
      .select('*')
      .eq('file_name', fileName)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Dados encontrados na tabela dre_hitss:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Verificar se os dados estão corretos
      const insertedData = data[0];
      const isDataCorrect = 
        insertedData.file_name === fileName &&
        insertedData.upload_batch_id !== null;
      
      if (isDataCorrect) {
        console.log('✅ Dados inseridos corretamente!');
      } else {
        console.log('⚠️ Dados inseridos, mas com diferenças do arquivo original');
      }
      
      return data[0];
    } else {
      console.log('❌ Nenhum dado encontrado na tabela dre_hitss');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
    throw error;
  }
}

// Função para limpar arquivos de teste
async function cleanup(fileName, filePath) {
  try {
    // Remover arquivo local
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🧹 Arquivo local removido');
    }
    
    // Remover arquivo do storage
    const { error } = await supabase.storage
      .from('dre_reports')
      .remove([`test/${fileName}`]);
    
    if (error) {
      console.warn('⚠️ Erro ao remover arquivo do storage:', error);
    } else {
      console.log('🧹 Arquivo removido do storage');
    }
  } catch (error) {
    console.warn('⚠️ Erro durante limpeza:', error);
  }
}

// Função principal de teste
async function runTest() {
  console.log('🚀 Iniciando teste da Edge Function process-dre-upload\n');
  
  let testFile = null;
  
  try {
    // 1. Criar arquivo de teste
    console.log('1️⃣ Criando arquivo de teste...');
    testFile = createTestFile();
    
    // 2. Fazer upload
    console.log('\n2️⃣ Fazendo upload do arquivo...');
    const uploadResult = await uploadTestFile(testFile.fileName, testFile.filePath);
    
    // 3. Verificar inserção de dados
    console.log('\n3️⃣ Verificando inserção de dados...');
    const insertedData = await verifyDataInsertion(testFile.fileName, testFile.testData);
    
    // 4. Resultado final
    console.log('\n📊 RESULTADO DO TESTE:');
    if (insertedData) {
      console.log('✅ SUCESSO: Edge Function funcionando corretamente!');
      console.log('✅ Trigger acionado com sucesso');
      console.log('✅ Dados inseridos na tabela dre_hitss');
    } else {
      console.log('❌ FALHA: Edge Function não funcionou como esperado');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE O TESTE:', error);
  } finally {
    // 5. Limpeza
    if (testFile) {
      console.log('\n5️⃣ Limpando arquivos de teste...');
      await cleanup(testFile.fileName, testFile.filePath);
    }
  }
}

// Executar teste
runTest().catch(console.error);