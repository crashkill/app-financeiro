const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testAutomationService() {
  console.log('🧪 Testando componentes do serviço de automação...\n');
  
  try {
    // 1. Testar acesso às credenciais
    console.log('1️⃣ Testando acesso às credenciais...');
    const { data: usernameData, error: usernameError } = await supabase.rpc('get_secret', { 
      secret_name: 'hitss_username' 
    });
    
    if (usernameError) {
      console.error('❌ Erro ao obter username:', usernameError);
      return;
    }
    
    console.log('✅ Username obtido:', usernameData);
    
    // 2. Testar inserção na tabela automation_executions
    console.log('\n2️⃣ Testando inserção na tabela automation_executions...');
    const { data: executionData, error: executionError } = await supabase
      .from('automation_executions')
      .insert({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (executionError) {
      console.error('❌ Erro ao inserir execução:', executionError);
      return;
    }
    
    console.log('✅ Execução inserida:', executionData.id);
    
    // 3. Testar atualização da execução
    console.log('\n3️⃣ Testando atualização da execução...');
    const { error: updateError } = await supabase
      .from('automation_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        records_processed: 5,
        records_failed: 0
      })
      .eq('id', executionData.id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar execução:', updateError);
      return;
    }
    
    console.log('✅ Execução atualizada com sucesso');
    
    // 4. Verificar se a execução foi atualizada corretamente
    console.log('\n4️⃣ Verificando execução atualizada...');
    const { data: updatedExecution, error: fetchError } = await supabase
      .from('automation_executions')
      .select('*')
      .eq('id', executionData.id)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar execução:', fetchError);
      return;
    }
    
    console.log('✅ Execução verificada:', {
      id: updatedExecution.id,
      status: updatedExecution.status,
      records_processed: updatedExecution.records_processed,
      records_failed: updatedExecution.records_failed
    });
    
    console.log('\n🎉 Todos os testes passaram! O problema deve estar no HITSSAutomationService.');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testAutomationService();