/**
 * Teste de Conectividade Simples - VERSÃO ATUALIZADA
 * Verifica se a Edge Function está acessível
 */

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

console.log('🔍 TESTE DE CONECTIVIDADE SIMPLES');
console.log('=================================');

async function testarConectividade() {
    console.log('📡 Testando conectividade básica...\n');
    
    // Teste 1: Verificar se o Supabase está acessível
    try {
        console.log('1️⃣ Testando acesso ao Supabase...');
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY
            }
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   ✅ Supabase acessível: ${response.ok ? 'SIM' : 'NÃO'}\n`);
        
    } catch (error) {
        console.log(`   ❌ Erro ao acessar Supabase: ${error.message}\n`);
    }
    
    // Teste 2: Verificar se a Edge Function existe
    try {
        console.log('2️⃣ Testando Edge Function gestao-profissionais...');
        const response = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais/list`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Status Text: ${response.statusText}`);
        
        if (response.status === 401) {
            console.log('   ⚠️ Erro de autenticação - JWT pode estar inválido');
        } else if (response.status === 404) {
            console.log('   ⚠️ Edge Function não encontrada');
        } else if (response.ok) {
            console.log('   ✅ Edge Function acessível');
            const data = await response.json();
            console.log(`   📊 Resposta: ${JSON.stringify(data, null, 2)}`);
        } else {
            console.log('   ❌ Erro desconhecido');
            const text = await response.text();
            console.log(`   📋 Resposta: ${text}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro ao acessar Edge Function: ${error.message}`);
    }
    
    console.log('\n=================================');
    console.log('📋 CONCLUSÃO:');
    console.log('Se você vê "JWT inválido", a Edge Function existe mas precisa de autenticação.');
    console.log('Se você vê "404", a Edge Function não foi implantada.');
    console.log('Se você vê "200", tudo está funcionando perfeitamente!');
    console.log('=================================');
}

testarConectividade();