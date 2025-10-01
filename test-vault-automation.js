const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testVaultAutomation() {
  console.log('🧪 Testando automação HITSS com credenciais do Vault...')
  
  try {
    // 1. Verificar se as credenciais estão no Vault
    console.log('\n1️⃣ Verificando credenciais no Vault...')
    
    const { data: secrets, error: secretsError } = await supabase
      .from('vault.decrypted_secrets')
      .select('name, decrypted_secret')
      .in('name', ['HITSS_USERNAME', 'HITSS_PASSWORD', 'HITSS_BASE_URL'])
    
    if (secretsError) {
      console.error('❌ Erro ao buscar segredos:', secretsError)
      return
    }
    
    if (!secrets || secrets.length === 0) {
      console.error('❌ Nenhuma credencial encontrada no Vault')
      return
    }
    
    console.log(`✅ Encontradas ${secrets.length} credenciais no Vault:`)
    secrets.forEach(secret => {
      const maskedValue = secret.name === 'HITSS_PASSWORD' 
        ? '*'.repeat(secret.decrypted_secret.length)
        : secret.decrypted_secret
      console.log(`   - ${secret.name}: ${maskedValue}`)
    })
    
    // 2. Testar a Edge Function
    console.log('\n2️⃣ Testando Edge Function...')
    
    const { data: functionResult, error: functionError } = await supabase.functions.invoke('hitss-automation', {
      body: { test: true }
    })
    
    if (functionError) {
      console.error('❌ Erro na Edge Function:', functionError)
      return
    }
    
    console.log('✅ Edge Function executada com sucesso!')
    console.log('📊 Resultado:', JSON.stringify(functionResult, null, 2))
    
    // 3. Verificar logs de execução
    console.log('\n3️⃣ Verificando logs de execução...')
    
    const { data: executions, error: executionsError } = await supabase
      .from('automation_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (executionsError) {
      console.error('❌ Erro ao buscar execuções:', executionsError)
      return
    }
    
    console.log(`✅ Últimas ${executions.length} execuções:`)
    executions.forEach((exec, index) => {
      console.log(`\n   ${index + 1}. ID: ${exec.id}`)
      console.log(`      Status: ${exec.status}`)
      console.log(`      Criado: ${exec.created_at}`)
      console.log(`      Completado: ${exec.completed_at || 'N/A'}`)
      console.log(`      Registros: ${exec.records_processed || 0}`)
      if (exec.error_message) {
        console.log(`      Erro: ${exec.error_message}`)
      }
    })
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Executar teste
testVaultAutomation()