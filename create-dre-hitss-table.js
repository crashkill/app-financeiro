import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDreHitssTable() {
  console.log('🔧 Criando tabela dre_hitss com a estrutura correta...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS dre_hitss (
      id BIGSERIAL PRIMARY KEY,
      execution_id TEXT NOT NULL,
      conta TEXT,
      descricao TEXT,
      valor DECIMAL(15,2),
      tipo TEXT,
      periodo TEXT,
      empresa TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Criar índices para melhor performance
    CREATE INDEX IF NOT EXISTS idx_dre_hitss_execution_id ON dre_hitss(execution_id);
    CREATE INDEX IF NOT EXISTS idx_dre_hitss_empresa ON dre_hitss(empresa);
    CREATE INDEX IF NOT EXISTS idx_dre_hitss_periodo ON dre_hitss(periodo);
    CREATE INDEX IF NOT EXISTS idx_dre_hitss_created_at ON dre_hitss(created_at);
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (error) {
      console.log('❌ Erro ao criar tabela via RPC:', error.message);
      console.log('🔄 Tentando criar via SQL direto...');
      
      // Tentar criar via SQL direto
      const { error: directError } = await supabase
        .from('_sql')
        .select('*')
        .limit(0);
        
      console.log('⚠️ Não foi possível criar a tabela automaticamente.');
      console.log('📋 Execute este SQL manualmente no Supabase Dashboard:');
      console.log('\n' + createTableSQL);
      
    } else {
      console.log('✅ Tabela dre_hitss criada com sucesso!');
      console.log('📊 Dados retornados:', data);
    }
    
  } catch (err) {
    console.log('❌ Erro na criação da tabela:', err.message);
    console.log('📋 Execute este SQL manualmente no Supabase Dashboard:');
    console.log('\n' + createTableSQL);
  }
  
  // Testar a estrutura da tabela
  console.log('\n🔍 Testando inserção na tabela...');
  
  const testData = {
    execution_id: 'test-' + Date.now(),
    conta: '1.01.001',
    descricao: 'Receita de Vendas',
    valor: 1000.50,
    tipo: 'RECEITA',
    periodo: '2024-12',
    empresa: 'HITSS',
    created_at: new Date().toISOString()
  };
  
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('dre_hitss')
      .insert([testData])
      .select();
      
    if (insertError) {
      console.log('❌ Erro na inserção de teste:', insertError.message);
      console.log('📋 Detalhes:', insertError);
    } else {
      console.log('✅ Inserção de teste bem-sucedida!');
      console.log('📊 Dados inseridos:', insertData);
      
      // Limpar dados de teste
      await supabase
        .from('dre_hitss')
        .delete()
        .eq('execution_id', testData.execution_id);
      console.log('🗑️ Dados de teste removidos');
    }
    
  } catch (testError) {
    console.log('❌ Erro no teste:', testError.message);
  }
}

createDreHitssTable();