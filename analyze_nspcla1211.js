// Importar fake-indexeddb para simular IndexedDB no Node.js
require('fake-indexeddb/auto');
const Dexie = require('dexie');

// Criar instância do banco de dados
const db = new Dexie('FinanceiroDB');
db.version(1).stores({
    transacoes: '++id, descricao, valor, natureza, periodo, contaResumo'
});

async function analisarProjetoNSPCLA1211() {
    try {
        // Buscar todas as transações do projeto para Janeiro 2024
        const transacoes = await db.transacoes
            .where('descricao')
            .equals('NSPCLA1211')
            .filter(t => t.periodo === '01/24')
            .toArray();

        console.log('=== Análise do Projeto NSPCLA1211 - Janeiro 2024 ===');
        
        let receita = 0;
        let custo = 0;
        let desoneracao = 0;

        // Processar transações
        transacoes.forEach(t => {
            console.log(`Transação: ${t.contaResumo} - Valor: ${t.valor} - Natureza: ${t.natureza}`);
            
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

            if (isDesoneracao) {
                desoneracao = t.valor;
            } else if (t.natureza === 'RECEITA') {
                receita += t.valor;
            } else if (isCustoValido && t.natureza === 'CUSTO') {
                custo += Math.abs(t.valor);
            }
        });

        console.log('\n=== Totais ===');
        console.log(`Receita: ${receita}`);
        console.log(`Custo: ${custo}`);
        console.log(`Desoneração: ${desoneracao}`);

        // Cálculo da margem
        const margem = receita > 0 ? (1 - (Math.abs(custo) / receita)) * 100 : 0;
        console.log(`\nMargem Calculada: ${margem.toFixed(2)}%`);
        
        // Mostrar cálculo detalhado
        console.log('\n=== Cálculo Detalhado ===');
        console.log(`Fórmula: 1 - (custo/receita) * 100`);
        console.log(`1 - (${Math.abs(custo)}/${receita}) * 100`);
        console.log(`1 - (${(Math.abs(custo)/receita).toFixed(4)}) * 100`);
        console.log(`${(1 - (Math.abs(custo)/receita)).toFixed(4)} * 100`);
        console.log(`= ${margem.toFixed(2)}%`);

    } catch (error) {
        console.error('Erro na análise:', error);
    }
}

analisarProjetoNSPCLA1211();
