import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDreFilesBucket() {
  console.log('🚀 CRIANDO BUCKET DRE-FILES');
  console.log('==================================================');
  
  try {
    // Primeiro, listar buckets existentes
    console.log('🔍 Listando buckets existentes...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message);
      return false;
    }
    
    console.log('📋 Buckets encontrados:', buckets.map(b => b.name).join(', '));
    
    // Verificar se o bucket 'dre-files' já existe
    const dreFilesBucket = buckets.find(bucket => bucket.name === 'dre-files');
    
    if (dreFilesBucket) {
      console.log('✅ Bucket dre-files já existe!');
      console.log('📊 Detalhes:', dreFilesBucket);
      return true;
    }
    
    // Criar o bucket 'dre-files'
    console.log('🔨 Criando bucket dre-files...');
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('dre-files', {
      public: false,
      allowedMimeTypes: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/pdf'
      ],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    });
    
    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError.message);
      return false;
    }
    
    console.log('✅ Bucket dre-files criado com sucesso!');
    console.log('📊 Detalhes:', newBucket);
    
    // Verificar se foi criado corretamente
    const { data: updatedBuckets, error: verifyError } = await supabase.storage.listBuckets();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar criação:', verifyError.message);
      return false;
    }
    
    const createdBucket = updatedBuckets.find(bucket => bucket.name === 'dre-files');
    
    if (createdBucket) {
      console.log('✅ Verificação: Bucket dre-files criado e confirmado!');
      return true;
    } else {
      console.error('❌ Bucket não foi encontrado após criação');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return false;
  }
}

async function testBucketAccess() {
  console.log('\n🔍 TESTANDO ACESSO AO BUCKET DRE-FILES');
  console.log('==================================================');
  
  try {
    // Tentar listar arquivos no bucket
    const { data: files, error: listError } = await supabase.storage
      .from('dre-files')
      .list();
    
    if (listError) {
      console.error('❌ Erro ao acessar bucket:', listError.message);
      return false;
    }
    
    console.log('✅ Acesso ao bucket dre-files: OK');
    console.log(`📁 Arquivos encontrados: ${files.length}`);
    
    if (files.length > 0) {
      console.log('📋 Arquivos:', files.map(f => f.name).join(', '));
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao testar acesso:', error.message);
    return false;
  }
}

// Executar correção
async function runFix() {
  const startTime = Date.now();
  
  const bucketCreated = await createDreFilesBucket();
  let accessOk = false;
  
  if (bucketCreated) {
    accessOk = await testBucketAccess();
  }
  
  const executionTime = (Date.now() - startTime) / 1000;
  
  console.log('\n📊 RELATÓRIO FINAL');
  console.log('==================================================');
  console.log(`⏱️  Tempo de execução: ${executionTime.toFixed(2)}s`);
  console.log(`🪣 Bucket criado: ${bucketCreated ? '✅ OK' : '❌ FALHA'}`);
  console.log(`🔐 Acesso testado: ${accessOk ? '✅ OK' : '❌ FALHA'}`);
  
  if (bucketCreated && accessOk) {
    console.log('\n🎉 Bucket dre-files está funcionando perfeitamente!');
    return true;
  } else {
    console.log('\n⚠️  Problemas encontrados com o bucket dre-files.');
    return false;
  }
}

runFix().then((success) => {
  console.log('\n🏁 Correção concluída');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});