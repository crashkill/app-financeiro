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

async function listAllFiles(bucketName, folder = '', level = 0) {
  const indent = '  '.repeat(level);
  
  try {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(folder, {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      console.log(`${indent}❌ Erro ao listar ${folder || 'raiz'}: ${error.message}`);
      return;
    }
    
    if (files.length === 0) {
      console.log(`${indent}📭 Pasta vazia: ${folder || 'raiz'}`);
      return;
    }
    
    for (const file of files) {
      if (file.metadata) {
        // É um arquivo
        const size = file.metadata.size ? `(${Math.round(file.metadata.size / 1024)} KB)` : '';
        const date = file.updated_at ? new Date(file.updated_at).toLocaleString('pt-BR') : '';
        console.log(`${indent}📄 ${file.name} ${size} - ${date}`);
      } else {
        // É uma pasta
        console.log(`${indent}📁 ${file.name}/`);
        if (level < 3) { // Limitar profundidade para evitar loops
          const subFolder = folder ? `${folder}/${file.name}` : file.name;
          await listAllFiles(bucketName, subFolder, level + 1);
        }
      }
    }
  } catch (error) {
    console.log(`${indent}❌ Erro geral: ${error.message}`);
  }
}

async function checkAllStorageLocations() {
  console.log('🔍 VERIFICAÇÃO COMPLETA DO SUPABASE STORAGE');
  console.log('=' .repeat(60));
  
  try {
    // Listar todos os buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
      return;
    }
    
    console.log(`\n📦 ${buckets.length} bucket(s) encontrado(s):\n`);
    
    for (const bucket of buckets) {
      console.log(`🗂️  BUCKET: ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      console.log('─'.repeat(40));
      
      await listAllFiles(bucket.name);
      console.log('');
    }
    
    // Verificar especificamente arquivos DRE recentes
    console.log('\n🔍 PROCURANDO ARQUIVOS DRE ESPECÍFICOS...');
    console.log('─'.repeat(40));
    
    // Verificar no bucket dre-files
    console.log('\n📋 Verificando bucket "dre-files" em detalhes:');
    
    // Tentar diferentes caminhos possíveis
    const possiblePaths = ['', 'uploads', 'dre', 'files', 'data', 'excel'];
    
    for (const path of possiblePaths) {
      console.log(`\n🔍 Verificando caminho: "${path || 'raiz'}"`);      
      const { data: files, error } = await supabase.storage
        .from('dre-files')
        .list(path, { limit: 50 });
      
      if (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      } else if (files.length === 0) {
        console.log(`   📭 Vazio`);
      } else {
        console.log(`   ✅ ${files.length} item(ns) encontrado(s):`);
        files.forEach(file => {
          const type = file.metadata ? '📄' : '📁';
          const size = file.metadata?.size ? ` (${Math.round(file.metadata.size / 1024)} KB)` : '';
          const date = file.updated_at ? ` - ${new Date(file.updated_at).toLocaleString('pt-BR')}` : '';
          console.log(`      ${type} ${file.name}${size}${date}`);
        });
      }
    }
    
    // Verificar outros buckets que podem conter arquivos DRE
    console.log('\n🔍 Verificando outros buckets para arquivos DRE...');
    
    const otherBuckets = ['dre_reports', 'hitss-files'];
    for (const bucketName of otherBuckets) {
      if (buckets.find(b => b.name === bucketName)) {
        console.log(`\n📋 Bucket "${bucketName}":`);
        await listAllFiles(bucketName, '', 1);
      }
    }
    
    console.log('\n🔗 LINKS DIRETOS PARA ACESSAR:');
    console.log(`   Dashboard Storage: ${supabaseUrl.replace('/rest/v1', '')}/project/default/storage/buckets`);
    console.log(`   Bucket dre-files: ${supabaseUrl.replace('/rest/v1', '')}/project/default/storage/buckets/dre-files`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkAllStorageLocations();