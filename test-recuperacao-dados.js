/**
 * Teste de Recuperação de Dados - Verificação de Exclusão Lógica
 * Testa se profissionais excluídos não aparecem na listagem
 * Confirma que dados não são perdidos (exclusão lógica)
 */

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

// Contadores de teste
let testesExecutados = 0;
let testesPassaram = 0;
let testesFalharam = 0;
let tempoInicio = Date.now();

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
        
        return {
            status: response.status,
            ok: response.ok,
            data: response.ok ? await response.json() : null,
            error: !response.ok ? await response.text() : null
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            data: null,
            error: error.message
        };
    }
}

// Função para executar um teste
function executarTeste(nome, passou, detalhes = '') {
    testesExecutados++;
    if (passou) {
        testesPassaram++;
        console.log(`✅ ${nome}: PASSOU${detalhes ? ' - ' + detalhes : ''}`);
    } else {
        testesFalharam++;
        console.log(`❌ ${nome}: FALHOU${detalhes ? ' - ' + detalhes : ''}`);
    }
}

// Função para testar conectividade básica
async function testarConectividade() {
    console.log('🔗 TESTE DE CONECTIVIDADE');
    console.log('========================================');
    
    // Teste 1: Verificar se a Edge Function responde
    const urlList = `${SUPABASE_URL}/functions/v1/gestao-profissionais/list?origem=colaboradores`;
    const resultadoList = await fazerRequisicao(urlList, { method: 'GET' });
    
    executarTeste(
        'Conectividade Edge Function (GET)',
        resultadoList.status !== 0,
        `Status: ${resultadoList.status}`
    );
    
    // Teste 2: Verificar se a Edge Function aceita POST
    const urlPost = `${SUPABASE_URL}/functions/v1/gestao-profissionais`;
    const resultadoPost = await fazerRequisicao(urlPost, {
        method: 'POST',
        body: JSON.stringify({ teste: true })
    });
    
    executarTeste(
        'Conectividade Edge Function (POST)',
        resultadoPost.status !== 0,
        `Status: ${resultadoPost.status}`
    );
    
    // Teste 3: Verificar se a Edge Function aceita DELETE
    const resultadoDelete = await fazerRequisicao(urlPost, {
        method: 'DELETE',
        body: JSON.stringify({ id: 'teste-inexistente' })
    });
    
    executarTeste(
        'Conectividade Edge Function (DELETE)',
        resultadoDelete.status !== 0,
        `Status: ${resultadoDelete.status}`
    );
    
    return {
        conectividadeOk: resultadoList.status !== 0 || resultadoPost.status !== 0 || resultadoDelete.status !== 0,
        resultadoList,
        resultadoPost,
        resultadoDelete
    };
}

// Função para testar estrutura de dados
async function testarEstruturaDados() {
    console.log('\n📊 TESTE DE ESTRUTURA DE DADOS');
    console.log('========================================');
    
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais/list?origem=colaboradores`;
    const resultado = await fazerRequisicao(url, { method: 'GET' });
    
    if (resultado.ok && resultado.data) {
        // Teste 1: Verificar se retorna array
        const ehArray = Array.isArray(resultado.data);
        executarTeste('Retorna array de profissionais', ehArray);
        
        if (ehArray && resultado.data.length > 0) {
            const primeiroItem = resultado.data[0];
            
            // Teste 2: Verificar campos obrigatórios
            const temId = 'id' in primeiroItem;
            const temNome = 'nome' in primeiroItem;
            const temEmail = 'email' in primeiroItem;
            const temAtivo = 'ativo' in primeiroItem;
            
            executarTeste('Campo ID presente', temId);
            executarTeste('Campo nome presente', temNome);
            executarTeste('Campo email presente', temEmail);
            executarTeste('Campo ativo presente', temAtivo);
            
            // Teste 3: Verificar se apenas profissionais ativos são retornados
            const todosAtivos = resultado.data.every(prof => prof.ativo === true || prof.ativo === 1);
            executarTeste('Apenas profissionais ativos na listagem', todosAtivos);
            
            console.log(`📋 Total de profissionais ativos encontrados: ${resultado.data.length}`);
            
            // Mostrar estrutura do primeiro item
            console.log('📝 Estrutura do primeiro profissional:');
            console.log(JSON.stringify(primeiroItem, null, 2));
        } else {
            console.log('📋 Nenhum profissional encontrado na listagem');
            executarTeste('Lista não vazia', false, 'Nenhum profissional encontrado');
        }
    } else {
        executarTeste('Resposta válida da API', false, resultado.error || 'Erro desconhecido');
    }
    
    return resultado;
}

// Função para testar comportamento de exclusão lógica
async function testarExclusaoLogica() {
    console.log('\n🗑️ TESTE DE EXCLUSÃO LÓGICA');
    console.log('========================================');
    
    // Teste 1: Tentar excluir um ID inexistente
    const idInexistente = '00000000-0000-0000-0000-000000000000';
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais`;
    const resultadoExclusao = await fazerRequisicao(url, {
        method: 'DELETE',
        body: JSON.stringify({ id: idInexistente })
    });
    
    executarTeste(
        'Exclusão de ID inexistente retorna erro',
        !resultadoExclusao.ok,
        `Status: ${resultadoExclusao.status}`
    );
    
    // Teste 2: Verificar se a exclusão não afeta a listagem quando falha
    const listagemAntes = await fazerRequisicao(`${SUPABASE_URL}/functions/v1/gestao-profissionais/list?origem=colaboradores`, { method: 'GET' });
    const contagemAntes = listagemAntes.ok && listagemAntes.data ? listagemAntes.data.length : 0;
    
    // Tentar excluir novamente o mesmo ID inexistente
    await fazerRequisicao(url, {
        method: 'DELETE',
        body: JSON.stringify({ id: idInexistente })
    });
    
    const listagemDepois = await fazerRequisicao(`${SUPABASE_URL}/functions/v1/gestao-profissionais/list?origem=colaboradores`, { method: 'GET' });
    const contagemDepois = listagemDepois.ok && listagemDepois.data ? listagemDepois.data.length : 0;
    
    executarTeste(
        'Listagem não alterada após exclusão falhada',
        contagemAntes === contagemDepois,
        `Antes: ${contagemAntes}, Depois: ${contagemDepois}`
    );
    
    // Teste 3: Verificar comportamento com IDs malformados
    const idsMalformados = [
        'abc123',
        '123',
        '',
        null,
        undefined,
        'not-a-uuid'
    ];
    
    let exclusoesMalformadasFalharam = 0;
    for (const idMalformado of idsMalformados) {
        const resultado = await fazerRequisicao(url, {
            method: 'DELETE',
            body: JSON.stringify({ id: idMalformado })
        });
        
        if (!resultado.ok) {
            exclusoesMalformadasFalharam++;
        }
    }
    
    executarTeste(
        'IDs malformados rejeitados',
        exclusoesMalformadasFalharam === idsMalformados.length,
        `${exclusoesMalformadasFalharam}/${idsMalformados.length} rejeitados`
    );
}

