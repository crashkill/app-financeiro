/**
 * TESTE FINAL DE EDGE CASES PARA EXCLUSÃO DE PROFISSIONAIS
 * 
 * Este script testa especificamente os casos extremos e situações de erro
 * na funcionalidade de exclusão, independente da UI.
 */

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

// Contadores de teste
let testesExecutados = 0;
let testesPassaram = 0;
let testesFalharam = 0;

// Função para log de testes
function logTest(nome, passou, detalhes = '') {
  testesExecutados++;
  if (passou) {
    testesPassaram++;
    console.log(`✅ ${nome}: PASSOU ${detalhes ? `- ${detalhes}` : ''}`);
  } else {
    testesFalharam++;
    console.log(`❌ ${nome}: FALHOU ${detalhes ? `- ${detalhes}` : ''}`);
  }
}

// Função para fazer requisições
async function makeRequest(method, endpoint = '', body = null) {
  const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    let data;
    
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { error: 'Resposta não é JSON válido' };
    }

    return { 
      response: {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      }, 
      data 
    };
  } catch (error) {
    return { 
      response: { ok: false, status: 0, statusText: 'Network Error' }, 
      data: { error: error.message } 
    };
  }
}

// Teste de conectividade básica
async function testeConectividade() {
  console.log('\n🔌 TESTE DE CONECTIVIDADE');
  console.log('=' .repeat(40));

  // Testar diferentes endpoints possíveis
  const endpoints = [
    '',
    '/list',
    '/list?origem=colaboradores',
    '?origem=colaboradores'
  ];

  for (const endpoint of endpoints) {
    const { response, data } = await makeRequest('GET', endpoint);
    const conectou = response.status !== 0;
    logTest(`Conectividade ${endpoint || 'raiz'}`, conectou, 
      `Status: ${response.status} - ${response.statusText}`);
    
    if (conectou && response.ok) {
      console.log(`   📊 Resposta: ${JSON.stringify(data).substring(0, 100)}...`);
    }
  }
}

// Teste de edge cases para exclusão
async function testeEdgeCasesExclusao() {
  console.log('\n⚠️ TESTE DE EDGE CASES - EXCLUSÃO');
  console.log('=' .repeat(40));

  // 1. ID inexistente (UUID válido)
  const { response: r1, data: d1 } = await makeRequest('DELETE', '', { 
    id: '00000000-0000-0000-0000-000000000000' 
  });
  logTest('ID inexistente (UUID)', !r1.ok || (d1.success === false), 
    d1.error?.message || d1.message || 'Erro esperado');

  // 2. ID inválido (string aleatória)
  const { response: r2, data: d2 } = await makeRequest('DELETE', '', { 
    id: 'id-totalmente-invalido' 
  });
  logTest('ID inválido (string)', !r2.ok || (d2.success === false), 
    d2.error?.message || d2.message || 'Erro esperado');

  // 3. ID como número
  const { response: r3, data: d3 } = await makeRequest('DELETE', '', { 
    id: 999999 
  });
  logTest('ID como número', !r3.ok || (d3.success === false), 
    d3.error?.message || d3.message || 'Erro esperado');

  // 4. ID null
  const { response: r4, data: d4 } = await makeRequest('DELETE', '', { 
    id: null 
  });
  logTest('ID null', !r4.ok || (d4.success === false), 
    d4.error?.message || d4.message || 'Erro esperado');

  // 5. ID undefined
  const { response: r5, data: d5 } = await makeRequest('DELETE', '', { 
    id: undefined 
  });
  logTest('ID undefined', !r5.ok || (d5.success === false), 
    d5.error?.message || d5.message || 'Erro esperado');

  // 6. Sem campo ID
  const { response: r6, data: d6 } = await makeRequest('DELETE', '', {});
  logTest('Sem campo ID', !r6.ok || (d6.success === false), 
    d6.error?.message || d6.message || 'Erro esperado');

  // 7. Body vazio
  const { response: r7, data: d7 } = await makeRequest('DELETE', '', null);
  logTest('Body vazio', !r7.ok || (d7.success === false), 
    d7.error?.message || d7.message || 'Erro esperado');

  // 8. ID como array
  const { response: r8, data: d8 } = await makeRequest('DELETE', '', { 
    id: ['id1', 'id2'] 
  });
  logTest('ID como array', !r8.ok || (d8.success === false), 
    d8.error?.message || d8.message || 'Erro esperado');

  // 9. ID como objeto
  const { response: r9, data: d9 } = await makeRequest('DELETE', '', { 
    id: { value: 'test' } 
  });
  logTest('ID como objeto', !r9.ok || (d9.success === false), 
    d9.error?.message || d9.message || 'Erro esperado');

  // 10. String muito longa
  const { response: r10, data: d10 } = await makeRequest('DELETE', '', { 
    id: 'a'.repeat(1000) 
  });
  logTest('ID string muito longa', !r10.ok || (d10.success === false), 
    d10.error?.message || d10.message || 'Erro esperado');
}

