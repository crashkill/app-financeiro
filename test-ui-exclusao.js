/**
 * TESTE DE EXCLUSÃO VIA INTERFACE DO USUÁRIO
 * Script para testar a funcionalidade de exclusão diretamente na UI
 * Versão atualizada para testes extensivos
 */

// Aguardar a página carregar
function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

// Aguardar elemento aparecer
function waitForElement(selector, timeout = 10000) {
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

// Simular clique
function clickElement(element) {
  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(event);
}

// Aguardar um tempo
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de teste
async function testarExclusaoUI() {
  console.log('🎯 INICIANDO TESTE DE EXCLUSÃO VIA UI');
  console.log('=' .repeat(50));

  try {
    // 1. Aguardar página carregar
    await waitForPageLoad();
    console.log('✅ Página carregada');

    // 2. Navegar para gestão de profissionais se não estiver lá
    if (!window.location.pathname.includes('gestao-profissionais')) {
      console.log('🔄 Navegando para gestão de profissionais...');
      window.location.href = '/gestao-profissionais';
      await sleep(2000);
    }

    // 3. Aguardar tabela de profissionais carregar
    console.log('📋 Aguardando tabela de profissionais...');
    const tabela = await waitForElement('table, .table, [data-testid="tabela-profissionais"]');
    console.log('✅ Tabela encontrada:', tabela);

    // 4. Verificar se há profissionais
    const linhas = document.querySelectorAll('tbody tr');
    console.log(`📊 Encontradas ${linhas.length} linhas na tabela`);

    if (linhas.length === 0) {
      console.log('⚠️ Nenhum profissional encontrado para testar exclusão');
      return;
    }

    // 5. Procurar botões de exclusão
    const botoesExclusao = document.querySelectorAll('button[title*="Excluir"], button[aria-label*="Excluir"], .btn-danger, [data-testid*="delete"], [data-testid*="excluir"]');
    console.log(`🗑️ Encontrados ${botoesExclusao.length} botões de exclusão`);

    if (botoesExclusao.length === 0) {
      console.log('❌ Nenhum botão de exclusão encontrado');
      return;
    }

    // 6. Testar exclusão do primeiro profissional
    console.log('🎯 Testando exclusão do primeiro profissional...');
    
    // Capturar informações antes da exclusão
    const totalAntes = linhas.length;
    const primeiroProfissional = linhas[0].textContent;
    console.log(`📝 Profissional a ser excluído: ${primeiroProfissional.substring(0, 100)}...`);

    // Clicar no primeiro botão de exclusão
    clickElement(botoesExclusao[0]);
    console.log('✅ Clicou no botão de exclusão');

    // 7. Aguardar modal de confirmação
    console.log('⏳ Aguardando modal de confirmação...');
    await sleep(1000);

    const modal = await waitForElement('.modal, [role="dialog"], .modal-dialog');
    console.log('✅ Modal de confirmação encontrado:', modal);

    // 8. Procurar botão de confirmação no modal
    const botaoConfirmar = await waitForElement('button:contains("Confirmar"), button:contains("Excluir"), .btn-danger:not(:disabled)');
    console.log('✅ Botão de confirmação encontrado:', botaoConfirmar);

    // 9. Confirmar exclusão
    clickElement(botaoConfirmar);
    console.log('✅ Clicou no botão de confirmação');

    // 10. Aguardar processamento
    console.log('⏳ Aguardando processamento da exclusão...');
    await sleep(3000);

    // 11. Verificar se o profissional foi removido
    const novasLinhas = document.querySelectorAll('tbody tr');
    const totalDepois = novasLinhas.length;
    
    console.log(`📊 Total antes: ${totalAntes}, Total depois: ${totalDepois}`);

    if (totalDepois < totalAntes) {
      console.log('🎉 SUCESSO! Profissional foi removido da listagem');
      console.log(`✅ Redução de ${totalAntes - totalDepois} profissional(is)`);
    } else {
      console.log('⚠️ ATENÇÃO: Número de profissionais não diminuiu');
      console.log('🔍 Verificando se houve atualização na tabela...');
      
      // Verificar se o conteúdo mudou
      const novoConteudo = novasLinhas[0]?.textContent;
      if (novoConteudo !== primeiroProfissional) {
        console.log('✅ Conteúdo da tabela foi atualizado');
      } else {
        console.log('❌ Conteúdo da tabela não mudou');
      }
    }

    // 12. Verificar se há mensagens de sucesso/erro
    const alertas = document.querySelectorAll('.alert, .toast, .notification, [role="alert"]');
    if (alertas.length > 0) {
      console.log('📢 Mensagens encontradas:');
      alertas.forEach((alerta, index) => {
        console.log(`  ${index + 1}. ${alerta.textContent.trim()}`);
      });
    }

    console.log('\n🎯 TESTE DE EXCLUSÃO VIA UI CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testarExclusaoUI().catch(console.error);

// Disponibilizar função globalmente para uso manual
window.testarExclusaoUI = testarExclusaoUI;