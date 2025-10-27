// Teste simples da funcionalidade de exclusão de profissionais
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function testProfissionaisExclusao() {
    console.log('🧪 Iniciando testes de exclusão de profissionais...\n');
    
    try {
        // 1. Listar profissionais existentes
        console.log('📋 1. Listando profissionais existentes...');
        const listResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!listResponse.ok) {
            throw new Error(`Erro na listagem: ${listResponse.status} - ${listResponse.statusText}`);
        }
        
        const profissionais = await listResponse.json();
        console.log('📊 Resposta da API:', profissionais);
        console.log('📊 Tipo da resposta:', typeof profissionais);
        console.log('📊 É array?', Array.isArray(profissionais));
        console.log(`✅ Encontrados ${profissionais?.length || 0} profissionais`);
        
        if (profissionais.length === 0) {
            console.log('⚠️ Nenhum profissional encontrado. Criando um para teste...');
            
            // Criar um profissional para teste
            const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: 'Teste Exclusão',
                    email: `teste.exclusao.${Date.now()}@teste.com`,
                    tecnologias: ['JavaScript', 'React'],
                    proficiencia_cargo: 'Pleno',
                    projeto_atual: 'Projeto Teste'
                })
            });
            
            if (!createResponse.ok) {
                throw new Error(`Erro na criação: ${createResponse.status} - ${createResponse.statusText}`);
            }
            
            const novoProfissional = await createResponse.json();
            console.log(`✅ Profissional criado: ${novoProfissional.nome} (ID: ${novoProfissional.id})`);
            
            // Atualizar lista
            const newListResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const updatedProfissionais = await newListResponse.json();
            profissionais.push(...updatedProfissionais);
        }
        
        // 2. Testar exclusão básica
        if (profissionais.length > 0) {
            const profissionalParaExcluir = profissionais[0];
            console.log(`\n🗑️ 2. Testando exclusão do profissional: ${profissionalParaExcluir.nome} (ID: ${profissionalParaExcluir.id})`);
            
            const deleteResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: profissionalParaExcluir.id
                })
            });
            
            if (!deleteResponse.ok) {
                throw new Error(`Erro na exclusão: ${deleteResponse.status} - ${deleteResponse.statusText}`);
            }
            
            const deleteResult = await deleteResponse.json();
            console.log('✅ Resposta da exclusão:', deleteResult);
            
            // 3. Verificar se o profissional foi removido da listagem
            console.log('\n🔍 3. Verificando se o profissional foi removido da listagem...');
            const verifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const profissionaisAposExclusao = await verifyResponse.json();
            const profissionalEncontrado = profissionaisAposExclusao.find(p => p.id === profissionalParaExcluir.id);
            
            if (profissionalEncontrado) {
                console.log('❌ ERRO: Profissional ainda aparece na listagem após exclusão!');
                console.log('Profissional encontrado:', profissionalEncontrado);
            } else {
                console.log('✅ SUCESSO: Profissional removido da listagem corretamente');
            }
            
            console.log(`📊 Profissionais antes da exclusão: ${profissionais.length}`);
            console.log(`📊 Profissionais após exclusão: ${profissionaisAposExclusao.length}`);
        }
        
        console.log('\n🎉 Teste de exclusão básica concluído!');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Executar o teste
testProfissionaisExclusao();