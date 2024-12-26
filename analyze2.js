const XLSX = require('xlsx');

// Ler o arquivo Excel
const workbook = XLSX.readFile('Realatorio.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Análise dos dados
const analise = {
    total: data.length,
    realizados: 0,
    natureza: {
        RECEITA: { count: 0, total: 0, valores: [] },
        CUSTO: { count: 0, total: 0, valores: [] }
    }
};

// Processar cada linha
data.forEach((row, index) => {
    if (row.Relatorio === 'Realizado') {
        analise.realizados++;
        
        const natureza = String(row.Natureza || '').toUpperCase();
        if (natureza === 'RECEITA' || natureza === 'CUSTO') {
            // Guardar o valor original para análise
            const valorOriginal = row.Lancamento;
            
            // Converter para número
            let valor = 0;
            if (typeof valorOriginal === 'number') {
                valor = valorOriginal;
            } else if (typeof valorOriginal === 'string') {
                valor = parseFloat(valorOriginal.replace(/[^\d.-]/g, ''));
            }

            if (!isNaN(valor)) {
                analise.natureza[natureza].count++;
                analise.natureza[natureza].total += Math.abs(valor);
                
                // Guardar os primeiros 10 valores para verificação
                if (analise.natureza[natureza].valores.length < 10) {
                    analise.natureza[natureza].valores.push({
                        original: valorOriginal,
                        processado: valor,
                        absoluto: Math.abs(valor),
                        linha: index + 2, // +2 porque Excel começa em 1 e tem cabeçalho
                        projeto: row.Projeto,
                        periodo: row.Periodo
                    });
                }
            }
        }
    }
});

// Resultados
console.log('=== Análise do arquivo Excel ===');
console.log(`Total de registros: ${analise.total}`);
console.log(`Registros Realizados: ${analise.realizados}`);

console.log('\nRECEITA:');
console.log(`Quantidade: ${analise.natureza.RECEITA.count}`);
console.log(`Total: ${analise.natureza.RECEITA.total.toFixed(2)}`);
console.log('Primeiros 10 valores:');
console.log(JSON.stringify(analise.natureza.RECEITA.valores, null, 2));

console.log('\nCUSTO:');
console.log(`Quantidade: ${analise.natureza.CUSTO.count}`);
console.log(`Total: ${analise.natureza.CUSTO.total.toFixed(2)}`);
console.log('Primeiros 10 valores:');
console.log(JSON.stringify(analise.natureza.CUSTO.valores, null, 2));
