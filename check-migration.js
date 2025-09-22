const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

// Cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para verificar se a função existe
async function checkFunction() {
  try {
    console.log('🔍 Verificando se a função process_dre_upload_webhook existe...');
    
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          p.proname as function_name,
          p.prosrc as function_body,
          n.nspname as schema_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'process_dre_upload_webhook'
        AND n.nspname = 'public';
      `
    });
    
    if (error) {
      console.error('❌ Erro ao verificar função:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Função process_dre_upload_webhook encontrada!');
      console.log('📄 Detalhes da função:', data[0]);
      return true;
    } else {
      console.log('❌ Função process_dre_upload_webhook NÃO encontrada!');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar função:', error);
    return false;
  }
}

// Função para verificar se o trigger existe
async function checkTrigger() {
  try {
    console.log('\n🔍 Verificando se o trigger process_dre_upload_webhook existe...');
    
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          t.tgname as trigger_name,
          c.relname as table_name,
          n.nspname as schema_name,
          t.tgenabled as enabled
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE t.tgname = 'process_dre_upload_webhook'
        AND c.relname = 'objects'
        AND n.nspname = 'storage';
      `
    });
    
    if (error) {
      console.error('❌ Erro ao verificar trigger:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Trigger process_dre_upload_webhook encontrado!');
      console.log('📄 Detalhes do trigger:', data[0]);
      return true;
    } else {
      console.log('❌ Trigger process_dre_upload_webhook NÃO encontrado!');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar trigger:', error);
    return false;
  }
}

// Função para verificar permissões da função net.http_post
async function checkHttpExtension() {
  try {
    console.log('\n🔍 Verificando extensão http e permissões...');
    
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          extname as extension_name,
          extversion as version
        FROM pg_extension 
        WHERE extname = 'http';
      `
    });
    
    if (error) {
      console.error('❌ Erro ao verificar extensão http:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Extensão http encontrada!');
      console.log('📄 Detalhes da extensão:', data[0]);
      return true;
    } else {
      console.log('❌ Extensão http NÃO encontrada!');
      console.log('⚠️ A extensão http é necessária para fazer chamadas HTTP da função');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar extensão http:', error);
    return false;
  }
}

// Função para verificar se há registros recentes na tabela storage.objects
async function checkRecentUploads() {
  try {
    console.log('\n🔍 Verificando uploads recentes no bucket dre_reports...');
    
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          name,
          bucket_id,
          created_at,
          updated_at
        FROM storage.objects 
        WHERE bucket_id = 'dre_reports'
        AND created_at > NOW() - INTERVAL '1 hour'
        ORDER BY created_at DESC
        LIMIT 5;
      `
    });
    
    if (error) {
      console.error('❌ Erro ao verificar uploads recentes:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Uploads recentes encontrados:');
      data.forEach((upload, index) => {
        console.log(`${index + 1}. ${upload.name} - ${upload.created_at}`);
      });
      return true;
    } else {
      console.log('❌ Nenhum upload recente encontrado no bucket dre_reports');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar uploads recentes:', error);
    return false;
  }
}

// Função principal
async function checkMigration() {
  console.log('🔍 VERIFICANDO STATUS DA MIGRAÇÃO SQL\n');
  
  const results = {
    function: false,
    trigger: false,
    httpExtension: false,
    recentUploads: false
  };
  
  try {
    results.function = await checkFunction();
    results.trigger = await checkTrigger();
    results.httpExtension = await checkHttpExtension();
    results.recentUploads = await checkRecentUploads();
    
    console.log('\n📊 RESUMO DA VERIFICAÇÃO:');
    console.log('================================');
    console.log(`Função process_dre_upload_webhook: ${results.function ? '✅ OK' : '❌ FALTANDO'}`);
    console.log(`Trigger process_dre_upload_webhook: ${results.trigger ? '✅ OK' : '❌ FALTANDO'}`);
    console.log(`Extensão HTTP: ${results.httpExtension ? '✅ OK' : '❌ FALTANDO'}`);
    console.log(`Uploads recentes: ${results.recentUploads ? '✅ OK' : '❌ NENHUM'}`);
    
    const allOk = Object.values(results).every(result => result);
    
    if (allOk) {
      console.log('\n🎉 MIGRAÇÃO APLICADA COM SUCESSO!');
      console.log('✅ Todos os componentes estão funcionando corretamente.');
    } else {
      console.log('\n⚠️ MIGRAÇÃO INCOMPLETA!');
      console.log('❌ Alguns componentes estão faltando ou não funcionando.');
      console.log('\n💡 PRÓXIMOS PASSOS:');
      if (!results.function || !results.trigger) {
        console.log('1. Aplicar a migração SQL no Dashboard do Supabase');
        console.log('2. Executar o conteúdo do arquivo: 20250119_setup_storage_webhook_for_dre_upload_production.sql');
      }
      if (!results.httpExtension) {
        console.log('3. Habilitar a extensão HTTP no Supabase (pode requerer suporte)');
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE A VERIFICAÇÃO:', error);
  }
}

// Executar verificação
checkMigration().catch(console.error);