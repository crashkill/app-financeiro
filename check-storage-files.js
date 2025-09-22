import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorageFiles() {
  console.log('🔍 VERIFICANDO ARQUIVOS NO SUPABASE STORAGE');
  console.log('=' .repeat(50));
  
  try {
    // Listar buckets disponíveis
    console.log('\n📦 Listando buckets disponíveis...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
      return;
    }
    
    console.log('✅ Buckets encontrados:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    
    // Verificar se o bucket 'dre-files' existe
    const dreFilesBucket = buckets.find(bucket => bucket.name === 'dre-files');
    
    if (!dreFilesBucket) {
      console.log('\n⚠️ Bucket "dre-files" não encontrado!');
      console.log('💡 O bucket precisa ser criado primeiro.');
      return;
    }
    
    console.log('\n✅ Bucket "dre-files" encontrado!');
    console.log(`   Tipo: ${dreFilesBucket.public ? 'Público' : 'Privado'}`);
    
    // Listar arquivos no bucket dre-files
    console.log('\n📁 Listando arquivos no bucket "dre-files"...');
    const { data: files, error: filesError } = await supabase.storage
      .from('dre-files')
      .list('', {
        limit: 100,
        offset: 0
      });
    
    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError.message);
      return;
    }
    
    if (files.length === 0) {
      console.log('📭 Nenhum arquivo encontrado na raiz do bucket.');
    } else {
      console.log(`📄 ${files.length} item(ns) encontrado(s) na raiz:`);
      files.forEach(file => {
        const type = file.metadata ? 'arquivo' : 'pasta';
        const size = file.metadata?.size ? `(${Math.round(file.metadata.size / 1024)} KB)` : '';
        console.log(`   - ${file.name} [${type}] ${size}`);
      });
    }
    
    // Listar arquivos na pasta uploads/
    console.log('\n📁 Listando arquivos na pasta "uploads/"...');
    const { data: uploadsFiles, error: uploadsError } = await supabase.storage
      .from('dre-files')
      .list('uploads', {
        limit: 100,
        offset: 0
      });
    
    if (uploadsError) {
      console.log('⚠️ Pasta "uploads" não encontrada ou erro:', uploadsError.message);
    } else if (uploadsFiles.length === 0) {
      console.log('📭 Nenhum arquivo encontrado na pasta "uploads/".');
    } else {
      console.log(`📄 ${uploadsFiles.length} arquivo(s) encontrado(s) em "uploads/":`);
      uploadsFiles.forEach(file => {
        const size = file.metadata?.size ? `(${Math.round(file.metadata.size / 1024)} KB)` : '';
        const date = file.updated_at ? new Date(file.updated_at).toLocaleString('pt-BR') : 'Data desconhecida';
        console.log(`   - ${file.name} ${size} - ${date}`);
      });
    }
    
    console.log('\n🔗 Para acessar os arquivos no dashboard do Supabase:');
    console.log(`   1. Acesse: ${supabaseUrl.replace('/rest/v1', '')}/project/default/storage/buckets`);
    console.log('   2. Clique no bucket "dre-files"');
    console.log('   3. Navegue para a pasta "uploads/"');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkStorageFiles();