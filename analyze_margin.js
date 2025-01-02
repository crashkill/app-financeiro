// Dados de exemplo do projeto NSPCLA1211 para Janeiro 2024
const transacoes = [
    // Por favor, forneça os valores reais das transações do projeto
    // Exemplo do formato:
    // { contaResumo: 'RECEITA', natureza: 'RECEITA', valor: 100000 },
    // { contaResumo: 'CLT', natureza: 'CUSTO', valor: -50000 },
];

function calcularMargem(receita, custo) {
    if (receita <= 0) return 0;
    return (1 - (Math.abs(custo) / receita)) * 100;
}

function analisarTransacoes(transacoes) {
    console.log('=== Análise de Margem ===');
    
    let receita = 0;
    let custo = 0;
    let desoneracao = 0;

    transacoes.forEach(t => {
        const contaResumoNormalizada = t.contaResumo ? 
            t.contaResumo.normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim() : '';

        const isDesoneracao = contaResumoNormalizada === 'desoneracao da folha';
        const isCLT = contaResumoNormalizada.includes('clt');
        const isOutros = contaResumoNormalizada.includes('outros');
        const isSubcontratados = contaResumoNormalizada.includes('subcontratados');
        const isCustoValido = isCLT || isOutros || isSubcontratados;

        console.log(`\nProcessando transação:`);
        console.log(`Conta: ${t.contaResumo}`);
        console.log(`Valor: ${t.valor}`);
        console.log(`Natureza: ${t.natureza}`);
        console.log(`É custo válido? ${isCustoValido}`);

        if (isDesoneracao) {
            desoneracao = t.valor;
            console.log('-> Registrado como desoneração');
        } else if (t.natureza === 'RECEITA') {
            receita += t.valor;
            console.log('-> Adicionado à receita');
        } else if (isCustoValido && t.natureza === 'CUSTO') {
            custo += Math.abs(t.valor);
            console.log('-> Adicionado ao custo');
        }
    });

    console.log('\n=== Totais ===');
    console.log(`Receita: ${receita}`);
    console.log(`Custo: ${custo}`);
    console.log(`Desoneração: ${desoneracao}`);

    const margem = calcularMargem(receita, custo);
    
    console.log('\n=== Cálculo da Margem ===');
    console.log('Fórmula: 1 - (custo/receita) * 100');
    console.log(`1 - (${Math.abs(custo)}/${receita}) * 100`);
    console.log(`1 - (${(Math.abs(custo)/receita).toFixed(4)}) * 100`);
    console.log(`${(1 - (Math.abs(custo)/receita)).toFixed(4)} * 100`);
    console.log(`= ${margem.toFixed(2)}%`);
}

// Execute a análise
analisarTransacoes(transacoes);
