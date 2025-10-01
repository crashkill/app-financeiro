import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  console.log('🔧 CRIANDO BUCKET DRE-FILES');
  console.log('==================================================');
  
  try {
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message);
      return;
    }
    
    console.log('📋 Buckets existentes:', buckets.map(b => b.name).join(', '));
    
    const bucketExists = buckets.some(bucket => bucket.name === 'dre-files');
    
    if (bucketExists) {
      console.log('✅ Bucket dre-files já existe!');
      return;
    }
    
    // Criar o bucket
    console.log('🔨 Criando bucket dre-files...');
    const { data, error } = await supabase.storage.createBucket('dre-files', {
      public: false,
      allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      fileSizeLimit: 52428800 // 50MB
    });
    
    if (error) {
      console.error('❌ Erro ao criar bucket:', error.message);
      
      // Tentar criar com configuração mínima
      console.log('🔄 Tentando criar com configuração básica...');
      const { data: data2, error: error2 } = await supabase.storage.createBucket('dre-files');
      
      if (error2) {
        console.error('❌ Erro na segunda tentativa:', error2.message);
        return;
      }
      
      console.log('✅ Bucket criado com configuração básica!');
    } else {
      console.log('✅ Bucket dre-files criado com sucesso!');
    }
    
    // Verificar novamente
    const { data: newBuckets } = await supabase.storage.listBuckets();
    console.log('📋 Buckets após criação:', newBuckets.map(b => b.name).join(', '));
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createBucket();