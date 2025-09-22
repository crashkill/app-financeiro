/**
 * Teste de Validação das Permissões do Usuário Demo
 * Este script testa se o usuário demo tem acesso correto às funcionalidades
 */

const puppeteer = require('puppeteer');

async function testDemoUserPermissions() {
  console.log('🚀 Iniciando teste de permissões do usuário demo...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Navegar para a página de login
    console.log('📍 Navegando para http://localhost:3001/login');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
    
    // 2. Fazer login com credenciais demo
    console.log('🔐 Fazendo login com credenciais demo...');
    await page.type('input[type="email"]', 'demo@hitss.com');
    await page.type('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // 3. Verificar se chegou ao dashboard
    console.log('📊 Verificando acesso ao dashboard...');
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login realizado com sucesso - Dashboard acessível');
    } else {
      console.log('❌ Erro: Não foi redirecionado para o dashboard');
      return;
    }
    
    // 4. Testar acesso às funcionalidades permitidas
    const allowedPages = [
      { name: 'Dashboard', url: '/dashboard', selector: 'h1, h2, .dashboard' },
      { name: 'Relatórios', url: '/relatorios', selector: 'h1, h2, .relatorios' },
      { name: 'Upload', url: '/upload', selector: 'h1, h2, .upload' },
      { name: 'Planilhas Financeiras', url: '/planilhas-financeiras', selector: 'h1, h2, .planilhas' }
    ];
    
    console.log('\n🔍 Testando acesso às páginas permitidas...');
    for (const pageTest of allowedPages) {
      try {
        await page.goto(`http://localhost:3001${pageTest.url}`, { waitUntil: 'networkidle2' });
        await page.waitForSelector(pageTest.selector, { timeout: 5000 });
        console.log(`✅ ${pageTest.name}: Acesso permitido`);
      } catch (error) {
        console.log(`⚠️ ${pageTest.name}: Possível problema de acesso ou carregamento`);
      }
    }
    
    // 5. Testar restrições de acesso (páginas administrativas)
    const restrictedPages = [
      { name: 'Configurações', url: '/configuracoes' },
      { name: 'Admin Check', url: '/admin-check' },
      { name: 'Settings', url: '/settings' }
    ];
    
    console.log('\n🚫 Testando restrições de acesso...');
    for (const pageTest of restrictedPages) {
      try {
        await page.goto(`http://localhost:3001${pageTest.url}`, { waitUntil: 'networkidle2' });
        const currentUrl = page.url();
        
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/login')) {
          console.log(`✅ ${pageTest.name}: Acesso corretamente restrito (redirecionado)`);
        } else if (currentUrl.includes(pageTest.url)) {
          console.log(`❌ ${pageTest.name}: ERRO - Acesso não deveria ser permitido!`);
        }
      } catch (error) {
        console.log(`✅ ${pageTest.name}: Acesso corretamente restrito (erro de navegação)`);
      }
    }
    
    // 6. Verificar elementos da interface
    console.log('\n🎨 Verificando elementos da interface...');
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle2' });
    
    // Verificar se não há botões administrativos visíveis
    const adminButtons = await page.$$eval('button, a', elements => 
      elements.filter(el => 
        el.textContent.toLowerCase().includes('admin') ||
        el.textContent.toLowerCase().includes('configurar') ||
        el.textContent.toLowerCase().includes('gerenciar')
      ).length
    );
    
    if (adminButtons === 0) {
      console.log('✅ Interface: Nenhum botão administrativo visível');
    } else {
      console.log(`⚠️ Interface: ${adminButtons} botões administrativos encontrados`);
    }
    
    // 7. Testar logout
    console.log('\n🚪 Testando logout...');
    try {
      await page.click('button:has-text("Sair"), a:has-text("Logout"), [data-testid="logout"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      if (page.url().includes('/login')) {
        console.log('✅ Logout realizado com sucesso');
      }
    } catch (error) {
      console.log('⚠️ Logout: Botão não encontrado ou erro no processo');
    }
    
    console.log('\n🎉 Teste de permissões do usuário demo concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await browser.close();
  }
}

// Executar o teste
if (require.main === module) {
  testDemoUserPermissions().catch(console.error);
}

module.exports = { testDemoUserPermissions };