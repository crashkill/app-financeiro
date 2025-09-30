const XLSX = require('xlsx');
const fs = require('fs');

function analyzeHitssData() {
  try {
    const filePath = './Relatorio_250909104635226.xlsx';
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Arquivo hitss-data.xlsx não encontrado');
      return;
    }

    console.log('📊 Analisando arquivo HITSS...');
    
    const workbook = XLSX.read(fs.readFileSync(filePath));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`📋 Total de linhas: ${jsonData.length}`);
    
    if (jsonData.length > 0) {
      console.log('\n📝 CABEÇALHOS (primeira linha):');
      const headers = jsonData[0] || [];
      headers.forEach((header, index) => {
        if (header) {
          console.log(`  ${index}: ${header}`);
        }
      });
      
      console.log('\n🔍 AMOSTRA DE DADOS (segunda linha):');
      if (jsonData.length > 1) {
        const sampleRow = jsonData[1] || [];
        sampleRow.forEach((value, index) => {
          if (value !== undefined && value !== null && value !== '') {
            console.log(`  ${headers[index] || index}: ${value} (${typeof value})`);
          }
        });
      }
      
      // Verificar se há colunas de meses
      console.log('\n📅 COLUNAS DE MESES ENCONTRADAS:');
      const monthPatterns = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const foundMonths = [];
      
      headers.forEach((header, index) => {
        if (header && typeof header === 'string') {
          const normalized = header.toLowerCase().trim();
          if (monthPatterns.some(month => normalized.includes(month))) {
            foundMonths.push({ index, header, normalized });
          }
        }
      });
      
      if (foundMonths.length > 0) {
        foundMonths.forEach(month => {
          console.log(`  ${month.index}: ${month.header}`);
        });
      } else {
        console.log('  ❌ Nenhuma coluna de mês encontrada');
      }
      
      // Verificar valores numéricos
      console.log('\n💰 ANÁLISE DE VALORES NUMÉRICOS:');
      let numericColumns = [];
      
      if (jsonData.length > 1) {
        const sampleRow = jsonData[1] || [];
        sampleRow.forEach((value, index) => {
          if (typeof value === 'number' && !isNaN(value)) {
            numericColumns.push({
              index,
              header: headers[index] || `Coluna ${index}`,
              value
            });
          }
        });
        
        if (numericColumns.length > 0) {
          numericColumns.forEach(col => {
            console.log(`  ${col.index}: ${col.header} = ${col.value}`);
          });
        } else {
          console.log('  ❌ Nenhuma coluna numérica encontrada na amostra');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao analisar arquivo:', error.message);
  }
}

analyzeHitssData();