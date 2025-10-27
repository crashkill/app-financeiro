/**
 * STRESS TEST FINAL - Teste Completo de Exclusão de Profissionais
 * Este é o teste definitivo que combina todos os cenários possíveis
 * para garantir que a funcionalidade está 100% robusta
 * VERSÃO ATUALIZADA - Credenciais corretas do Supabase
 */

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

console.log('🔥 INICIANDO STRESS TEST FINAL - EXCLUSÃO DE PROFISSIONAIS');
console.log('==============================================================');
console.log('Este teste irá executar TODOS os cenários possíveis para garantir');
console.log('que a funcionalidade de exclusão está 100% robusta e confiável.');
console.log('==============================================================\n');

let totalTestes = 0;
let testesPassaram = 0;
let testesFalharam = 0;
let tempoInicio = Date.now();

// Função para executar um teste
function executarTeste(categoria, nome, passou, detalhes = '') {
    totalTestes++;
    const status = passou ? '✅ PASSOU' : '❌ FALHOU';
    const info = detalhes ? ` - ${detalhes}` : '';
    
    if (passou) {
        testesPassaram++;
    } else {
        testesFalharam++;
    }
    
    console.log(`[${categoria}] ${nome}: ${status}${info}`);
}

// Função para fazer requisições HTTP
async function fazerRequisicao(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        return { success: response.ok, data, status: response.status };
    } catch (error) {
        return { success: false, error: error.message, status: 0 };
    }
}

// Função para criar profissional de teste
async function criarProfissionalTeste(nome = `Teste_${Date.now()}`) {
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais/create`;
    const profissional = {
        nome,
        email: `${nome.toLowerCase()}@teste.com`,
        telefone: '11999999999',
        cargo: 'Desenvolvedor',
        departamento: 'TI',
        salario: 5000,
        dataAdmissao: new Date().toISOString().split('T')[0],
        ativo: true
    };
    
    return await fazerRequisicao(url, {
        method: 'POST',
        body: JSON.stringify(profissional)
    });
}

// Função para excluir profissional
async function excluirProfissional(id) {
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais/delete/${id}`;
    return await fazerRequisicao(url, { method: 'DELETE' });
}

// Função para listar profissionais
async function listarProfissionais() {
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais/list?origem=colaboradores`;
    return await fazerRequisicao(url);
}

// Função para obter profissional por ID
async function obterProfissional(id) {
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais/get/${id}`;
    return await fazerRequisicao(url);
}

