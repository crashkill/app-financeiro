const XLSX = require('xlsx');
const fs = require('fs');

const FILE_PATH = 'C:\\Users\\fabricio.lima\\OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA\\Área de Trabalho - Antiga\\Projetos React\\app-financeiro\\scripts\\dre_hitss_1758504595588.xlsx';

function analyzeExcelFile() {
  console.log('=== Analisando estrutura do arquivo Excel ===');
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(FILE_PATH)) {
      throw new Error(`Arquivo não encontrado: ${FILE_PATH}`);
    }
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(FILE_PATH);
    console.log(`Arquivo lido: ${fileBuffer.length} bytes`);
    
    // Parse Excel file using xlsx library
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    console.log('Planilhas encontradas:', workbook.SheetNames);
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false
    });
    
    console.log('Total de linhas:', jsonData.length);
    
    if (jsonData.length > 0) {
      console.log('\n=== CABEÇALHOS (Linha 1) ===');
      const headers = jsonData[0];
      headers.forEach((header, index) => {
        console.log(`Coluna ${index}: "${header}"`);
      });
      
      console.log('\n=== PRIMEIRA LINHA DE DADOS (Linha 2) ===');
      if (jsonData.length > 1) {
        const firstDataRow = jsonData[1];
        firstDataRow.forEach((value, index) => {
          console.log(`Coluna ${index} (${headers[index]}): "${value}"`);
        });
      }
      
      console.log('\n=== SEGUNDA LINHA DE DADOS (Linha 3) ===');
      if (jsonData.length > 2) {
        const secondDataRow = jsonData[2];
        secondDataRow.forEach((value, index) => {
          console.log(`Coluna ${index} (${headers[index]}): "${value}"`);
        });
      }
      
      console.log('\n=== VERIFICAÇÃO DE CAMPOS OBRIGATÓRIOS ===');
      const requiredFields = ['relatorio', 'tipo', 'cliente', 'projeto', 'lancamento', 'periodo', 'natureza'];
      
      requiredFields.forEach(field => {
        const found = headers.find(h => h && h.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === field);
        console.log(`${field}: ${found ? '✓ ENCONTRADO' : '❌ NÃO ENCONTRADO'} ${found ? `("${found}")` : ''}`);
      });
      
      // Verificar se há dados válidos nas primeiras linhas
      console.log('\n=== VERIFICAÇÃO DE DADOS VÁLIDOS ===');
      for (let i = 1; i <= Math.min(5, jsonData.length - 1); i++) {
        const row = jsonData[i];
        const hasData = row && row.some(cell => cell && cell.toString().trim() !== '');
        console.log(`Linha ${i + 1}: ${hasData ? '✓ TEM DADOS' : '❌ VAZIA'} - ${row ? row.length : 0} colunas`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  
  console.log('\n=== Análise concluída ===');
}

analyzeExcelFile();