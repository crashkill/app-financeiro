const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar agent HTTPS para ignorar certificados SSL
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function hitssAutomation() {
  try {
    console.log('🚀 Iniciando automação HITSS...');
    
    // URL de exportação fornecida
    const exportUrl = 'https://hitsscontrol.globalhitss.com.br/api/api/export/xls?clienteFiltro=&servicoFiltro=-1&tipoFiltro=-1&projetoFiltro=&projetoAtivoFiltro=true&projetoParalisadoFiltro=true&projetoEncerradoFiltro=true&projetoCanceladoFiltro=true&responsavelareaFiltro=&idResponsavelareaFiltro=&responsavelprojetoFiltro=FABRICIO%20CARDOSO%20DE%20LIMA&idresponsavelprojetoFiltro=78&filtroDeFiltro=09-2016&filtroAteFiltro=08-2025&visaoFiltro=PROJ&usuarioFiltro=fabricio.lima&idusuarioFiltro=78&perfilFiltro=RESPONSAVEL_DELIVERY%7CRESPONSAVEL_LANCAMENTO%7CVISITANTE&telaFiltro=painel_projetos';
    
    console.log('📥 Fazendo download do arquivo XLSX...');
    
    // Fazer download do arquivo
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      agent: httpsAgent
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('📊 Processando arquivo XLSX...');
    
    // Ler e processar XLSX
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ Processados ${jsonData.length} registros`);
    
    // Salvar arquivo localmente para backup
    const filename = `hitss-export-${Date.now()}.xlsx`;
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`💾 Arquivo salvo em: ${filepath}`);
    
    // Upload para Supabase Storage
    console.log('☁️ Fazendo upload para Supabase Storage...');
    const { error: storageError } = await supabase.storage
      .from('imports')
      .upload(filename, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    
    if (storageError) {
      console.warn('⚠️ Erro no upload para storage:', storageError.message);
    } else {
      console.log('✅ Upload para storage concluído');
    }
    
    // Inserir dados na tabela (ajustar nome da tabela conforme necessário)
    if (jsonData.length > 0) {
      console.log('📝 Inserindo dados no banco...');
      const { error: insertError } = await supabase
        .from('hitss_projetos') // ajustar nome da tabela
        .insert(jsonData);
      
      if (insertError) {
        console.warn('⚠️ Erro na inserção:', insertError.message);
      } else {
        console.log('✅ Dados inseridos com sucesso');
      }
    }
    
    // Limpar arquivo local
    fs.unlinkSync(filepath);
    console.log('🧹 Arquivo local removido');
    
    console.log('🎉 Automação HITSS concluída com sucesso!');
    return {
      success: true,
      records: jsonData.length,
      filename
    };
    
  } catch (error) {
    console.error('❌ Erro na automação HITSS:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  hitssAutomation()
    .then(result => {
      console.log('📊 Resultado:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { hitssAutomation };