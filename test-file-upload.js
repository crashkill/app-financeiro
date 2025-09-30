import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bold}[${step}]${colors.reset} ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Gerar dados de teste DRE
function generateTestDREData() {
  const testData = [
    ['Código', 'Descrição', 'Valor', 'Tipo', 'Data'],
    ['3.01.01', 'Receita Bruta de Vendas', '1500000.00', 'Receita', '2024-01-01'],
    ['3.01.02', 'Deduções da Receita Bruta', '-150000.00', 'Dedução', '2024-01-01'],
    ['3.02.01', 'Custo dos Produtos Vendidos', '-800000.00', 'Custo', '2024-01-01'],
    ['3.03.01', 'Despesas Comerciais', '-200000.00', 'Despesa', '2024-01-01'],
    ['3.03.02', 'Despesas Administrativas', '-180000.00', 'Despesa', '2024-01-01'],
    ['3.04.01', 'Receitas Financeiras', '25000.00', 'Receita', '2024-01-01'],
    ['3.04.02', 'Despesas Financeiras', '-45000.00', 'Despesa', '2024-01-01'],
    ['3.05.01', 'Resultado Antes do IR', '150000.00', 'Resultado', '2024-01-01'],
    ['3.06.01', 'Provisão para IR e CSLL', '-37500.00', 'Provisão', '2024-01-01'],
    ['3.07.01', 'Lucro Líquido do Exercício', '112500.00', 'Resultado', '2024-01-01']
  ];
  
  return testData.map(row => row.join(',')).join('\n');
}

// Gerar arquivo Excel simulado (CSV)
function generateTestExcelData() {
  const excelData = [
    ['A', 'B', 'C', 'D', 'E'],
    ['Código DRE', 'Descrição da Conta', 'Valor Atual', 'Valor Anterior', 'Variação'],
    ['3.01', 'RECEITA OPERACIONAL BRUTA', '1500000', '1400000', '7.14%'],
    ['3.01.01', 'Vendas de Produtos', '1200000', '1100000', '9.09%'],
    ['3.01.02', 'Prestação de Serviços', '300000', '300000', '0.00%'],
    ['3.02', 'DEDUÇÕES DA RECEITA BRUTA', '-150000', '-140000', '7.14%'],
    ['3.02.01', 'Impostos sobre Vendas', '-120000', '-112000', '7.14%'],
    ['3.02.02', 'Devoluções e Cancelamentos', '-30000', '-28000', '7.14%'],
    ['3.03', 'RECEITA OPERACIONAL LÍQUIDA', '1350000', '1260000', '7.14%'],
    ['3.04', 'CUSTOS DOS PRODUTOS/SERVIÇOS', '-800000', '-750000', '6.67%'],
    ['3.05', 'LUCRO BRUTO', '550000', '510000', '7.84%'],
    ['3.06', 'DESPESAS OPERACIONAIS', '-380000', '-360000', '5.56%'],
    ['3.06.01', 'Despesas Comerciais', '-200000', '-190000', '5.26%'],
    ['3.06.02', 'Despesas Administrativas', '-180000', '-170000', '5.88%'],
    ['3.07', 'RESULTADO OPERACIONAL', '170000', '150000', '13.33%'],
    ['3.08', 'RESULTADO FINANCEIRO', '-20000', '-15000', '33.33%'],
    ['3.08.01', 'Receitas Financeiras', '25000', '20000', '25.00%'],
    ['3.08.02', 'Despesas Financeiras', '-45000', '-35000', '28.57%'],
    ['3.09', 'RESULTADO ANTES DO IR', '150000', '135000', '11.11%'],
    ['3.10', 'PROVISÃO PARA IR E CSLL', '-37500', '-33750', '11.11%'],
    ['3.11', 'LUCRO LÍQUIDO DO EXERCÍCIO', '112500', '101250', '11.11%']
  ];
  
  return excelData.map(row => row.join(',')).join('\n');
}

