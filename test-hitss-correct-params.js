const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Desabilitar verificação SSL globalmente
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar agente HTTPS
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  checkServerIdentity: () => undefined
});

// Função para buscar segredos do Vault
async function getVaultSecret(name) {
  try {
    const { data, error } = await supabase.rpc('get_secret', { 
      secret_name: name 
    });

    if (error) {
      throw new Error(`Erro ao buscar segredo ${name}: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Erro ao buscar segredo ${name}:`, error.message);
    throw error;
  }
}

async function testHitssWithCorrectParams() {
  console.log('🔍 Testando API HITSS com parâmetros corretos...\n');

  try {
    // Buscar credenciais do Vault
    console.log('🔐 Buscando credenciais do Vault...');
    const username = await getVaultSecret('hitss_username');
    const password = await getVaultSecret('hitss_password');
    const baseUrl = await getVaultSecret('hitss_base_url');
    
    console.log(`✅ Credenciais obtidas - Usuário: ${username}`);
    console.log(`✅ URL base: ${baseUrl}\n`);

    // Parâmetros corretos baseados no código existente
    const url = `${baseUrl}/api/api/export/xls`;
    const params = new URLSearchParams({
      clienteFiltro: '',
      servicoFiltro: '-1',
      tipoFiltro: '-1',
      projetoFiltro: '',
      projetoAtivoFiltro: 'true',
      projetoParalisadoFiltro: 'true',
      projetoEncerradoFiltro: 'true',
      projetoCanceladoFiltro: 'true',
      responsavelareaFiltro: '',
      idResponsavelareaFiltro: '',
      responsavelprojetoFiltro: 'FABRICIO CARDOSO DE LIMA',
      idresponsavelprojetoFiltro: '78',
      filtroDeFiltro: '09-2016',
      filtroAteFiltro: '08-2025',
      visaoFiltro: 'PROJ',
      usuarioFiltro: 'fabricio.lima',
      idusuarioFiltro: '78',
      perfilFiltro: 'RESPONSAVEL_DELIVERY|RESPONSAVEL_LANCAMENTO|VISITANTE',
      telaFiltro: 'painel_projetos'
    });

    // Criar string de autenticação básica
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    console.log('📡 Fazendo requisição com parâmetros corretos...');
    console.log(`URL: ${url}`);
    console.log(`Parâmetros: ${params.toString()}\n`);

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
      },
      agent: httpsAgent
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📏 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`📦 Content-Length: ${response.headers.get('content-length')}`);

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      console.log(`✅ Arquivo baixado com sucesso: ${buffer.byteLength} bytes`);
      
      // Verificar se é realmente um arquivo Excel
      const uint8Array = new Uint8Array(buffer);
      const header = Array.from(uint8Array.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log(`🔍 Header do arquivo: ${header}`);
      
      if (header === '504b0304' || header.startsWith('d0cf11e0')) {
        console.log('✅ Arquivo parece ser um Excel válido!');
      } else {
        console.log('⚠️ Arquivo pode não ser um Excel válido');
      }
      
    } else {
      const text = await response.text();
      console.log(`❌ Erro na requisição:`);
      console.log(`Resposta: ${text}`);
    }

  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
}

// Executar teste
testHitssWithCorrectParams();