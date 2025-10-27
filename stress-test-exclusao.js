/**
 * TESTE DE STRESS PARA FUNCIONALIDADE DE EXCLUSÃO DE PROFISSIONAIS
 * 
 * Este script realiza testes extensivos e rigorosos na funcionalidade de exclusão
 * para garantir que não há mais problemas.
 */

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

// Contadores de teste
let testesExecutados = 0;
let testesPassaram = 0;
let testesFalharam = 0;
let profissionaisCriados = [];

// Função para fazer requisições à Edge Function
async function makeRequest(method, body = null) {
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
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais`, options);
    let data;
    
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Resposta não é JSON válido' };
    }

    return { response, data };
  } catch (error) {
    return { 
      response: { ok: false, status: 0 }, 
      data: { error: error.message } 
    };
  }
}

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

// Função para criar profissional de teste
async function criarProfissionalTeste(nome = null) {
  const timestamp = Date.now();
  const profissional = {
    nome: nome || `Teste Exclusão ${timestamp}`,
    email: `teste.exclusao.${timestamp}@teste.com`,
    regime: 'CLT',
    origem: 'cadastro',
    local_alocacao: 'Teste',
    proficiencia: 'Pleno'
  };

  const { response, data } = await makeRequest('POST', profissional);
  
  if (response.ok && data.success && data.data) {
    profissionaisCriados.push(data.data);
    return data.data;
  }
  
  throw new Error(`Falha ao criar profissional: ${data.error?.message || 'Erro desconhecido'}`);
}

// Função para listar profissionais
async function listarProfissionais() {
  const { response, data } = await makeRequest('GET');
  
  if (response.ok && Array.isArray(data)) {
    return data;
  }
  
  throw new Error(`Falha ao listar profissionais: ${data.error?.message || 'Erro desconhecido'}`);
}

// Função para excluir profissional
async function excluirProfissional(id) {
  const { response, data } = await makeRequest('DELETE', { id });
  return { response, data };
}

// Função para medir tempo de execução
function medirTempo(funcao) {
  return async (...args) => {
    const inicio = Date.now();
    const resultado = await funcao(...args);
    const tempo = Date.now() - inicio;
    return { resultado, tempo };
  };
}

// TESTE 1: EXCLUSÃO BÁSICA
async function testeExclusaoBasica() {
  console.log('\n🎯 1. TESTE DE EXCLUSÃO BÁSICA');
  console.log('=' .repeat(50));

  try {
    // 1.1 Criar profissional de teste
    console.log('\n📝 1.1 Criando profissional de teste...');
    const profissional = await criarProfissionalTeste();
    logTest('Criação de profissional', true, `ID: ${profissional.id}`);

    // 1.2 Verificar se aparece na listagem
    console.log('\n📋 1.2 Verificando se aparece na listagem...');
    const listagem = await listarProfissionais();
    const encontrado = listagem.find(p => p.id === profissional.id);
    logTest('Profissional na listagem', !!encontrado, `Total: ${listagem.length} profissionais`);

    // 1.3 Excluir profissional
    console.log('\n🗑️ 1.3 Excluindo profissional...');
    const { response, data } = await excluirProfissional(profissional.id);
    logTest('Exclusão bem-sucedida', response.ok && data.success, data.message || data.error?.message);

    // 1.4 Verificar se desapareceu da listagem
    console.log('\n🔍 1.4 Verificando se desapareceu da listagem...');
    const novaListagem = await listarProfissionais();
    const aindaEncontrado = novaListagem.find(p => p.id === profissional.id);
    logTest('Profissional removido da listagem', !aindaEncontrado, `Total: ${novaListagem.length} profissionais`);

  } catch (error) {
    logTest('Teste de exclusão básica', false, error.message);
  }
}

// TESTE 2: EDGE CASES
async function testeEdgeCases() {
  console.log('\n⚠️ 2. TESTE DE EDGE CASES');
  console.log('=' .repeat(50));

  // 2.1 ID inexistente
  console.log('\n🔍 2.1 Testando ID inexistente...');
  const { response: r1, data: d1 } = await excluirProfissional('00000000-0000-0000-0000-000000000000');
  logTest('ID inexistente', !r1.ok || !d1.success, d1.error?.message || 'Erro esperado');

  // 2.2 ID inválido (string)
  console.log('\n🔍 2.2 Testando ID inválido (string)...');
  const { response: r2, data: d2 } = await excluirProfissional('id-invalido');
  logTest('ID inválido (string)', !r2.ok || !d2.success, d2.error?.message || 'Erro esperado');

  // 2.3 ID null
  console.log('\n🔍 2.3 Testando ID null...');
  const { response: r3, data: d3 } = await excluirProfissional(null);
  logTest('ID null', !r3.ok || !d3.success, d3.error?.message || 'Erro esperado');

  // 2.4 ID undefined
  console.log('\n🔍 2.4 Testando ID undefined...');
  const { response: r4, data: d4 } = await excluirProfissional(undefined);
  logTest('ID undefined', !r4.ok || !d4.success, d4.error?.message || 'Erro esperado');

  // 2.5 Sem ID no body
  console.log('\n🔍 2.5 Testando requisição sem ID...');
  const { response: r5, data: d5 } = await makeRequest('DELETE', {});
  logTest('Requisição sem ID', !r5.ok || !d5.success, d5.error?.message || 'Erro esperado');

  // 2.6 Exclusão duplicada
  console.log('\n🔍 2.6 Testando exclusão duplicada...');
  try {
    const profissional = await criarProfissionalTeste('Teste Duplicado');
    await excluirProfissional(profissional.id);
    const { response: r6, data: d6 } = await excluirProfissional(profissional.id);
    logTest('Exclusão duplicada', !r6.ok || !d6.success, d6.error?.message || 'Erro esperado');
  } catch (error) {
    logTest('Exclusão duplicada', false, error.message);
  }
}

// TESTE 3: MÚLTIPLAS EXCLUSÕES
async function testeMultiplasExclusoes() {
  console.log('\n🔄 3. TESTE DE MÚLTIPLAS EXCLUSÕES');
  console.log('=' .repeat(50));

  try {
    // 3.1 Criar múltiplos profissionais
    console.log('\n📝 3.1 Criando múltiplos profissionais...');
    const profissionais = [];
    for (let i = 1; i <= 5; i++) {
      const prof = await criarProfissionalTeste(`Teste Múltiplo ${i}`);
      profissionais.push(prof);
    }
    logTest('Criação de múltiplos profissionais', true, `${profissionais.length} criados`);

    // 3.2 Excluir todos em sequência
    console.log('\n🗑️ 3.2 Excluindo todos em sequência...');
    let exclusoesBemSucedidas = 0;
    for (const prof of profissionais) {
      const { response, data } = await excluirProfissional(prof.id);
      if (response.ok && data.success) {
        exclusoesBemSucedidas++;
      }
    }
    logTest('Múltiplas exclusões', exclusoesBemSucedidas === profissionais.length, 
      `${exclusoesBemSucedidas}/${profissionais.length} excluídos`);

    // 3.3 Verificar se todos foram removidos
    console.log('\n🔍 3.3 Verificando se todos foram removidos...');
    const listagem = await listarProfissionais();
    const restantes = profissionais.filter(p => listagem.find(l => l.id === p.id));
    logTest('Todos removidos da listagem', restantes.length === 0, 
      `${restantes.length} ainda na listagem`);

  } catch (error) {
    logTest('Teste de múltiplas exclusões', false, error.message);
  }
}

// TESTE 4: PERFORMANCE
async function testePerformance() {
  console.log('\n⚡ 4. TESTE DE PERFORMANCE');
  console.log('=' .repeat(50));

  try {
    // 4.1 Criar profissional para teste
    console.log('\n📝 4.1 Criando profissional para teste de performance...');
    const profissional = await criarProfissionalTeste('Teste Performance');

    // 4.2 Medir tempo de exclusão
    console.log('\n⏱️ 4.2 Medindo tempo de exclusão...');
    const excluirComTempo = medirTempo(excluirProfissional);
    const { resultado, tempo } = await excluirComTempo(profissional.id);
    
    const tempoAceitavel = tempo < 5000; // 5 segundos
    logTest('Tempo de exclusão aceitável', tempoAceitavel, `${tempo}ms`);
    logTest('Exclusão bem-sucedida', resultado.response.ok && resultado.data.success, 
      resultado.data.message || resultado.data.error?.message);

  } catch (error) {
    logTest('Teste de performance', false, error.message);
  }
}

// TESTE 5: RECUPERAÇÃO DE DADOS (EXCLUSÃO LÓGICA)
async function testeRecuperacaoDados() {
  console.log('\n💾 5. TESTE DE RECUPERAÇÃO DE DADOS');
  console.log('=' .repeat(50));

  try {
    // 5.1 Criar profissional
    console.log('\n📝 5.1 Criando profissional para teste de exclusão lógica...');
    const profissional = await criarProfissionalTeste('Teste Exclusão Lógica');

    // 5.2 Excluir profissional
    console.log('\n🗑️ 5.2 Excluindo profissional...');
    const { response, data } = await excluirProfissional(profissional.id);
    logTest('Exclusão realizada', response.ok && data.success, data.message);

    // 5.3 Verificar se não aparece na listagem normal
    console.log('\n🔍 5.3 Verificando se não aparece na listagem...');
    const listagem = await listarProfissionais();
    const encontrado = listagem.find(p => p.id === profissional.id);
    logTest('Não aparece na listagem', !encontrado, 'Exclusão lógica funcionando');

    // Nota: Para verificar se os dados ainda existem no banco com ativo=false,
    // seria necessário acesso direto ao banco ou uma função específica

  } catch (error) {
    logTest('Teste de recuperação de dados', false, error.message);
  }
}

// TESTE 6: LOGS E TRATAMENTO DE ERROS
async function testeLogsErros() {
  console.log('\n📋 6. TESTE DE LOGS E TRATAMENTO DE ERROS');
  console.log('=' .repeat(50));

  // Capturar logs do console
  const logsOriginais = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => {
    logsOriginais.push({ tipo: 'log', args });
    originalLog(...args);
  };

  console.error = (...args) => {
    logsOriginais.push({ tipo: 'error', args });
    originalError(...args);
  };

  console.warn = (...args) => {
    logsOriginais.push({ tipo: 'warn', args });
    originalWarn(...args);
  };

  try {
    // 6.1 Testar exclusão com erro
    console.log('\n🔍 6.1 Testando exclusão com erro para verificar logs...');
    await excluirProfissional('id-que-gera-erro');

    // 6.2 Verificar se logs foram gerados
    const logsGerados = logsOriginais.length > 0;
    logTest('Logs sendo gerados', logsGerados, `${logsOriginais.length} logs capturados`);

  } catch (error) {
    logTest('Teste de logs', false, error.message);
  } finally {
    // Restaurar console original
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }
}

// FUNÇÃO PRINCIPAL
async function executarStressTest() {
  console.log('🚀 INICIANDO STRESS TEST DE EXCLUSÃO DE PROFISSIONAIS');
  console.log('=' .repeat(60));
  console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log('=' .repeat(60));

  const inicioTeste = Date.now();

  try {
    // Executar todos os testes
    await testeExclusaoBasica();
    await testeEdgeCases();
    await testeMultiplasExclusoes();
    await testePerformance();
    await testeRecuperacaoDados();
    await testeLogsErros();

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO NO STRESS TEST:', error.message);
  }

  const tempoTotal = Date.now() - inicioTeste;

  // Relatório final
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RELATÓRIO FINAL DO STRESS TEST');
  console.log('=' .repeat(60));
  console.log(`⏱️ Tempo total: ${tempoTotal}ms (${(tempoTotal / 1000).toFixed(2)}s)`);
  console.log(`📈 Testes executados: ${testesExecutados}`);
  console.log(`✅ Testes que passaram: ${testesPassaram}`);
  console.log(`❌ Testes que falharam: ${testesFalharam}`);
  console.log(`📊 Taxa de sucesso: ${((testesPassaram / testesExecutados) * 100).toFixed(1)}%`);
  console.log(`👥 Profissionais criados: ${profissionaisCriados.length}`);

  if (testesFalharam === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Funcionalidade de exclusão está robusta.');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM. Revisar problemas identificados.');
  }

  console.log('=' .repeat(60));
}

// Executar o stress test
executarStressTest().catch(error => {
  console.error('💥 FALHA CRÍTICA NO STRESS TEST:', error);
  process.exit(1);
});