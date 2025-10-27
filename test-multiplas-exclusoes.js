/**
 * Teste de Múltiplas Exclusões - Versão Extensiva
 * Testa exclusão de vários profissionais em sequência
 * Verifica se a listagem atualiza corretamente
 */

const SUPABASE_URL = 'https://ixqfqjqjqjqjqjqjqjqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWZxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjE4NzIsImV4cCI6MjA1MTQ5Nzg3Mn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

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

// Função para criar um profissional de teste
async function criarProfissionalTeste(nome, email) {
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais`;
    const payload = {
        nome: nome,
        email: email,
        telefone: '(11) 99999-9999',
        cargo: 'Desenvolvedor',
        departamento: 'TI',
        salario: 5000,
        data_admissao: '2024-01-01'
    };

    return await fazerRequisicao(url, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

// Função para excluir um profissional
async function excluirProfissional(id) {
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais`;
    const payload = { id: id };

    return await fazerRequisicao(url, {
        method: 'DELETE',
        body: JSON.stringify(payload)
    });
}

// Função para listar profissionais
async function listarProfissionais() {
    const url = `${SUPABASE_URL}/functions/v1/gestao-profissionais/list?origem=colaboradores`;
    return await fazerRequisicao(url, { method: 'GET' });
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

// Função principal de teste
async function testarMultiplasExclusoes() {
    console.log('🔄 TESTE DE MÚLTIPLAS EXCLUSÕES');
    console.log('========================================');

    // Criar múltiplos profissionais para teste
    const profissionaisParaCriar = [
        { nome: 'João Silva', email: 'joao.silva@teste.com' },
        { nome: 'Maria Santos', email: 'maria.santos@teste.com' },
        { nome: 'Pedro Oliveira', email: 'pedro.oliveira@teste.com' },
        { nome: 'Ana Costa', email: 'ana.costa@teste.com' },
        { nome: 'Carlos Ferreira', email: 'carlos.ferreira@teste.com' }
    ];

    const profissionaisCriados = [];

    // Criar profissionais
    console.log('\n📝 Criando profissionais para teste...');
    for (const prof of profissionaisParaCriar) {
        const resultado = await criarProfissionalTeste(prof.nome, prof.email);
        if (resultado.ok && resultado.data && resultado.data.id) {
            profissionaisCriados.push({
                id: resultado.data.id,
                nome: prof.nome,
                email: prof.email
            });
            console.log(`✅ Criado: ${prof.nome} (ID: ${resultado.data.id})`);
        } else {
            console.log(`❌ Falha ao criar: ${prof.nome} - ${resultado.error}`);
        }
    }

    // Verificar se conseguimos criar pelo menos alguns profissionais
    if (profissionaisCriados.length === 0) {
        console.log('❌ Não foi possível criar nenhum profissional para teste');
        return;
    }

    console.log(`\n📊 ${profissionaisCriados.length} profissionais criados com sucesso`);

    // Obter contagem inicial
    const listagemInicial = await listarProfissionais();
    const contagemInicial = listagemInicial.ok && listagemInicial.data ? listagemInicial.data.length : 0;
    console.log(`📋 Contagem inicial de profissionais: ${contagemInicial}`);

    // Teste 1: Exclusão sequencial
    console.log('\n🔄 Teste 1: Exclusão sequencial');
    let exclusoesSequenciais = 0;
    for (const prof of profissionaisCriados) {
        const resultado = await excluirProfissional(prof.id);
        if (resultado.ok) {
            exclusoesSequenciais++;
            console.log(`✅ Excluído: ${prof.nome}`);
        } else {
            console.log(`❌ Falha ao excluir: ${prof.nome} - ${resultado.error}`);
        }
        
        // Pequena pausa entre exclusões
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    executarTeste(
        'Exclusão sequencial',
        exclusoesSequenciais === profissionaisCriados.length,
        `${exclusoesSequenciais}/${profissionaisCriados.length} exclusões bem-sucedidas`
    );

    // Teste 2: Verificar listagem após exclusões
    console.log('\n📋 Teste 2: Verificando listagem após exclusões');
    const listagemFinal = await listarProfissionais();
    const contagemFinal = listagemFinal.ok && listagemFinal.data ? listagemFinal.data.length : 0;
    const diferencaContagem = contagemInicial - contagemFinal;

    console.log(`📊 Contagem final: ${contagemFinal}`);
    console.log(`📉 Diferença: ${diferencaContagem}`);

    executarTeste(
        'Atualização da listagem',
        diferencaContagem === exclusoesSequenciais,
        `Esperado: ${exclusoesSequenciais}, Obtido: ${diferencaContagem}`
    );

    // Teste 3: Tentar excluir novamente os mesmos profissionais
    console.log('\n🔄 Teste 3: Tentativa de re-exclusão');
    let reexclusoesComErro = 0;
    for (const prof of profissionaisCriados) {
        const resultado = await excluirProfissional(prof.id);
        if (!resultado.ok) {
            reexclusoesComErro++;
            console.log(`✅ Re-exclusão falhou como esperado: ${prof.nome}`);
        } else {
            console.log(`❌ Re-exclusão não deveria ter sucesso: ${prof.nome}`);
        }
    }

    executarTeste(
        'Re-exclusão com erro',
        reexclusoesComErro === profissionaisCriados.length,
        `${reexclusoesComErro}/${profissionaisCriados.length} re-exclusões falharam como esperado`
    );

    // Teste 4: Exclusão em lote (simulada)
    console.log('\n🔄 Teste 4: Criando novos profissionais para exclusão em lote');
    const novosProfs = [];
    for (let i = 0; i < 3; i++) {
        const resultado = await criarProfissionalTeste(
            `Teste Lote ${i + 1}`,
            `lote${i + 1}@teste.com`
        );
        if (resultado.ok && resultado.data && resultado.data.id) {
            novosProfs.push(resultado.data.id);
        }
    }

    if (novosProfs.length > 0) {
        console.log(`📝 Criados ${novosProfs.length} profissionais para teste de lote`);
        
        // Exclusão simultânea (Promise.all)
        const promisesExclusao = novosProfs.map(id => excluirProfissional(id));
        const resultadosLote = await Promise.all(promisesExclusao);
        
        const sucessosLote = resultadosLote.filter(r => r.ok).length;
        
        executarTeste(
            'Exclusão em lote (simultânea)',
            sucessosLote === novosProfs.length,
            `${sucessosLote}/${novosProfs.length} exclusões simultâneas bem-sucedidas`
        );
    } else {
        executarTeste('Exclusão em lote (simultânea)', false, 'Não foi possível criar profissionais para teste');
    }

    // Teste 5: Performance - medir tempo de exclusão
    console.log('\n⏱️ Teste 5: Medindo performance de exclusão');
    const profParaPerformance = await criarProfissionalTeste('Performance Test', 'performance@teste.com');
    
    if (profParaPerformance.ok && profParaPerformance.data && profParaPerformance.data.id) {
        const inicioExclusao = Date.now();
        const resultadoPerformance = await excluirProfissional(profParaPerformance.data.id);
        const tempoExclusao = Date.now() - inicioExclusao;
        
        executarTeste(
            'Performance de exclusão',
            resultadoPerformance.ok && tempoExclusao < 5000,
            `Tempo: ${tempoExclusao}ms (limite: 5000ms)`
        );
    } else {
        executarTeste('Performance de exclusão', false, 'Não foi possível criar profissional para teste');
    }
}

// Executar todos os testes
async function executarTodosTestes() {
    console.log('🚀 INICIANDO TESTES DE MÚLTIPLAS EXCLUSÕES');
    console.log('============================================================');
    
    await testarMultiplasExclusoes();
    
    // Relatório final
    const tempoTotal = Date.now() - tempoInicio;
    console.log('\n============================================================');
    console.log('📊 RELATÓRIO FINAL - MÚLTIPLAS EXCLUSÕES');
    console.log('============================================================');
    console.log(`⏱️ Tempo total: ${tempoTotal}ms (${(tempoTotal / 1000).toFixed(2)}s)`);
    console.log(`📈 Testes executados: ${testesExecutados}`);
    console.log(`✅ Testes que passaram: ${testesPassaram}`);
    console.log(`❌ Testes que falharam: ${testesFalharam}`);
    console.log(`📊 Taxa de sucesso: ${((testesPassaram / testesExecutados) * 100).toFixed(1)}%`);
    
    if (testesFalharam === 0) {
        console.log('\n🎉 TODOS OS TESTES DE MÚLTIPLAS EXCLUSÕES PASSARAM!');
    } else {
        console.log('\n⚠️ ALGUNS TESTES FALHARAM. Revisar funcionalidade de múltiplas exclusões.');
    }
    console.log('============================================================');
}

// Executar testes
executarTodosTestes().catch(console.error);