// Script para verificar dados na base
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function checkData() {
    console.log('🔍 Verificando dados na base...');
    
    try {
        // 1. Verificar Edge Function
        console.log('📡 Testando Edge Function...');
        const edgeResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Status da Edge Function:', edgeResponse.status);
        console.log('📊 Headers da resposta:', Object.fromEntries(edgeResponse.headers.entries()));
        
        if (edgeResponse.ok) {
            const edgeData = await edgeResponse.json();
            console.log('✅ Edge Function funcionando:', edgeData);
            console.log('📊 Tipo de dados:', typeof edgeData);
            console.log('📊 É array?', Array.isArray(edgeData));
            console.log('📊 Quantidade:', edgeData?.length || 'N/A');
        } else {
            const errorText = await edgeResponse.text();
            console.log('❌ Erro na Edge Function:', errorText);
        }
        
        // 2. Verificar tabela diretamente
        console.log('\n🗄️ Testando acesso direto à tabela...');
        const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/profissionais?select=*&ativo=eq.true`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Status da tabela:', tableResponse.status);
        
        if (tableResponse.ok) {
            const tableData = await tableResponse.json();
            console.log('✅ Acesso direto à tabela funcionando:', tableData);
            console.log('📊 Quantidade na tabela:', tableData?.length || 0);
        } else {
            const errorText = await tableResponse.text();
            console.log('❌ Erro no acesso direto:', errorText);
        }
        
        // 3. Criar um profissional de teste se não houver dados
        if (edgeResponse.ok) {
            const edgeData = await edgeResponse.json();
            if (!edgeData || edgeData.length === 0) {
                console.log('\n➕ Criando profissional de teste...');
                
                const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nome: 'João Teste Exclusão',
                        email: `joao.teste.${Date.now()}@teste.com`,
                        tecnologias: ['JavaScript', 'React', 'Node.js'],
                        proficiencia_cargo: 'Pleno',
                        projeto_atual: 'Projeto Teste Exclusão',
                        regime: 'CLT',
                        local_alocacao: 'São Paulo'
                    })
                });
                
                if (createResponse.ok) {
                    const newProfissional = await createResponse.json();
                    console.log('✅ Profissional criado para teste:', newProfissional);
                } else {
                    const errorText = await createResponse.text();
                    console.log('❌ Erro ao criar profissional:', errorText);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

checkData();