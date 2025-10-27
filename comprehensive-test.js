// Script de teste abrangente para exclusão de profissionais
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, message) {
  const status = passed ? '✅ PASSOU' : '❌ FALHOU';
  console.log(`${status} - ${testName}: ${message}`);
  
  testResults.tests.push({ testName, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function makeRequest(method, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, options);
  const text = await response.text();
  
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { raw: text };
  }
  
  return { response, data, text };
}

async function runComprehensiveTests() {
  console.log('🧪 INICIANDO TESTES ABRANGENTES DE EXCLUSÃO DE PROFISSIONAIS\n');
  console.log('============================================================');

  // 1. TESTE DE LISTAGEM INICIAL
  console.log('\n📋 1. TESTE DE LISTAGEM INICIAL');
  try {
    const { response, data, text } = await makeRequest('GET');
    
    console.log(`Status da resposta: ${response.status}`);
    console.log(`Resposta raw: ${text.substring(0, 200)}...`);
    console.log(`Data parsed:`, data);
    
    if (response.ok && data.success && Array.isArray(data.data)) {
      logTest('Listagem inicial', true, `${data.data.length} profissionais encontrados`);
      
      if (data.data.length === 0) {
        console.log('⚠️  Nenhum profissional encontrado. Criando dados de teste...');
        
        // Criar um profissional de teste
        const novoProfissional = {
          nome: 'Teste Exclusão ' + Date.now(),
          email: 'teste.exclusao.' + Date.now() + '@exemplo.com',
          telefone: '(11) 99999-9999',
          departamento: 'TI',
          cargo: 'Desenvolvedor',
          regime_trabalho: 'CLT',
          local_alocacao: 'Remoto'
        };
        
        const { response: createResponse, data: createData } = await makeRequest('POST', novoProfissional);
        
        if (createResponse.ok && createData.success) {
          logTest('Criação de dados de teste', true, `Profissional criado: ${createData.data.id}`);
          data.data = [createData.data]; // Adicionar à lista para os próximos testes
        } else {
          logTest('Criação de dados de teste', false, createData.error?.message || 'Erro desconhecido');
          return;
        }
      }
      
      // Selecionar um profissional para testes
      const profissionalTeste = data.data[0];
      console.log(`\n🎯 Profissional selecionado para testes: ${profissionalTeste.nome} (ID: ${profissionalTeste.id})`);
      
      // 2. TESTE DE EXCLUSÃO BÁSICA
      console.log('\n🗑️  2. TESTE DE EXCLUSÃO BÁSICA');
      const { response: deleteResponse, data: deleteData } = await makeRequest('DELETE', { id: profissionalTeste.id });
      
      if (deleteResponse.ok && deleteData.success) {
        logTest('Exclusão básica', true, deleteData.message || 'Profissional excluído com sucesso');
        
        // Verificar se o profissional não aparece mais na listagem
        const { response: listAfterDelete, data: dataAfterDelete } = await makeRequest('GET');
        
        if (listAfterDelete.ok && dataAfterDelete.success) {
          const profissionalAindaExiste = dataAfterDelete.data.some(p => p.id === profissionalTeste.id);
          logTest('Verificação pós-exclusão', !profissionalAindaExiste, 
            profissionalAindaExiste ? 'Profissional ainda aparece na listagem' : 'Profissional removido da listagem');
        }
      } else {
        logTest('Exclusão básica', false, deleteData.error?.message || 'Erro na exclusão');
      }
      
      // 3. TESTE DE EDGE CASES
      console.log('\n⚠️  3. TESTE DE EDGE CASES');
      
      // 3.1 ID inexistente
      const { response: deleteInexistente, data: dataInexistente } = await makeRequest('DELETE', { id: '00000000-0000-0000-0000-000000000000' });
      logTest('ID inexistente', !deleteInexistente.ok || !dataInexistente.success, 
        dataInexistente.error?.message || 'Erro esperado para ID inexistente');
      
      // 3.2 ID inválido
      const { response: deleteInvalido, data: dataInvalido } = await makeRequest('DELETE', { id: 'id-invalido' });
      logTest('ID inválido', !deleteInvalido.ok || !dataInvalido.success, 
        dataInvalido.error?.message || 'Erro esperado para ID inválido');
      
      // 3.3 Sem ID
      const { response: deleteSemId, data: dataSemId } = await makeRequest('DELETE', {});
      logTest('Requisição sem ID', !deleteSemId.ok || !dataSemId.success, 
        dataSemId.error?.message || 'Erro esperado para requisição sem ID');
      
      // 3.4 Tentar excluir o mesmo profissional novamente
      const { response: deleteNovamente, data: dataNovamente } = await makeRequest('DELETE', { id: profissionalTeste.id });
      logTest('Exclusão duplicada', !deleteNovamente.ok || !dataNovamente.success, 
        dataNovamente.error?.message || 'Erro esperado para exclusão duplicada');
      
      // 4. TESTE DE MÚLTIPLAS EXCLUSÕES
      console.log('\n🔄 4. TESTE DE MÚLTIPLAS EXCLUSÕES');
      
      // Criar múltiplos profissionais de teste
      const profissionaisMultiplos = [];
      for (let i = 0; i < 3; i++) {
        const novoProfissional = {
          nome: `Teste Múltiplo ${i + 1} - ${Date.now()}`,
          email: `teste.multiplo.${i + 1}.${Date.now()}@exemplo.com`,
          telefone: `(11) 99999-000${i + 1}`,
          departamento: 'TI',
          cargo: 'Desenvolvedor',
          regime_trabalho: 'CLT',
          local_alocacao: 'Remoto'
        };
        
        const { response: createResponse, data: createData } = await makeRequest('POST', novoProfissional);
        
        if (createResponse.ok && createData.success) {
          profissionaisMultiplos.push(createData.data);
        }
      }
      
      logTest('Criação de múltiplos profissionais', profissionaisMultiplos.length === 3, 
        `${profissionaisMultiplos.length}/3 profissionais criados`);
      
      // Excluir todos em sequência
      let exclusoesRealizadas = 0;
      for (const prof of profissionaisMultiplos) {
        const { response: deleteResponse, data: deleteData } = await makeRequest('DELETE', { id: prof.id });
        if (deleteResponse.ok && deleteData.success) {
          exclusoesRealizadas++;
        }
      }
      
      logTest('Múltiplas exclusões', exclusoesRealizadas === profissionaisMultiplos.length, 
        `${exclusoesRealizadas}/${profissionaisMultiplos.length} exclusões realizadas`);
      
      // 5. TESTE DE PERFORMANCE
      console.log('\n⚡ 5. TESTE DE PERFORMANCE');
      
      const startTime = Date.now();
      const { response: perfResponse } = await makeRequest('GET');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      logTest('Tempo de resposta da listagem', responseTime < 2000, 
        `${responseTime}ms (limite: 2000ms)`);
      
      // 6. TESTE DE LOGS E TRATAMENTO DE ERROS
      console.log('\n📝 6. TESTE DE LOGS E TRATAMENTO DE ERROS');
      
      // Verificar se as respostas de erro têm estrutura adequada
      const { response: errorResponse, data: errorData } = await makeRequest('DELETE', { id: 'teste-erro' });
      
      const hasErrorStructure = errorData.error && typeof errorData.error.message === 'string';
      logTest('Estrutura de erro', hasErrorStructure, 
        hasErrorStructure ? 'Estrutura de erro adequada' : 'Estrutura de erro inadequada');
      
    } else {
      logTest('Listagem inicial', false, 'Erro na listagem inicial');
    }
  } catch (error) {
    logTest('Listagem inicial', false, `Erro inesperado: ${error.message}`);
  }

  // RELATÓRIO FINAL
  console.log('\n============================================================');
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log('============================================================');
  console.log(`✅ Testes aprovados: ${testResults.passed}`);
  console.log(`❌ Testes falharam: ${testResults.failed}`);
  console.log(`📈 Taxa de sucesso: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ TESTES QUE FALHARAM:');
    testResults.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  - ${test.testName}: ${test.message}`);
    });
  }
  
  console.log('\n🎯 TESTES CONCLUÍDOS!');
  
  return testResults.failed === 0;
}

runComprehensiveTests().catch(console.error);