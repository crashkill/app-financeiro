// Teste da nova implementação de download direto
const fs = require('fs');
const path = require('path');

// URL de download direto do HITSS
const DOWNLOAD_URL = 'https://hitsscontrol.globalhitss.com.br/api/api/export/xls?clienteFiltro=&servicoFiltro=-1&tipoFiltro=-1&projetoFiltro=&projetoAtivoFiltro=true&projetoParalisadoFiltro=true&projetoEncerradoFiltro=true&projetoCanceladoFiltro=true&responsavelareaFiltro=&idResponsavelareaFiltro=&responsavelprojetoFiltro=FABRICIO%20CARDOSO%20DE%20LIMA&idresponsavelprojetoFiltro=78&filtroDeFiltro=09-2016&filtroAteFiltro=08-2025&visaoFiltro=PROJ&usuarioFiltro=fabricio.lima&idusuarioFiltro=78&perfilFiltro=RESPONSAVEL_DELIVERY%7CRESPONSAVEL_LANCAMENTO%7CVISITANTE&telaFiltro=painel_projetos';

async function testDirectDownload() {
  console.log('🚀 Testando download direto do arquivo HITSS...');
  console.log('📍 URL:', DOWNLOAD_URL);
  
  try {
    const startTime = Date.now();
    
    console.log('📥 Iniciando requisição...');
    const response = await fetch(DOWNLOAD_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 300000 // 5 minutos
    });
    
    console.log('📊 Status da resposta:', response.status, response.statusText);
    console.log('📋 Headers da resposta:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const downloadTime = Date.now() - startTime;
    
    console.log(`✅ Download concluído em ${downloadTime}ms`);
    console.log(`📦 Tamanho do arquivo: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
    
    // Salvar arquivo para verificação
    const fileName = `hitss_test_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`💾 Arquivo salvo em: ${filePath}`);
    
    // Verificar se é um arquivo Excel válido
    const fileHeader = buffer.slice(0, 4);
    const isExcel = fileHeader[0] === 0x50 && fileHeader[1] === 0x4B; // PK (ZIP signature)
    
    console.log(`📄 Arquivo é Excel válido: ${isExcel ? 'SIM' : 'NÃO'}`);
    
    if (isExcel) {
      console.log('🎉 Teste de download direto PASSOU!');
      return true;
    } else {
      console.log('❌ Arquivo baixado não é um Excel válido');
      console.log('🔍 Primeiros 100 caracteres do arquivo:');
      console.log(buffer.slice(0, 100).toString());
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de download direto:', error.message);
    console.error('📋 Stack trace:', error.stack);
    return false;
  }
}

// Executar teste
if (require.main === module) {
  testDirectDownload()
    .then(success => {
      console.log(`\n${success ? '✅ SUCESSO' : '❌ FALHA'}: Teste de download direto`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testDirectDownload };