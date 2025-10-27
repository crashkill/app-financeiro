// Script para testar a funcionalidade no navegador
console.log('🧪 Iniciando teste de exclusão de profissionais no navegador...');

// Função para aguardar um elemento aparecer
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Elemento ${selector} não encontrado em ${timeout}ms`));
        }, timeout);
    });
}

// Função para simular clique
function clickElement(element) {
    element.click();
    console.log('✅ Clique realizado em:', element);
}

// Função principal de teste
async function testExclusaoProfissionais() {
    try {
        console.log('📍 URL atual:', window.location.href);
        
        // Verificar se estamos na página de login
        if (window.location.pathname === '/login' || window.location.pathname === '/') {
            console.log('🔐 Detectada página de login. Tentando fazer login...');
            
            // Tentar fazer login automático (se houver campos)
            const emailInput = document.querySelector('input[type="email"]');
            const passwordInput = document.querySelector('input[type="password"]');
            const loginButton = document.querySelector('button[type="submit"]');
            
            if (emailInput && passwordInput && loginButton) {
                emailInput.value = 'teste@teste.com';
                passwordInput.value = '123456';
                clickElement(loginButton);
                
                // Aguardar redirecionamento
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Navegar para gestão de profissionais
        if (!window.location.pathname.includes('/gestao-profissionais')) {
            console.log('🧭 Navegando para gestão de profissionais...');
            window.location.href = '/gestao-profissionais';
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        console.log('📋 Verificando se estamos na página de gestão de profissionais...');
        
        // Aguardar a tabela de profissionais carregar
        const tabela = await waitForElement('table, .table, [data-testid="tabela-profissionais"]');
        console.log('✅ Tabela de profissionais encontrada:', tabela);
        
        // Procurar botões de exclusão
        const botoesExclusao = document.querySelectorAll('button[title*="Excluir"], button[aria-label*="Excluir"], .btn-danger, [data-testid*="delete"], [data-testid*="excluir"]');
        console.log(`🗑️ Encontrados ${botoesExclusao.length} botões de exclusão`);
        
        if (botoesExclusao.length > 0) {
            console.log('🎯 Testando exclusão do primeiro profissional...');
            
            // Clicar no primeiro botão de exclusão
            clickElement(botoesExclusao[0]);
            
            // Aguardar modal de confirmação
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Procurar botão de confirmação no modal
            const botaoConfirmar = await waitForElement('button:contains("Confirmar"), button:contains("Excluir"), .btn-danger:not(:disabled)');
            
            if (botaoConfirmar) {
                console.log('✅ Modal de confirmação encontrado');
                clickElement(botaoConfirmar);
                
                // Aguardar a exclusão ser processada
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log('🎉 Teste de exclusão concluído!');
                
                // Verificar se a tabela foi atualizada
                const novaTabela = document.querySelector('table, .table, [data-testid="tabela-profissionais"]');
                const novosBotoesExclusao = document.querySelectorAll('button[title*="Excluir"], button[aria-label*="Excluir"], .btn-danger, [data-testid*="delete"], [data-testid*="excluir"]');
                
                console.log(`📊 Botões de exclusão após teste: ${novosBotoesExclusao.length}`);
                
                if (novosBotoesExclusao.length < botoesExclusao.length) {
                    console.log('✅ SUCESSO: Profissional foi removido da listagem!');
                } else {
                    console.log('⚠️ ATENÇÃO: Número de profissionais não diminuiu');
                }
            } else {
                console.log('❌ Modal de confirmação não encontrado');
            }
        } else {
            console.log('⚠️ Nenhum botão de exclusão encontrado. Verificando se há profissionais...');
            
            // Verificar se há profissionais na tabela
            const linhas = document.querySelectorAll('tbody tr, .table-row, [data-testid*="profissional"]');
            console.log(`📊 Encontradas ${linhas.length} linhas de profissionais`);
            
            if (linhas.length === 0) {
                console.log('📝 Nenhum profissional encontrado. Criando um para teste...');
                
                // Procurar botão de adicionar
                const botaoAdicionar = document.querySelector('button:contains("Adicionar"), button:contains("Novo"), .btn-primary, [data-testid*="add"]');
                
                if (botaoAdicionar) {
                    clickElement(botaoAdicionar);
                    console.log('✅ Botão de adicionar clicado');
                } else {
                    console.log('❌ Botão de adicionar não encontrado');
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}

// Executar o teste
testExclusaoProfissionais();