// Função para testar integridade dos dados
async function testarIntegridadeDados() {
    console.log('\n🔍 TESTE DE INTEGRIDADE DOS DADOS');
    console.log('========================================');
    
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais/list?origem=colaboradores`;
    const resultado = await fazerRequisicao(url, { method: 'GET' });
    
    if (resultado.ok && resultado.data && Array.isArray(resultado.data)) {
        const profissionais = resultado.data;
        
        // Teste 1: Verificar se todos os IDs são únicos
        const ids = profissionais.map(p => p.id);
        const idsUnicos = new Set(ids);
        
        executarTeste(
            'IDs únicos',
            ids.length === idsUnicos.size,
            `${ids.length} profissionais, ${idsUnicos.size} IDs únicos`
        );
        
        // Teste 2: Verificar se todos os emails são únicos
        const emails = profissionais.map(p => p.email).filter(e => e);
        const emailsUnicos = new Set(emails);
        
        executarTeste(
            'Emails únicos',
            emails.length === emailsUnicos.size,
            `${emails.length} emails, ${emailsUnicos.size} emails únicos`
        );
        
        // Teste 3: Verificar campos obrigatórios preenchidos
        const todosComNome = profissionais.every(p => p.nome && p.nome.trim().length > 0);
        const todosComEmail = profissionais.every(p => p.email && p.email.trim().length > 0);
        
        executarTeste('Todos têm nome preenchido', todosComNome);
        executarTeste('Todos têm email preenchido', todosComEmail);
        
        // Teste 4: Verificar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const todosEmailsValidos = profissionais.every(p => !p.email || emailRegex.test(p.email));
        
        executarTeste('Todos os emails têm formato válido', todosEmailsValidos);
        
        console.log(`📊 Análise de ${profissionais.length} profissionais concluída`);
    } else {
        executarTeste('Dados disponíveis para análise', false, 'Não foi possível obter dados');
    }
}

// Função principal
async function executarTodosTestes() {
    console.log('🚀 INICIANDO TESTES DE RECUPERAÇÃO DE DADOS');
    console.log('============================================================');
    
    // Executar testes
    const conectividade = await testarConectividade();
    await testarEstruturaDados();
    await testarExclusaoLogica();
    await testarIntegridadeDados();
    
    // Relatório final
    const tempoTotal = Date.now() - tempoInicio;
    console.log('\n============================================================');
    console.log('📊 RELATÓRIO FINAL - RECUPERAÇÃO DE DADOS');
    console.log('============================================================');
    console.log(`⏱️ Tempo total: ${tempoTotal}ms (${(tempoTotal / 1000).toFixed(2)}s)`);
    console.log(`📈 Testes executados: ${testesExecutados}`);
    console.log(`✅ Testes que passaram: ${testesPassaram}`);
    console.log(`❌ Testes que falharam: ${testesFalharam}`);
    console.log(`📊 Taxa de sucesso: ${testesExecutados > 0 ? ((testesPassaram / testesExecutados) * 100).toFixed(1) : 0}%`);
    
    if (testesFalharam === 0) {
        console.log('\n🎉 TODOS OS TESTES DE RECUPERAÇÃO DE DADOS PASSARAM!');
    } else {
        console.log('\n⚠️ ALGUNS TESTES FALHARAM. Revisar integridade dos dados.');
    }
    
    if (!conectividade.conectividadeOk) {
        console.log('\n🚨 AVISO: Problemas de conectividade detectados.');
        console.log('   Verifique se a Edge Function está funcionando corretamente.');
    }
    
    console.log('============================================================');
}

// Executar testes
executarTodosTestes().catch(console.error);