const XLSX = require('xlsx');

// Ler o arquivo Excel
const workbook = XLSX.readFile('Realatorio.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Análise dos dados
const analise = {
    NSPCLA1230: {
        '5/2024': {
            receita: 0,
            custo: 0,
            linhas: []
        }
    }
};

// Processar cada linha
data.forEach((row, index) => {
    if (row.Relatorio === 'Realizado' && 
        row.CodigoProjeto === 'NSPCLA1230' && 
        row.Periodo === '5/2024') {
        
        analise.NSPCLA1230['5/2024'].linhas.push({
            linha: index + 2,
            natureza: row.Natureza,
            valor: row.Lancamento,
            descricao: row.Descricao
        });

        if (row.Natureza === 'RECEITA') {
            analise.NSPCLA1230['5/2024'].receita += row.Lancamento;
        } else if (row.Natureza === 'CUSTO') {
            analise.NSPCLA1230['5/2024'].custo += row.Lancamento;
        }
    }
});

// Resultados
console.log('=== Análise do Projeto NSPCLA1230 - Maio/2024 ===');
console.log('\nTotais:');
console.log('Receita:', analise.NSPCLA1230['5/2024'].receita.toFixed(2));
console.log('Custo:', analise.NSPCLA1230['5/2024'].custo.toFixed(2));
console.log('Margem:', ((analise.NSPCLA1230['5/2024'].receita - analise.NSPCLA1230['5/2024'].custo) / analise.NSPCLA1230['5/2024'].receita * 100).toFixed(2) + '%');

console.log('\nLinhas:');
console.log(JSON.stringify(analise.NSPCLA1230['5/2024'].linhas, null, 2));
