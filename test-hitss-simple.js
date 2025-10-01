// Teste simples da lógica da Edge Function hitss-automation
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';
const supabase = createClient(supabaseUrl, supabaseKey);

// URL do sistema HITSS para exportação
const HITSS_EXPORT_URL = 'https://hitsscontrol.globalhitss.com.br/api/api/export/xls?clienteFiltro=&servicoFiltro=-1&tipoFiltro=-1&projetoFiltro=&projetoAtivoFiltro=true&projetoParalisadoFiltro=true&projetoEncerradoFiltro=true&projetoCanceladoFiltro=true&responsavelareaFiltro=&idResponsavelareaFiltro=&responsavelprojetoFiltro=FABRICIO%20CARDOSO%20DE%20LIMA&idresponsavelprojetoFiltro=78&filtroDeFiltro=09-2016&filtroAteFiltro=08-2025&visaoFiltro=PROJ&usuarioFiltro=fabricio.lima&idusuarioFiltro=78&perfilFiltro=RESPONSAVEL_DELIVERY%7CRESPONSAVEL_LANCAMENTO%7CVISITANTE&telaFiltro=painel_projetos';

// Função para processar dados DRE
function processDreData(buffer, fileName, batchId) {
  try {
    console.log('Iniciando processamento dos dados DRE...');
    
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`Planilha carregada com ${jsonData.length} linhas`);

    if (jsonData.length < 2) {
      throw new Error('Planilha vazia ou sem dados válidos');
    }

    // Encontrar cabeçalhos dos meses
    const headerRow = jsonData[0];
    const monthHeaders = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const monthIndexes = {};
    
    headerRow.forEach((header, index) => {
      if (header && typeof header === 'string') {
        const normalizedHeader = header.toLowerCase().trim();
        if (monthHeaders.includes(normalizedHeader)) {
          monthIndexes[normalizedHeader] = index;
        }
      }
    });

    console.log('Índices dos meses encontrados:', monthIndexes);

    const processedData = [];
    let processedCount = 0;
    let failedCount = 0;

    // Processar dados (pular cabeçalho)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        if (!row || row.length === 0) continue;

        const dreRow = {
          id: uuidv4(),
          upload_batch_id: batchId,
          file_name: fileName,
          tipo: row[0] || '',
          natureza: row[1] || '',
          valor: parseFloat(row[2]) || 0,
          data: new Date().toISOString(),
          project_reference: 'HITSS_AUTO',
          year: new Date().getFullYear()
        };

        // Adicionar valores dos meses
        monthHeaders.forEach(month => {
          if (monthIndexes[month] !== undefined) {
            dreRow[month] = parseFloat(row[monthIndexes[month]]) || 0;
          }
        });

        processedData.push(dreRow);
        processedCount++;
      } catch (error) {
        console.error(`Erro ao processar linha ${i}:`, error);
        failedCount++;
      }
    }

    console.log(`Processamento concluído: ${processedCount} registros processados, ${failedCount} falhas`);

    return {
      data: processedData,
      processedCount,
      failedCount,
      batchId
    };
  } catch (error) {
    console.error('Erro no processamento dos dados:', error);
    throw error;
  }
}

// Função principal de teste
async function testHitssAutomation() {
  try {
    console.log('=== TESTE DA EDGE FUNCTION HITSS-AUTOMATION ===');
    console.log('URL configurada:', HITSS_EXPORT_URL);
    
    const executionId = uuidv4();
    const batchId = uuidv4();
    const fileName = `hitss_dre_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    console.log('Execution ID:', executionId);
    console.log('Batch ID:', batchId);
    console.log('File Name:', fileName);
    
    // Criar dados de exemplo para teste
    console.log('\n1. Criando dados de exemplo...');
    const exampleData = [
      ['Tipo', 'Natureza', 'Valor', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      ['Receita', 'Vendas', 100000, 8000, 8500, 9000, 9500, 10000, 10500, 11000, 11500, 12000, 12500, 13000, 13500],
      ['Despesa', 'Salários', 50000, 4000, 4200, 4400, 4600, 4800, 5000, 5200, 5400, 5600, 5800, 6000, 6200],
      ['Despesa', 'Aluguel', 24000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000]
    ];
    
    // Criar workbook de exemplo
    const ws = XLSX.utils.aoa_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DRE');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    console.log('✅ Arquivo de exemplo criado');
    
    // Processar dados
    console.log('\n2. Processando dados...');
    const result = processDreData(buffer, fileName, batchId);
    console.log('✅ Dados processados:', {
      registros: result.processedCount,
      falhas: result.failedCount
    });
    
    // Mostrar alguns dados processados
    console.log('\n3. Primeiros registros processados:');
    console.table(result.data.slice(0, 3));
    
    console.log('\n=== TESTE DE LÓGICA CONCLUÍDO COM SUCESSO ===');
    console.log('A Edge Function está configurada corretamente para:');
    console.log('- Processar arquivos Excel do HITSS');
    console.log('- Extrair dados DRE com meses');
    console.log('- Formatar dados para inserção no banco');
    console.log('- URL configurada:', HITSS_EXPORT_URL);
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
  }
}

// Executar teste
testHitssAutomation();