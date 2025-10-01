import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDreBucket() {
  console.log('🚀 CRIANDO BUCKET DRE-FILES');
  console.log('==================================================');
  
  try {
    // Verificar se o bucket já existe
    console.log('🔍 Verificando buckets existentes...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message);
      return;
    }
    
    console.log('📋 Buckets encontrados:', buckets.map(b => b.name).join(', '));
    
    const dreBucketExists = buckets.some(bucket => bucket.name === 'dre-files');
    
    if (dreBucketExists) {
      console.log('✅ Bucket dre-files já existe!');
    } else {
      console.log('🔧 Criando bucket dre-files...');
      
      const { data, error } = await supabase.storage.createBucket('dre-files', {
        public: false,
        allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        console.error('❌ Erro ao criar bucket:', error.message);
        return;
      }
      
      console.log('✅ Bucket dre-files criado com sucesso!');
    }
    
    // Verificar novamente
    console.log('\n🔍 Verificação final...');
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();
    
    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError.message);
      return;
    }
    
    const finalDreBucket = finalBuckets.find(bucket => bucket.name === 'dre-files');
    
    if (finalDreBucket) {
      console.log('✅ Bucket dre-files confirmado!');
      console.log('📊 Detalhes:', {
        name: finalDreBucket.name,
        id: finalDreBucket.id,
        public: finalDreBucket.public,
        created_at: finalDreBucket.created_at
      });
    } else {
      console.log('❌ Bucket dre-files não encontrado após criação');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
createDreBucket().then(() => {
  console.log('\n🏁 Processo concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});