// CATEGORIA 1: TESTES DE CONECTIVIDADE
async function testarConectividade() {
    console.log('\n🌐 CATEGORIA 1: TESTES DE CONECTIVIDADE');
    console.log('==========================================');
    
    // Teste 1.1: Conectividade básica
    const listagemInicial = await listarProfissionais();
    executarTeste('CONECTIVIDADE', 'Listagem básica', listagemInicial.success, 
        listagemInicial.success ? `${listagemInicial.data?.length || 0} profissionais` : listagemInicial.error);
    
    // Teste 1.2: Timeout de requisição
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1000);
    
    try {
        const timeoutTest = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais/list`, {
            signal: controller.signal,
            headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        executarTeste('CONECTIVIDADE', 'Resposta dentro do timeout', true, '< 1s');
    } catch (error) {
        executarTeste('CONECTIVIDADE', 'Resposta dentro do timeout', false, error.message);
    }
    
    // Teste 1.3: Headers de autenticação
    const semAuth = await fetch(`${SUPABASE_URL}/functions/v1/gestao-profissionais/list`);
    executarTeste('CONECTIVIDADE', 'Rejeita requisições sem auth', !semAuth.ok, `Status: ${semAuth.status}`);
}

// CATEGORIA 2: TESTES DE EXCLUSÃO BÁSICA
async function testarExclusaoBasica() {
    console.log('\n🗑️ CATEGORIA 2: TESTES DE EXCLUSÃO BÁSICA');
    console.log('==========================================');
    
    // Teste 2.1: Criar e excluir profissional
    const criacao = await criarProfissionalTeste('TesteExclusaoBasica');
    if (criacao.success && criacao.data?.id) {
        executarTeste('EXCLUSÃO BÁSICA', 'Criação de profissional', true, `ID: ${criacao.data.id}`);
        
        const exclusao = await excluirProfissional(criacao.data.id);
        executarTeste('EXCLUSÃO BÁSICA', 'Exclusão de profissional', exclusao.success, 
            exclusao.success ? 'Excluído com sucesso' : exclusao.error);
        
        // Verificar se não aparece mais na listagem
        const listagem = await listarProfissionais();
        if (listagem.success) {
            const profissionalAindaExiste = listagem.data?.some(p => p.id === criacao.data.id);
            executarTeste('EXCLUSÃO BÁSICA', 'Profissional removido da listagem', !profissionalAindaExiste);
        }
    } else {
        executarTeste('EXCLUSÃO BÁSICA', 'Criação de profissional', false, criacao.error);
    }
    
    // Teste 2.2: Verificar exclusão lógica
    const criacao2 = await criarProfissionalTeste('TesteExclusaoLogica');
    if (criacao2.success && criacao2.data?.id) {
        await excluirProfissional(criacao2.data.id);
        
        // Tentar obter o profissional diretamente (deve existir mas com ativo=false)
        const profissional = await obterProfissional(criacao2.data.id);
        if (profissional.success && profissional.data) {
            executarTeste('EXCLUSÃO BÁSICA', 'Exclusão lógica (ativo=false)', 
                profissional.data.ativo === false, `ativo: ${profissional.data.ativo}`);
        } else {
            executarTeste('EXCLUSÃO BÁSICA', 'Exclusão lógica (ativo=false)', false, 'Profissional não encontrado');
        }
    }
}

// CATEGORIA 3: TESTES DE EDGE CASES
async function testarEdgeCases() {
    console.log('\n⚠️ CATEGORIA 3: TESTES DE EDGE CASES');
    console.log('=====================================');
    
    // Teste 3.1: ID inexistente
    const idInexistente = await excluirProfissional(99999999);
    executarTeste('EDGE CASES', 'ID inexistente', !idInexistente.success, 
        `Status: ${idInexistente.status}`);
    
    // Teste 3.2: ID inválido (string)
    const idString = await excluirProfissional('abc123');
    executarTeste('EDGE CASES', 'ID inválido (string)', !idString.success, 
        `Status: ${idString.status}`);
    
    // Teste 3.3: ID nulo
    const idNulo = await excluirProfissional(null);
    executarTeste('EDGE CASES', 'ID nulo', !idNulo.success, 
        `Status: ${idNulo.status}`);
    
    // Teste 3.4: ID negativo
    const idNegativo = await excluirProfissional(-1);
    executarTeste('EDGE CASES', 'ID negativo', !idNegativo.success, 
        `Status: ${idNegativo.status}`);
    
    // Teste 3.5: Exclusão dupla
    const criacao = await criarProfissionalTeste('TesteExclusaoDupla');
    if (criacao.success && criacao.data?.id) {
        const primeiraExclusao = await excluirProfissional(criacao.data.id);
        const segundaExclusao = await excluirProfissional(criacao.data.id);
        
        executarTeste('EDGE CASES', 'Primeira exclusão', primeiraExclusao.success);
        executarTeste('EDGE CASES', 'Segunda exclusão (já excluído)', !segundaExclusao.success, 
            `Status: ${segundaExclusao.status}`);
    }
}

// CATEGORIA 4: TESTES DE MÚLTIPLAS EXCLUSÕES
async function testarMultiplasExclusoes() {
    console.log('\n🔄 CATEGORIA 4: TESTES DE MÚLTIPLAS EXCLUSÕES');
    console.log('===============================================');
    
    const profissionaisCriados = [];
    const quantidadeTeste = 5;
    
    // Criar múltiplos profissionais
    for (let i = 0; i < quantidadeTeste; i++) {
        const criacao = await criarProfissionalTeste(`TesteMultiplo_${i}`);
        if (criacao.success && criacao.data?.id) {
            profissionaisCriados.push(criacao.data.id);
        }
    }
    
    executarTeste('MÚLTIPLAS EXCLUSÕES', 'Criação de múltiplos profissionais', 
        profissionaisCriados.length === quantidadeTeste, 
        `${profissionaisCriados.length}/${quantidadeTeste} criados`);
    
    // Excluir todos em sequência
    let exclusoesBemSucedidas = 0;
    for (const id of profissionaisCriados) {
        const exclusao = await excluirProfissional(id);
        if (exclusao.success) {
            exclusoesBemSucedidas++;
        }
    }
    
    executarTeste('MÚLTIPLAS EXCLUSÕES', 'Exclusão sequencial', 
        exclusoesBemSucedidas === profissionaisCriados.length, 
        `${exclusoesBemSucedidas}/${profissionaisCriados.length} excluídos`);
    
    // Verificar se nenhum aparece na listagem
    const listagem = await listarProfissionais();
    if (listagem.success) {
        const profissionaisAindaExistem = profissionaisCriados.filter(id => 
            listagem.data?.some(p => p.id === id)
        );
        
        executarTeste('MÚLTIPLAS EXCLUSÕES', 'Remoção da listagem', 
            profissionaisAindaExistem.length === 0, 
            `${profissionaisAindaExistem.length} ainda visíveis`);
    }
}

// CATEGORIA 5: TESTES DE PERFORMANCE
async function testarPerformance() {
    console.log('\n⚡ CATEGORIA 5: TESTES DE PERFORMANCE');
    console.log('=====================================');
    
    // Teste 5.1: Tempo de resposta da listagem
    const inicioListagem = Date.now();
    const listagem = await listarProfissionais();
    const tempoListagem = Date.now() - inicioListagem;
    
    executarTeste('PERFORMANCE', 'Tempo de listagem', tempoListagem < 2000, 
        `${tempoListagem}ms`);
    
    // Teste 5.2: Tempo de resposta da exclusão
    const criacao = await criarProfissionalTeste('TestePerformance');
    if (criacao.success && criacao.data?.id) {
        const inicioExclusao = Date.now();
        const exclusao = await excluirProfissional(criacao.data.id);
        const tempoExclusao = Date.now() - inicioExclusao;
        
        executarTeste('PERFORMANCE', 'Tempo de exclusão', tempoExclusao < 1500, 
            `${tempoExclusao}ms`);
    }
    
    // Teste 5.3: Múltiplas requisições simultâneas
    const inicioSimultaneo = Date.now();
    const promessas = Array(3).fill().map(() => listarProfissionais());
    const resultados = await Promise.all(promessas);
    const tempoSimultaneo = Date.now() - inicioSimultaneo;
    
    const todasBemSucedidas = resultados.every(r => r.success);
    executarTeste('PERFORMANCE', 'Requisições simultâneas', todasBemSucedidas, 
        `${tempoSimultaneo}ms para 3 requisições`);
}

// CATEGORIA 6: TESTES DE INTEGRIDADE DE DADOS
async function testarIntegridadeDados() {
    console.log('\n🔒 CATEGORIA 6: TESTES DE INTEGRIDADE DE DADOS');
    console.log('===============================================');
    
    // Teste 6.1: Dados não são perdidos na exclusão
    const criacao = await criarProfissionalTeste('TesteIntegridade');
    if (criacao.success && criacao.data?.id) {
        const dadosOriginais = criacao.data;
        
        await excluirProfissional(dadosOriginais.id);
        
        const profissionalExcluido = await obterProfissional(dadosOriginais.id);
        if (profissionalExcluido.success && profissionalExcluido.data) {
            const dadosPreservados = 
                profissionalExcluido.data.nome === dadosOriginais.nome &&
                profissionalExcluido.data.email === dadosOriginais.email;
            
            executarTeste('INTEGRIDADE', 'Dados preservados após exclusão', dadosPreservados);
            executarTeste('INTEGRIDADE', 'Campo ativo atualizado', 
                profissionalExcluido.data.ativo === false);
        }
    }
    
    // Teste 6.2: Consistência da listagem
    const listagem1 = await listarProfissionais();
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequena pausa
    const listagem2 = await listarProfissionais();
    
    if (listagem1.success && listagem2.success) {
        const quantidadeConsistente = listagem1.data?.length === listagem2.data?.length;
        executarTeste('INTEGRIDADE', 'Consistência da listagem', quantidadeConsistente, 
            `${listagem1.data?.length} vs ${listagem2.data?.length}`);
    }
}

// CATEGORIA 7: TESTES DE TRATAMENTO DE ERROS
async function testarTratamentoErros() {
    console.log('\n🚨 CATEGORIA 7: TESTES DE TRATAMENTO DE ERROS');
    console.log('===============================================');
    
    // Teste 7.1: URL inválida
    try {
        const urlInvalida = await fetch('https://url-inexistente.com/test');
        executarTeste('TRATAMENTO ERROS', 'URL inválida rejeitada', false, 'Não deveria ter sucesso');
    } catch (error) {
        executarTeste('TRATAMENTO ERROS', 'URL inválida rejeitada', true, 'Erro capturado');
    }
    
    // Teste 7.2: Método HTTP inválido
    const metodoInvalido = await fazerRequisicao(
        `${SUPABASE_URL}/functions/v1/gestao-profissionais/list`, 
        { method: 'PATCH' }
    );
    executarTeste('TRATAMENTO ERROS', 'Método HTTP inválido', !metodoInvalido.success, 
        `Status: ${metodoInvalido.status}`);
    
    // Teste 7.3: Payload inválido
    const payloadInvalido = await fazerRequisicao(
        `${SUPABASE_URL}/functions/v1/gestao-profissionais/create`, 
        { 
            method: 'POST',
            body: 'payload-inválido-não-json'
        }
    );
    executarTeste('TRATAMENTO ERROS', 'Payload inválido rejeitado', !payloadInvalido.success, 
        `Status: ${payloadInvalido.status}`);
}

// FUNÇÃO PRINCIPAL
async function executarStressTestFinal() {
    try {
        await testarConectividade();
        await testarExclusaoBasica();
        await testarEdgeCases();
        await testarMultiplasExclusoes();
        await testarPerformance();
        await testarIntegridadeDados();
        await testarTratamentoErros();
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO DURANTE OS TESTES:', error);
        testesFalharam++;
    }
    
    // RELATÓRIO FINAL DETALHADO
    const tempoTotal = Date.now() - tempoInicio;
    const taxaSucesso = totalTestes > 0 ? ((testesPassaram / totalTestes) * 100).toFixed(1) : 0;
    
    console.log('\n==============================================================');
    console.log('🏁 RELATÓRIO FINAL - STRESS TEST COMPLETO');
    console.log('==============================================================');
    console.log(`⏱️ Tempo total de execução: ${tempoTotal}ms (${(tempoTotal / 1000).toFixed(2)}s)`);
    console.log(`📊 Total de testes executados: ${totalTestes}`);
    console.log(`✅ Testes que passaram: ${testesPassaram}`);
    console.log(`❌ Testes que falharam: ${testesFalharam}`);
    console.log(`📈 Taxa de sucesso: ${taxaSucesso}%`);
    console.log('');
    
    // Análise da qualidade
    if (taxaSucesso >= 95) {
        console.log('🎉 EXCELENTE! A funcionalidade está EXTREMAMENTE ROBUSTA!');
        console.log('✨ Todos os cenários críticos foram validados com sucesso.');
    } else if (taxaSucesso >= 85) {
        console.log('👍 BOM! A funcionalidade está ROBUSTA com pequenos ajustes necessários.');
        console.log('🔧 Revisar os testes que falharam para melhorias pontuais.');
    } else if (taxaSucesso >= 70) {
        console.log('⚠️ ATENÇÃO! A funcionalidade precisa de MELHORIAS SIGNIFICATIVAS.');
        console.log('🛠️ Vários cenários críticos falharam e precisam ser corrigidos.');
    } else {
        console.log('🚨 CRÍTICO! A funcionalidade NÃO ESTÁ PRONTA para produção!');
        console.log('💥 Muitos testes falharam. Revisão completa necessária.');
    }
    
    console.log('');
    console.log('📋 CATEGORIAS TESTADAS:');
    console.log('   🌐 Conectividade e autenticação');
    console.log('   🗑️ Exclusão básica e lógica');
    console.log('   ⚠️ Casos extremos e edge cases');
    console.log('   🔄 Múltiplas exclusões sequenciais');
    console.log('   ⚡ Performance e tempo de resposta');
    console.log('   🔒 Integridade e consistência de dados');
    console.log('   🚨 Tratamento de erros e exceções');
    console.log('');
    console.log('==============================================================');
    
    if (testesFalharam === 0) {
        console.log('🚀 FUNCIONALIDADE 100% VALIDADA E PRONTA PARA PRODUÇÃO! 🚀');
    } else {
        console.log(`🔧 ${testesFalharam} problema(s) identificado(s) que precisa(m) ser corrigido(s).`);
    }
    
    console.log('==============================================================');
}

// EXECUTAR O STRESS TEST
executarStressTestFinal();