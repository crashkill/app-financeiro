const XLSX = require('xlsx');
const fs = require('fs');

try {
  const filePath = 'c:\\Users\\fabricio.lima\\OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA\\Área de Trabalho - Antiga\\Projetos React\\app-financeiro\\scripts\\dre_hitss_1758504595588.xlsx';
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Arquivo não encontrado:', filePath);
    process.exit(1);
  }
  
  console.log('📊 Analisando arquivo Excel DRE...');
  const workbook = XLSX.readFile(filePath);
  
  console.log('📋 Planilhas encontradas:', workbook.SheetNames);
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log('\n🔍 Analisando planilha:', sheetName);
  
  // Converter para JSON para análise
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('📈 Total de registros:', jsonData.length);
  
  if (jsonData.length > 0) {
    console.log('\n📝 Campos encontrados:');
    const fields = Object.keys(jsonData[0]);
    fields.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field}`);
    });
    
    console.log('\n📋 Exemplo de registro (primeiro):');
    console.log(JSON.stringify(jsonData[0], null, 2));
    
    console.log('\n📋 Exemplo de registro (último):');
    console.log(JSON.stringify(jsonData[jsonData.length - 1], null, 2));
    
    // Analisar tipos de dados
    console.log('\n🔢 Análise de tipos de dados:');
    fields.forEach(field => {
      const values = jsonData.slice(0, 10).map(row => row[field]).filter(v => v !== undefined && v !== null && v !== '');
      if (values.length > 0) {
        const types = [...new Set(values.map(v => typeof v))];
        console.log(`  ${field}: ${types.join(', ')}`);
      }
    });
    
    // Analisar valores únicos de campos importantes
    console.log('\n📊 Análise de valores únicos:');
    const importantFields = ['Relatorio', 'Tipo', 'Cliente', 'Natureza'];
    importantFields.forEach(field => {
      if (fields.includes(field)) {
        const uniqueValues = [...new Set(jsonData.map(row => row[field]).filter(v => v !== undefined && v !== null && v !== ''))];
        console.log(`  ${field}: ${uniqueValues.length} valores únicos`);
        if (uniqueValues.length <= 20) {
          console.log(`    Valores: ${uniqueValues.join(', ')}`);
        } else {
          console.log(`    Primeiros 10: ${uniqueValues.slice(0, 10).join(', ')}`);
        }
      }
    });
  }
  
} catch (error) {
  console.error('❌ Erro ao analisar arquivo:', error.message);
}