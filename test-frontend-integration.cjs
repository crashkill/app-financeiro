const https = require('https');

// Configuração da Edge Function
const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

/**
 * Simula o comportamento do financialDataService.getAvailableProjects()
 */
async function testGetAvailableProjects() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ type: 'projetos' });
    
    const options = {
      hostname: 'oomhhhfahdvavnhlbioa.supabase.co',
      port: 443,
      path: '/functions/v1/financial-data-unified',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Teste getAvailableProjects:');
          console.log(`   Status: ${res.statusCode}`);
          if (res.statusCode !== 200) {
            console.log('   Resposta de erro:', response);
          }
          console.log(`   Projetos encontrados: ${response.data?.projetos?.length || 0}`);
          console.log(`   Primeiros 5 projetos:`, response.data?.projetos?.slice(0, 5));
          resolve(response.data?.projetos || []);
        } catch (error) {
          console.error('❌ Erro ao parsear resposta de projetos:', error);
          console.error('   Resposta bruta:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição de projetos:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Simula o comportamento do financialDataService.getAvailableYears()
 */
async function testGetAvailableYears() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ type: 'anos' });
    
    const options = {
      hostname: 'oomhhhfahdvavnhlbioa.supabase.co',
      port: 443,
      path: '/functions/v1/financial-data-unified',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Teste getAvailableYears:');
          console.log(`   Status: ${res.statusCode}`);
          if (res.statusCode !== 200) {
            console.log('   Resposta de erro:', response);
          }
          console.log(`   Anos encontrados: ${response.data?.anos?.length || 0}`);
          console.log(`   Anos:`, response.data?.anos);
          resolve(response.data?.anos || []);
        } catch (error) {
          console.error('❌ Erro ao parsear resposta de anos:', error);
          console.error('   Resposta bruta:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição de anos:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Simula o comportamento do Dashboard ao carregar dados
 */
async function testDashboardDataFlow() {
  console.log('🧪 Testando fluxo de dados do Dashboard...\n');
  
  try {
    // Simular loadProjectsAndYears()
    console.log('📊 Carregando projetos e anos...');
    const [projects, years] = await Promise.all([
      testGetAvailableProjects(),
      testGetAvailableYears()
    ]);
    
    console.log('\n📈 Resultados do carregamento:');
    console.log(`   Total de projetos: ${projects.length}`);
    console.log(`   Total de anos: ${years.length}`);
    
    // Verificar se os dados estão no formato esperado pelo frontend
    const isProjectsValid = Array.isArray(projects) && projects.every(p => typeof p === 'string');
    const isYearsValid = Array.isArray(years) && years.every(y => typeof y === 'number');
    
    console.log('\n🔍 Validação dos dados:');
    console.log(`   Projetos válidos: ${isProjectsValid ? '✅' : '❌'}`);
    console.log(`   Anos válidos: ${isYearsValid ? '✅' : '❌'}`);
    
    if (!isProjectsValid) {
      console.log('   Tipo dos projetos:', projects.map(p => typeof p));
    }
    
    if (!isYearsValid) {
      console.log('   Tipo dos anos:', years.map(y => typeof y));
    }
    
    // Simular seleção inicial do Dashboard
    const currentYear = new Date().getFullYear();
    const selectedYear = currentYear.toString();
    const selectedProjects = []; // Vazio = todos os projetos
    
    console.log('\n🎯 Simulando seleção inicial:');
    console.log(`   Ano selecionado: ${selectedYear}`);
    console.log(`   Projetos selecionados: ${selectedProjects.length === 0 ? 'Todos' : selectedProjects.join(', ')}`);
    
    // Verificar se o ano atual está disponível
    const isCurrentYearAvailable = years.includes(currentYear);
    console.log(`   Ano atual (${currentYear}) disponível: ${isCurrentYearAvailable ? '✅' : '❌'}`);
    
    if (!isCurrentYearAvailable && years.length > 0) {
      console.log(`   Ano mais recente disponível: ${Math.max(...years)}`);
    }
    
    return {
      projects,
      years,
      isValid: isProjectsValid && isYearsValid,
      currentYearAvailable: isCurrentYearAvailable
    };
    
  } catch (error) {
    console.error('❌ Erro no teste do fluxo de dados:', error);
    throw error;
  }
}

// Executar o teste
async function runTests() {
  console.log('🚀 Iniciando testes de integração frontend...\n');
  
  try {
    const results = await testDashboardDataFlow();
    
    console.log('\n📋 Resumo dos testes:');
    console.log(`   Status geral: ${results.isValid ? '✅ SUCESSO' : '❌ FALHA'}`);
    console.log(`   Projetos carregados: ${results.projects.length}`);
    console.log(`   Anos carregados: ${results.years.length}`);
    console.log(`   Ano atual disponível: ${results.currentYearAvailable ? 'Sim' : 'Não'}`);
    
    if (results.isValid) {
      console.log('\n🎉 Todos os testes passaram! O frontend deve conseguir carregar os filtros corretamente.');
    } else {
      console.log('\n⚠️  Alguns testes falharam. Verifique os dados retornados pela Edge Function.');
    }
    
  } catch (error) {
    console.error('\n💥 Falha crítica nos testes:', error.message);
    process.exit(1);
  }
}

// Executar os testes
runTests();