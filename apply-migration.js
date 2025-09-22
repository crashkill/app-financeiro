require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAutomationExecutionsTable() {
  console.log('🔧 Criando tabela automation_executions...');
  
  try {
    // Primeiro, verificar se a tabela já existe
    console.log('🔍 Verificando se a tabela já existe...');
    
    const { data: existingTable, error: checkError } = await supabase
      .from('automation_executions')
      .select('count', { count: 'exact', head: true });
    
    if (!checkError) {
      console.log('✅ Tabela automation_executions já existe!');
      console.log(`📊 Registros existentes: ${existingTable}`);
      return;
    }
    
    console.log('📝 Tabela não existe, criando...');
    
    // Criar a tabela usando uma abordagem alternativa
    // Vamos tentar inserir um registro para forçar a criação da tabela
    const testRecord = {
      execution_id: crypto.randomUUID(),
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      records_processed: 0,
      records_imported: 0,
      success: true,
      function_name: 'test_table_creation'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('automation_executions')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.log('❌ Tabela não existe e não pode ser criada automaticamente');
      console.log('📋 Erro:', insertError.message);
      
      // Vamos tentar uma abordagem manual
      console.log('🔧 Tentando criar tabela manualmente...');
      
      // Usar a API REST diretamente
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/create_automation_executions_table`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        console.log('❌ Não foi possível criar a tabela via RPC');
        
        // Última tentativa: mostrar instruções para criação manual
        console.log('');
        console.log('📋 INSTRUÇÕES PARA CRIAÇÃO MANUAL:');
        console.log('1. Acesse o SQL Editor do Supabase Dashboard');
        console.log('2. Execute o seguinte SQL:');
        console.log('');
        console.log(`
CREATE TABLE IF NOT EXISTS automation_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    records_processed INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    file_name TEXT,
    file_size BIGINT,
    execution_time INTEGER,
    error_message TEXT,
    success BOOLEAN DEFAULT false,
    function_name TEXT DEFAULT 'hitss_automation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_automation_executions_execution_id ON automation_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_started_at ON automation_executions(started_at);

-- Conceder permissões
GRANT SELECT ON automation_executions TO anon, authenticated;
GRANT ALL PRIVILEGES ON automation_executions TO service_role;

-- Habilitar RLS
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Allow public read access to automation executions" ON automation_executions
    FOR SELECT USING (true);
        `);
        console.log('');
        
      } else {
        console.log('✅ Tabela criada via RPC!');
      }
      
    } else {
      console.log('✅ Tabela automation_executions criada com sucesso!');
      console.log('📊 Registro de teste inserido:', insertData);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Função para testar se a tabela funciona
async function testTable() {
  console.log('');
  console.log('🧪 Testando acesso à tabela automation_executions...');
  
  try {
    const { data, error } = await supabase
      .from('automation_executions')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela:', error.message);
    } else {
      console.log('✅ Tabela acessível!');
      console.log(`📊 Registros encontrados: ${data.length}`);
      if (data.length > 0) {
        console.log('📋 Últimos registros:');
        data.forEach((record, index) => {
          console.log(`${index + 1}. ${record.function_name} - ${record.status} - ${record.started_at}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar
console.log('🚀 Iniciando correção da tabela automation_executions...');
createAutomationExecutionsTable().then(() => {
  testTable();
});