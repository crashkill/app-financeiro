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
        RECEITA: { count: 0, total: 0 },
        CUSTO: { count: 0, total: 0 }
    },
    periodos: new Set(),
    exemplos: []
};

// Processar cada linha
data.forEach((row, index) => {
    if (row.Relatorio === 'Realizado') {
        analise.realizados++;
        
        const natureza = String(row.Natureza || '').toUpperCase();
        if (natureza === 'RECEITA' || natureza === 'CUSTO') {
            const valor = typeof row.Lancamento === 'number' ? row.Lancamento : 
                         parseFloat(String(row.Lancamento).replace(/[^\d.-]/g, '')) || 0;
            
            analise.natureza[natureza].count++;
            analise.natureza[natureza].total += Math.abs(valor);
        }

        if (row.Periodo) {
            analise.periodos.add(row.Periodo);
        }

        // Guardar alguns exemplos
        if (index < 5) {
            analise.exemplos.push({
                relatorio: row.Relatorio,
                natureza: row.Natureza,
                lancamento: row.Lancamento,
                periodo: row.Periodo,
                projeto: row.Projeto
            });
        }
    }
});

// Resultados
console.log('=== Análise do arquivo Excel ===');
console.log(`Total de registros: ${analise.total}`);
console.log(`Registros Realizados: ${analise.realizados}`);
console.log('\nTotais por natureza:');
console.log('RECEITA:', {
    quantidade: analise.natureza.RECEITA.count,
    total: analise.natureza.RECEITA.total.toFixed(2)
});
console.log('CUSTO:', {
    quantidade: analise.natureza.CUSTO.count,
    total: analise.natureza.CUSTO.total.toFixed(2)
});
console.log('\nPeríodos encontrados:', Array.from(analise.periodos));
console.log('\nExemplos de registros:', analise.exemplos);
