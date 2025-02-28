const XLSX = require('xlsx');
const path = require('path');

function analyzeExcel(filePath) {
    try {
        // Ler o arquivo Excel
        const workbook = XLSX.readFile(filePath);
        
        // Para cada planilha
        workbook.SheetNames.forEach(sheetName => {
            console.log(`\n=== Analisando planilha: ${sheetName} ===`);
            
            const worksheet = workbook.Sheets[sheetName];
            
            // Converter para JSON para análise
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
                console.log('Planilha vazia');
                return;
            }
            
            // Analisar estrutura
            const firstRow = jsonData[0];
            console.log('\nEstrutura das colunas:');
            Object.keys(firstRow).forEach(column => {
                // Determinar o tipo de dados da coluna
                const columnValues = jsonData.map(row => row[column]);
                const types = new Set(columnValues.map(value => typeof value));
                
                console.log(`- ${column}:`);
                console.log(`  Tipo(s): ${Array.from(types).join(', ')}`);
                console.log(`  Exemplo: ${firstRow[column]}`);
                
                // Análise adicional para números
                if (types.has('number')) {
                    const numbers = columnValues.filter(v => typeof v === 'number');
                    console.log(`  Min: ${Math.min(...numbers)}`);
                    console.log(`  Max: ${Math.max(...numbers)}`);
                    console.log(`  Média: ${numbers.reduce((a, b) => a + b, 0) / numbers.length}`);
                }
                
                // Análise de valores únicos
                const uniqueValues = new Set(columnValues);
                console.log(`  Valores únicos: ${uniqueValues.size}`);
                
                // Mostrar alguns valores únicos se não houver muitos
                if (uniqueValues.size <= 10) {
                    console.log(`  Lista de valores únicos: ${Array.from(uniqueValues).join(', ')}`);
                }
            });
            
            console.log(`\nTotal de linhas: ${jsonData.length}`);
        });
        
    } catch (error) {
        console.error('Erro ao analisar arquivo:', error);
    }
}

// Caminho para o arquivo Excel
const filePath = path.resolve(__dirname, '../modelos/Relatorio.xlsx');
analyzeExcel(filePath);
