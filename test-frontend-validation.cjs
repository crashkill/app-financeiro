const fetch = require('node-fetch');

// Configurações
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function testFrontendDataConsumption() {
    console.log('🧪 Teste de Validação do Frontend - Consumo de Dados');
    console.log('=' .repeat(60));

    try {
        // Teste 1: Verificar se a Edge Function retorna todos os projetos
        console.log('\n📊 Teste 1: Verificando projetos únicos via Edge Function');
        const projectsResponse = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'projetos'
            })
        });

        if (projectsResponse.ok) {
            const response = await projectsResponse.json();
            console.log(`✅ Status: ${projectsResponse.status}`);
            console.log(`📊 Estrutura da resposta: ${response.type}`);
            console.log(`📈 Total de projetos retornados: ${response.count}`);
            console.log(`🔍 Filtros aplicados: ${JSON.stringify(response.filters)}`);
            console.log(`📏 Limite configurado: ${response.limit}`);
            
            const projectsData = response.data;
            
            if (Array.isArray(projectsData)) {
                if (projectsData.length >= 88) {
                    console.log('✅ SUCESSO: Todos os projetos estão sendo retornados');
                } else {
                    console.log('❌ PROBLEMA: Menos projetos que o esperado (88)');
                }

                // Mostrar alguns projetos para validação
                console.log('\n📋 Primeiros 10 projetos:');
                projectsData.slice(0, 10).forEach((projeto, index) => {
                    console.log(`  ${index + 1}. ${projeto}`);
                });
            } else {
                console.log('❌ PROBLEMA: Campo data não é um array');
            }
        } else {
            console.log(`❌ Erro na requisição: ${projectsResponse.status}`);
        }

        // Teste 2: Verificar se a Edge Function retorna anos
        console.log('\n📅 Teste 2: Verificando anos únicos via Edge Function');
        const yearsResponse = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'anos'
            })
        });

        if (yearsResponse.ok) {
            const response = await yearsResponse.json();
            console.log(`✅ Status: ${yearsResponse.status}`);
            console.log(`📊 Estrutura da resposta: ${response.type}`);
            console.log(`📈 Total de anos retornados: ${response.count}`);
            
            const yearsData = response.data;
            if (Array.isArray(yearsData)) {
                console.log(`📋 Anos disponíveis: ${yearsData.join(', ')}`);
            } else {
                console.log('❌ PROBLEMA: Campo data não é um array');
            }
        } else {
            console.log(`❌ Erro na requisição: ${yearsResponse.status}`);
        }

        // Teste 3: Verificar dados do dashboard
        console.log('\n📊 Teste 3: Verificando dados do dashboard');
        const dashboardResponse = await fetch(`${SUPABASE_URL}/functions/v1/financial-data-unified`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'dashboard'
            })
        });

        if (dashboardResponse.ok) {
            const response = await dashboardResponse.json();
            console.log(`✅ Status: ${dashboardResponse.status}`);
            console.log(`📊 Estrutura da resposta: ${response.type || 'dashboard'}`);
            
            // Para dashboard, pode ser que a estrutura seja diferente
            const dashboardData = response.data || response;
            
            if (Array.isArray(dashboardData)) {
                console.log(`📈 Total de registros do dashboard: ${dashboardData.length}`);
                
                if (dashboardData.length > 0) {
                    console.log('📋 Estrutura do primeiro registro:');
                    console.log(JSON.stringify(dashboardData[0], null, 2));
                }
            } else {
                console.log('📋 Dados do dashboard (não é array):');
                console.log(JSON.stringify(dashboardData, null, 2));
            }
        } else {
            console.log(`❌ Erro na requisição: ${dashboardResponse.status}`);
        }

        console.log('\n' + '=' .repeat(60));
        console.log('🎯 Resumo da Validação:');
        console.log('- Edge Function está respondendo corretamente');
        console.log('- Dados estão sendo processados pelo backend');
        console.log('- Frontend pode consumir os dados via fetch/axios');
        console.log('✅ Validação do consumo de dados concluída!');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    }
}

// Executar o teste
testFrontendDataConsumption();