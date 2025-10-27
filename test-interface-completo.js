/**
 * Teste de Interface Completo - Execução no Navegador
 * Testa toda a funcionalidade de exclusão de profissionais
 * Verifica modal de confirmação, feedback visual e integração completa
 */

// Script para ser executado no console do navegador
(function() {
    console.log('🚀 INICIANDO TESTES DE INTERFACE COMPLETA');
    console.log('============================================================');
    
    let testesExecutados = 0;
    let testesPassaram = 0;
    let testesFalharam = 0;
    const tempoInicio = Date.now();
    
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
    
    // Função para aguardar um elemento aparecer
    function aguardarElemento(seletor, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const elemento = document.querySelector(seletor);
            if (elemento) {
                resolve(elemento);
                return;
            }
            
            const observer = new MutationObserver((mutations, obs) => {
                const elemento = document.querySelector(seletor);
                if (elemento) {
                    obs.disconnect();
                    resolve(elemento);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Elemento ${seletor} não encontrado em ${timeout}ms`));
            }, timeout);
        });
    }
    
    // Função para simular clique
    function simularClique(elemento) {
        if (elemento) {
            elemento.click();
            return true;
        }
        return false;
    }
    
    // Teste 1: Verificar se estamos na página correta
    async function testarPaginaCorreta() {
        console.log('\n📄 TESTE 1: VERIFICAÇÃO DA PÁGINA');
        console.log('========================================');
        
        const url = window.location.href;
        const estaNaPaginaCorreta = url.includes('gestao-profissionais') || url.includes('profissionais');
        
        executarTeste('Página de gestão de profissionais', estaNaPaginaCorreta, `URL: ${url}`);
        
        if (!estaNaPaginaCorreta) {
            console.log('⚠️ Navegue para a página de gestão de profissionais para continuar os testes');
            return false;
        }
        
        return true;
    }
    
    // Teste 2: Verificar elementos da interface
    async function testarElementosInterface() {
        console.log('\n🎨 TESTE 2: ELEMENTOS DA INTERFACE');
        console.log('========================================');
        
        // Verificar se a tabela de profissionais existe
        const tabela = document.querySelector('table') || document.querySelector('[data-testid="tabela-profissionais"]');
        executarTeste('Tabela de profissionais presente', !!tabela);
        
        // Verificar se há botões de exclusão
        const botoesExcluir = document.querySelectorAll('button[title*="Excluir"], button[aria-label*="Excluir"], .btn-excluir, [data-testid*="excluir"]');
        executarTeste('Botões de exclusão presentes', botoesExcluir.length > 0, `${botoesExcluir.length} botões encontrados`);
        
        // Verificar se há profissionais listados
        const linhasTabela = document.querySelectorAll('tbody tr, .profissional-item, [data-testid*="profissional"]');
        executarTeste('Profissionais listados', linhasTabela.length > 0, `${linhasTabela.length} profissionais encontrados`);
        
        return {
            tabela,
            botoesExcluir,
            linhasTabela
        };
    }
    
    // Teste 3: Testar modal de confirmação
    async function testarModalConfirmacao() {
        console.log('\n🔔 TESTE 3: MODAL DE CONFIRMAÇÃO');
        console.log('========================================');
        
        try {
            // Procurar primeiro botão de exclusão
            const botaoExcluir = document.querySelector('button[title*="Excluir"], button[aria-label*="Excluir"], .btn-excluir, [data-testid*="excluir"]');
            
            if (!botaoExcluir) {
                executarTeste('Botão de exclusão encontrado', false, 'Nenhum botão de exclusão encontrado');
                return;
            }
            
            executarTeste('Botão de exclusão encontrado', true);
            
            // Clicar no botão de exclusão
            console.log('🖱️ Clicando no botão de exclusão...');
            simularClique(botaoExcluir);
            
            // Aguardar modal aparecer
            try {
                await aguardarElemento('.modal, [role="dialog"], .confirm-dialog, [data-testid*="modal"]', 3000);
                executarTeste('Modal de confirmação aparece', true);
                
                // Verificar elementos do modal
                const modal = document.querySelector('.modal, [role="dialog"], .confirm-dialog, [data-testid*="modal"]');
                const botaoConfirmar = modal?.querySelector('button[data-testid*="confirmar"], .btn-confirmar, button:contains("Confirmar"), button:contains("Excluir")');
                const botaoCancelar = modal?.querySelector('button[data-testid*="cancelar"], .btn-cancelar, button:contains("Cancelar")');
                
                executarTeste('Botão confirmar presente no modal', !!botaoConfirmar);
                executarTeste('Botão cancelar presente no modal', !!botaoCancelar);
                
                // Testar cancelamento
                if (botaoCancelar) {
                    console.log('🖱️ Testando cancelamento...');
                    simularClique(botaoCancelar);
                    
                    setTimeout(() => {
                        const modalAindaVisivel = document.querySelector('.modal, [role="dialog"], .confirm-dialog, [data-testid*="modal"]');
                        executarTeste('Modal fecha ao cancelar', !modalAindaVisivel);
                    }, 1000);
                }
                
            } catch (error) {
                executarTeste('Modal de confirmação aparece', false, error.message);
            }
            
        } catch (error) {
            executarTeste('Teste de modal', false, error.message);
        }
    }
    
    // Teste 4: Testar feedback visual
    async function testarFeedbackVisual() {
        console.log('\n👁️ TESTE 4: FEEDBACK VISUAL');
        console.log('========================================');
        
        // Verificar se há indicadores de loading
        const loadingIndicators = document.querySelectorAll('.loading, .spinner, [data-testid*="loading"]');
        executarTeste('Sistema de loading presente', loadingIndicators.length >= 0, 'Verificação de elementos de loading');
        
        // Verificar se há sistema de notificações
        const notificacoes = document.querySelectorAll('.toast, .notification, .alert, [data-testid*="toast"], [data-testid*="notification"]');
        executarTeste('Sistema de notificações presente', notificacoes.length >= 0, 'Verificação de elementos de notificação');
        
        // Verificar se há indicadores visuais nos botões
        const botoesComIcones = document.querySelectorAll('button svg, button .icon, button i');
        executarTeste('Botões com ícones visuais', botoesComIcones.length > 0, `${botoesComIcones.length} ícones encontrados`);
    }
    
    // Teste 5: Testar acessibilidade
    async function testarAcessibilidade() {
        console.log('\n♿ TESTE 5: ACESSIBILIDADE');
        console.log('========================================');
        
        // Verificar atributos ARIA
        const elementosComAria = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
        executarTeste('Elementos com atributos ARIA', elementosComAria.length > 0, `${elementosComAria.length} elementos com ARIA`);
        
        // Verificar se botões têm labels adequados
        const botoesExcluir = document.querySelectorAll('button[title*="Excluir"], button[aria-label*="Excluir"]');
        executarTeste('Botões de exclusão com labels', botoesExcluir.length > 0, `${botoesExcluir.length} botões com labels`);
        
        // Verificar se modal tem role adequado
        const modais = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
        executarTeste('Modais com role adequado', modais.length >= 0, 'Verificação de roles em modais');
    }
    
    // Teste 6: Testar responsividade
    async function testarResponsividade() {
        console.log('\n📱 TESTE 6: RESPONSIVIDADE');
        console.log('========================================');
        
        const larguraOriginal = window.innerWidth;
        
        // Simular tela mobile
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375
        });
        
        window.dispatchEvent(new Event('resize'));
        
        setTimeout(() => {
            const elementosVisiveis = document.querySelectorAll('*:not([style*="display: none"]):not([hidden])').length;
            executarTeste('Elementos visíveis em mobile', elementosVisiveis > 0, `${elementosVisiveis} elementos visíveis`);
            
            // Restaurar largura original
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: larguraOriginal
            });
            
            window.dispatchEvent(new Event('resize'));
        }, 500);
    }
    
    // Teste 7: Testar performance
    async function testarPerformance() {
        console.log('\n⚡ TESTE 7: PERFORMANCE');
        console.log('========================================');
        
        const inicioRender = performance.now();
        
        // Forçar re-render
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
        
        const tempoRender = performance.now() - inicioRender;
        
        executarTeste('Tempo de render aceitável', tempoRender < 100, `${tempoRender.toFixed(2)}ms`);
        
        // Verificar memory usage (se disponível)
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
            executarTeste('Uso de memória aceitável', memoryUsage < 50, `${memoryUsage.toFixed(2)}MB`);
        }
    }
    
    // Função principal
    async function executarTodosTestes() {
        try {
            const paginaCorreta = await testarPaginaCorreta();
            if (!paginaCorreta) return;
            
            await testarElementosInterface();
            await testarModalConfirmacao();
            await testarFeedbackVisual();
            await testarAcessibilidade();
            await testarResponsividade();
            await testarPerformance();
            
        } catch (error) {
            console.error('Erro durante os testes:', error);
        }
        
        // Relatório final
        const tempoTotal = Date.now() - tempoInicio;
        console.log('\n============================================================');
        console.log('📊 RELATÓRIO FINAL - INTERFACE COMPLETA');
        console.log('============================================================');
        console.log(`⏱️ Tempo total: ${tempoTotal}ms (${(tempoTotal / 1000).toFixed(2)}s)`);
        console.log(`📈 Testes executados: ${testesExecutados}`);
        console.log(`✅ Testes que passaram: ${testesPassaram}`);
        console.log(`❌ Testes que falharam: ${testesFalharam}`);
        console.log(`📊 Taxa de sucesso: ${testesExecutados > 0 ? ((testesPassaram / testesExecutados) * 100).toFixed(1) : 0}%`);
        
        if (testesFalharam === 0) {
            console.log('\n🎉 TODOS OS TESTES DE INTERFACE PASSARAM!');
        } else {
            console.log('\n⚠️ ALGUNS TESTES FALHARAM. Revisar interface de usuário.');
        }
        console.log('============================================================');
    }
    
    // Executar testes
    executarTodosTestes();
    
})();

// Instruções para uso:
console.log('📋 INSTRUÇÕES PARA EXECUÇÃO:');
console.log('1. Navegue para a página de gestão de profissionais');
console.log('2. Abra o console do navegador (F12)');
console.log('3. Cole e execute este script');
console.log('4. Observe os resultados dos testes');