async function testFileUpload() {
  log('📁 TESTANDO UPLOAD DE ARQUIVOS DRE', 'bold');
  log('='.repeat(50));
  
  const uploadResults = [];
  
  try {
    // 1. Verificar se o bucket existe
    logStep('1/6', 'Verificando bucket dre_reports...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      logError(`Erro ao listar buckets: ${bucketsError.message}`);
      throw bucketsError;
    }
    
    const dreBucket = buckets.find(bucket => bucket.name === 'dre_reports');
    
    if (dreBucket) {
      logSuccess('Bucket dre_reports encontrado');
      log(`   • ID: ${dreBucket.id}`);
      log(`   • Criado: ${dreBucket.created_at}`);
      log(`   • Público: ${dreBucket.public ? 'Sim' : 'Não'}`);
    } else {
      logError('Bucket dre_reports não encontrado');
      throw new Error('Bucket dre_reports não existe');
    }
    
    // 2. Testar upload de arquivo CSV DRE
    logStep('2/6', 'Testando upload de arquivo CSV DRE...');
    
    const csvData = generateTestDREData();
    const csvFileName = `test-dre-${Date.now()}.csv`;
    
    const { data: csvUpload, error: csvError } = await supabase.storage
      .from('dre_reports')
      .upload(csvFileName, csvData, {
        contentType: 'text/csv',
        upsert: false
      });
    
    if (csvError) {
      logError(`Erro no upload CSV: ${csvError.message}`);
    } else {
      logSuccess(`Arquivo CSV enviado: ${csvFileName}`);
      uploadResults.push({
        type: 'CSV',
        fileName: csvFileName,
        path: csvUpload.path,
        size: csvData.length
      });
      log(`   • Caminho: ${csvUpload.path}`);
      log(`   • Tamanho: ${csvData.length} bytes`);
    }
    
    // 3. Testar upload de arquivo Excel simulado
    logStep('3/6', 'Testando upload de arquivo Excel simulado...');
    
    const excelData = generateTestExcelData();
    const excelFileName = `test-excel-dre-${Date.now()}.csv`;
    
    const { data: excelUpload, error: excelError } = await supabase.storage
      .from('dre_reports')
      .upload(excelFileName, excelData, {
        contentType: 'application/vnd.ms-excel',
        upsert: false
      });
    
    if (excelError) {
      logError(`Erro no upload Excel: ${excelError.message}`);
    } else {
      logSuccess(`Arquivo Excel enviado: ${excelFileName}`);
      uploadResults.push({
        type: 'Excel',
        fileName: excelFileName,
        path: excelUpload.path,
        size: excelData.length
      });
      log(`   • Caminho: ${excelUpload.path}`);
      log(`   • Tamanho: ${excelData.length} bytes`);
    }
    
    // 4. Listar arquivos no bucket
    logStep('4/6', 'Listando arquivos no bucket...');
    
    const { data: files, error: listError } = await supabase.storage
      .from('dre_reports')
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (listError) {
      logWarning(`Erro ao listar arquivos: ${listError.message}`);
    } else {
      logSuccess(`${files.length} arquivo(s) encontrado(s) no bucket`);
      
      files.forEach((file, index) => {
        log(`\n   Arquivo ${index + 1}:`);
        log(`     • Nome: ${file.name}`);
        log(`     • Tamanho: ${file.metadata?.size || 'N/A'} bytes`);
        log(`     • Tipo: ${file.metadata?.mimetype || 'N/A'}`);
        log(`     • Criado: ${file.created_at}`);
        log(`     • Atualizado: ${file.updated_at}`);
      });
    }
    
    // 5. Testar download dos arquivos enviados
    logStep('5/6', 'Testando download dos arquivos enviados...');
    
    for (const upload of uploadResults) {
      try {
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from('dre_reports')
          .download(upload.fileName);
        
        if (downloadError) {
          logError(`Erro no download de ${upload.fileName}: ${downloadError.message}`);
        } else {
          const downloadSize = downloadData.size;
          logSuccess(`Download de ${upload.fileName} concluído (${downloadSize} bytes)`);
          
          // Verificar integridade
          if (downloadSize === upload.size) {
            logSuccess(`Integridade verificada para ${upload.fileName}`);
          } else {
            logWarning(`Tamanho diferente para ${upload.fileName}: enviado ${upload.size}, baixado ${downloadSize}`);
          }
        }
      } catch (error) {
        logError(`Erro no download de ${upload.fileName}: ${error.message}`);
      }
    }
    
    // 6. Testar URLs públicas (se aplicável)
    logStep('6/6', 'Testando URLs públicas...');
    
    for (const upload of uploadResults) {
      try {
        const { data: urlData } = supabase.storage
          .from('dre_reports')
          .getPublicUrl(upload.fileName);
        
        if (urlData.publicUrl) {
          log(`   📎 URL pública para ${upload.fileName}:`);
          log(`      ${urlData.publicUrl}`);
          
          // Testar acesso à URL
          try {
            const response = await fetch(urlData.publicUrl);
            if (response.ok) {
              logSuccess(`URL pública acessível para ${upload.fileName}`);
            } else {
              logWarning(`URL pública retornou status ${response.status} para ${upload.fileName}`);
            }
          } catch (fetchError) {
            logWarning(`Erro ao acessar URL pública: ${fetchError.message}`);
          }
        }
      } catch (error) {
        logWarning(`Erro ao gerar URL pública para ${upload.fileName}: ${error.message}`);
      }
    }
    
    // Resumo final
    log('\n' + '='.repeat(50));
    logSuccess('TESTE DE UPLOAD CONCLUÍDO');
    
    log(`\n📊 RESUMO:`);
    log(`   • Arquivos enviados: ${uploadResults.length}`);
    log(`   • Total de bytes: ${uploadResults.reduce((sum, upload) => sum + upload.size, 0)}`);
    
    uploadResults.forEach((upload, index) => {
      log(`   ${index + 1}. ${upload.type}: ${upload.fileName} (${upload.size} bytes)`);
    });
    
    // Salvar informações dos uploads para uso posterior
    const uploadInfo = {
      timestamp: new Date().toISOString(),
      uploads: uploadResults
    };
    
    const infoPath = path.join(__dirname, `upload-info-${Date.now()}.json`);
    fs.writeFileSync(infoPath, JSON.stringify(uploadInfo, null, 2));
    log(`\n📄 Informações dos uploads salvas em: ${infoPath}`, 'cyan');
    
  } catch (error) {
    log('\n' + '='.repeat(50));
    logError(`TESTE FALHOU: ${error.message}`);
    
    // Sugestões de troubleshooting
    log('\n🔧 SUGESTÕES DE TROUBLESHOOTING:', 'yellow');
    log('   1. Verifique se o bucket dre_reports existe no Supabase Storage');
    log('   2. Confirme as permissões de upload no bucket');
    log('   3. Verifique as políticas RLS do Storage');
    log('   4. Confirme a configuração da API key');
    log('   5. Verifique limites de tamanho de arquivo');
    
    process.exit(1);
  }
}

// Executar teste
testFileUpload().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});