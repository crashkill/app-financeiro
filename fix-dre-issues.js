import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDREIssues() {
  console.log('🔧 Iniciando correção das pendências do sistema DRE...');
  
  try {
    // 1. Verificar e criar bucket 'dre-files'
    console.log('\n📁 Verificando bucket "dre-files"...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
    } else {
      const dreFilesBucket = buckets.find(bucket => bucket.name === 'dre-files');
      
      if (!dreFilesBucket) {
        console.log('📁 Criando bucket "dre-files"...');
        
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('dre-files', {
          public: false,
          allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
          fileSizeLimit: 10485760 // 10MB
        });
        
        if (createError) {
          console.error('❌ Erro ao criar bucket:', createError.message);
        } else {
          console.log('✅ Bucket "dre-files" criado com sucesso!');
        }
      } else {
        console.log('✅ Bucket "dre-files" já existe!');
      }
    }
    
    // 2. Verificar Edge Functions
    console.log('\n⚡ Verificando Edge Functions...');
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-dre-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      if (response.ok) {
        console.log('✅ Edge Function "send-dre-notification" está funcionando!');
      } else {
        console.log(`⚠️ Edge Function retornou status ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️ Edge Function pode não estar disponível:', error.message);
    }
    
    // 3. Verificar tabelas DRE
    console.log('\n📊 Verificando tabelas DRE...');
    
    const tables = ['dre_reports', 'dre_items', 'dre_categories'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`❌ Erro ao acessar tabela ${table}:`, error.message);
      } else {
        console.log(`✅ Tabela ${table} está acessível!`);
      }
    }
    
    console.log('\n🎉 Correção das pendências concluída!');
    console.log('\n📋 Resumo:');
    console.log('- Bucket "dre-files" verificado/criado');
    console.log('- Edge Functions verificadas');
    console.log('- Tabelas DRE verificadas');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
  }
}

fixDREIssues();