// Script para testar a Edge Function de gestão de profissionais
// Usando fetch nativo do Node.js 18+

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

async function testEdgeFunction() {
  console.log('🧪 Testando Edge Function de gestão de profissionais...\n');

  // 1. Criar um profissional de teste
  console.log('1. Criando profissional de teste...');
  
  // Primeiro, vamos listar os profissionais existentes
  console.log('0. Listando profissionais existentes...');
  const listResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });

  const listResult = await listResponse.text();
  console.log('Resposta da listagem inicial:', listResult);

  const novoProfissional = {
    nome: 'João Silva Teste ' + Date.now(),
    email: 'joao.teste.' + Date.now() + '@exemplo.com',
    telefone: '(11) 99999-0001',
    departamento: 'TI',
    cargo: 'Desenvolvedor',
    regime_trabalho: 'CLT',
    local_alocacao: 'Remoto'
  };

  try {
    const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(novoProfissional)
    });

    const createResult = await createResponse.text();
    console.log('Resposta da criação:', createResult);

    if (createResponse.ok) {
      console.log('✅ Profissional criado com sucesso!');
      
      // Tentar extrair o ID do profissional criado
      let profissionalId = null;
      try {
        const parsed = JSON.parse(createResult);
        if (parsed.data && parsed.data.id) {
          profissionalId = parsed.data.id;
          console.log(`ID do profissional criado: ${profissionalId}`);
        }
      } catch (e) {
        console.log('Não foi possível extrair o ID do profissional');
      }

      // 2. Listar profissionais
      console.log('\n2. Listando profissionais...');
      const listResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });

      const listResult = await listResponse.text();
      console.log('Resposta da listagem:', listResult);

      if (listResponse.ok) {
        console.log('✅ Listagem realizada com sucesso!');
        
        // Tentar extrair profissionais da resposta
        try {
          const parsed = JSON.parse(listResult);
          if (parsed.data && Array.isArray(parsed.data)) {
            console.log(`📊 Total de profissionais encontrados: ${parsed.data.length}`);
            
            // Se temos profissionais e conseguimos extrair um ID, vamos testar a exclusão
            if (parsed.data.length > 0 && profissionalId) {
              console.log('\n3. Testando exclusão...');
              
              const deleteResponse = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: profissionalId })
              });

              const deleteResult = await deleteResponse.text();
              console.log('Resposta da exclusão:', deleteResult);

              if (deleteResponse.ok) {
                console.log('✅ Exclusão realizada com sucesso!');
              } else {
                console.log('❌ Erro na exclusão');
              }
            }
          }
        } catch (e) {
          console.log('Erro ao processar resposta da listagem:', e.message);
        }
      } else {
        console.log('❌ Erro na listagem');
      }
    } else {
      console.log('❌ Erro na criação');
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }

  console.log('\n🎯 Teste da Edge Function concluído!');
}

testEdgeFunction().catch(console.error);