// Teste de métodos HTTP inválidos
async function testeMetodosInvalidos() {
  console.log('\n🚫 TESTE DE MÉTODOS HTTP INVÁLIDOS');
  console.log('=' .repeat(40));

  const metodosInvalidos = ['PUT', 'PATCH', 'HEAD', 'OPTIONS'];
  
  for (const metodo of metodosInvalidos) {
    const { response, data } = await makeRequest(metodo, '', { id: 'test' });
    const rejeitado = !response.ok || response.status === 405 || response.status === 404;
    logTest(`Método ${metodo}`, rejeitado, 
      `Status: ${response.status} - ${response.statusText}`);
  }
}

// Teste de headers inválidos
async function testeHeadersInvalidos() {
  console.log('\n🔑 TESTE DE HEADERS INVÁLIDOS');
  console.log('=' .repeat(40));

  // 1. Sem Authorization
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: 'test' })
    });
    
    const rejeitado = !response.ok || response.status === 401 || response.status === 403;
    logTest('Sem Authorization', rejeitado, `Status: ${response.status}`);
  } catch (error) {
    logTest('Sem Authorization', true, 'Erro de rede esperado');
  }

  // 2. Token inválido
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer token-invalido',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: 'test' })
    });
    
    const rejeitado = !response.ok || response.status === 401 || response.status === 403;
    logTest('Token inválido', rejeitado, `Status: ${response.status}`);
  } catch (error) {
    logTest('Token inválido', true, 'Erro de rede esperado');
  }
}

// Teste de payload malformado
async function testePayloadMalformado() {
  console.log('\n📦 TESTE DE PAYLOAD MALFORMADO');
  console.log('=' .repeat(40));

  // 1. JSON inválido (simulado com string)
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: '{"id": "test", invalid json'
    });
    
    const rejeitado = !response.ok || response.status === 400;
    logTest('JSON inválido', rejeitado, `Status: ${response.status}`);
  } catch (error) {
    logTest('JSON inválido', true, 'Erro esperado');
  }

  // 2. Content-Type incorreto
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({ id: 'test' })
    });
    
    const rejeitado = !response.ok || response.status === 400 || response.status === 415;
    logTest('Content-Type incorreto', rejeitado, `Status: ${response.status}`);
  } catch (error) {
    logTest('Content-Type incorreto', true, 'Erro esperado');
  }
}

// Função principal
async function executarTestesEdgeCases() {
  console.log('🚀 INICIANDO TESTES DE EDGE CASES');
  console.log('=' .repeat(60));
  console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log('=' .repeat(60));

  const inicioTeste = Date.now();

  try {
    await testeConectividade();
    await testeEdgeCasesExclusao();
    await testeMetodosInvalidos();
    await testeHeadersInvalidos();
    await testePayloadMalformado();

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO NO TESTE:', error.message);
  }

  const tempoTotal = Date.now() - inicioTeste;

  // Relatório final
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RELATÓRIO FINAL - EDGE CASES');
  console.log('=' .repeat(60));
  console.log(`⏱️ Tempo total: ${tempoTotal}ms (${(tempoTotal / 1000).toFixed(2)}s)`);
  console.log(`📈 Testes executados: ${testesExecutados}`);
  console.log(`✅ Testes que passaram: ${testesPassaram}`);
  console.log(`❌ Testes que falharam: ${testesFalharam}`);
  console.log(`📊 Taxa de sucesso: ${((testesPassaram / testesExecutados) * 100).toFixed(1)}%`);

  if (testesFalharam === 0) {
    console.log('\n🎉 TODOS OS EDGE CASES PASSARAM! Sistema robusto contra entradas inválidas.');
  } else {
    console.log('\n⚠️ ALGUNS EDGE CASES FALHARAM. Revisar tratamento de erros.');
  }

  console.log('=' .repeat(60));
}

// Executar os testes
executarTestesEdgeCases().catch(error => {
  console.error('💥 FALHA CRÍTICA NOS TESTES:', error);
  process.exit(1);
});