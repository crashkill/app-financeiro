import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🚀 Debug - Teste Básico de Conectividade');
console.log('=' .repeat(50));

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('📋 Configurações:');
console.log(`URL Supabase: ${supabaseUrl}`);
console.log(`Chave Anon: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

console.log('🔗 Criando cliente Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Cliente Supabase criado');

// Teste básico de conectividade
async function testConnection() {
  try {
    console.log('🧪 Testando conectividade básica...');
    
    // Teste simples - listar buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erro na conectividade:', error.message);
      return false;
    }
    
    console.log('✅ Conectividade OK');
    console.log('📦 Buckets encontrados:', buckets.map(b => b.name));
    
    return true;
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    return false;
  }
}

// Teste de tabelas
async function testTables() {
  try {
    console.log('\n🗄️ Testando acesso às tabelas...');
    
    const tables = ['vault', 'dre_reports', 'dre_items'];
    
    for (const table of tables) {
      try {
        console.log(`   🔍 Testando tabela: ${table}`);
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: ${count || 0} registros`);
        }
      } catch (err) {
        console.log(`   ⚠️ ${table}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Erro no teste de tabelas:', error.message);
  }
}

// Função principal
async function main() {
  console.log('\n🎯 Iniciando testes...');
  
  const connectionOk = await testConnection();
  
  if (connectionOk) {
    await testTables();
  }
  
  console.log('\n🏁 Teste concluído!');
}

// Executar
main().catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});