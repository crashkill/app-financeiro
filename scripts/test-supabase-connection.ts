import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const projectId = process.env.VITE_SUPABASE_PROJECT_ID!;

async function testSupabaseConnection() {
  console.log('🔍 Testando conectividade com Supabase...');
  console.log('📋 Configurações:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Project ID: ${projectId}`);
  console.log(`   ANON Key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log(`   Service Role Key: ${supabaseServiceRoleKey.substring(0, 20)}...`);
  console.log('');

  try {
    // Teste com ANON key
    console.log('🔑 Testando conexão com ANON key...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('secrets')
      .select('count')
      .limit(1);
    
    if (anonError) {
      console.log('❌ Erro com ANON key:', anonError.message);
    } else {
      console.log('✅ Conexão com ANON key funcionando!');
    }

    // Teste com Service Role key
    console.log('🔑 Testando conexão com Service Role key...');
    const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('secrets')
      .select('count')
      .limit(1);
    
    if (serviceError) {
      console.log('❌ Erro com Service Role key:', serviceError.message);
    } else {
      console.log('✅ Conexão com Service Role key funcionando!');
    }

    // Teste de autenticação
    console.log('🔐 Testando autenticação...');
    const { data: authData, error: authError } = await supabaseAnon.auth.getSession();
    
    if (authError) {
      console.log('❌ Erro na autenticação:', authError.message);
    } else {
      console.log('✅ Sistema de autenticação funcionando!');
    }

    console.log('');
    console.log('🎉 Teste de conectividade concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testSupabaseConnection().catch(console.error);