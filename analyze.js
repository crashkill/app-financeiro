const XLSX = require('xlsx');
const path = require('path');

// Função para analisar o arquivo Excel
function analisarDados() {
    // Ler o arquivo Excel
    const workbook = XLSX.readFile(path.join(__dirname, 'src/modelos/Relatorio.xlsx'));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(sheet);

    // Filtrar apenas registros realizados
    const dadosFiltrados = dados.filter(item => 
        item.Relatorio === 'Realizado' && 
        item.Lancamento != null && 
        item.Lancamento !== ''
    );

    // Analisar desoneração para NSPCLA1211
    const desoneracao = dadosFiltrados.filter(item => 
        item.Projeto?.includes('NSPCLA1211') && 
        item.ContaResumo === 'Desoneração da Folha'
    );

    console.log('\n=== Análise de Desoneração para NSPCLA1211 ===');
    desoneracao.forEach(item => {
        console.log({
            projeto: item.Projeto,
            periodo: item.Periodo,
            contaResumo: item.ContaResumo,
            lancamento: item.Lancamento,
            natureza: item.Natureza
        });
    });

    // Agrupar por período
    const porPeriodo = desoneracao.reduce((acc, item) => {
        const periodo = item.Periodo;
        if (!acc[periodo]) {
            acc[periodo] = {
                total: 0,
                items: []
            };
        }
        acc[periodo].total += Number(item.Lancamento);
        acc[periodo].items.push(item);
        return acc;
    }, {});

    console.log('\n=== Totais por Período ===');
    Object.entries(porPeriodo).forEach(([periodo, dados]) => {
        console.log(`${periodo}:`, {
            total: dados.total,
            quantidade: dados.items.length,
            items: dados.items.map(i => i.Lancamento)
        });
    });

    // Verificar agosto/2024 especificamente
    const agosto2024 = dadosFiltrados.filter(item => 
        item.Projeto?.includes('NSPCLA1211') && 
        item.Periodo === '8/2024'
    );

    console.log('\n=== Todas as Transações de Agosto/2024 para NSPCLA1211 ===');
    agosto2024.forEach(item => {
        console.log({
            projeto: item.Projeto,
            contaResumo: item.ContaResumo,
            lancamento: item.Lancamento,
            natureza: item.Natureza
        });
    });
}

// Executar análise
try {
    analisarDados();
} catch (error) {
    console.error('Erro ao analisar dados:', error);
}
