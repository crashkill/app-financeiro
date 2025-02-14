import { Transacao } from '../../types';

interface DadosProjecao {
  receitas: number[];
  custos: number[];
  margens: number[];
}

export function calcularProjecoes(transacoes: Transacao[]): DadosProjecao {
  // Organizar transações por mês
  const dadosPorMes = transacoes.reduce((acc: { [key: string]: { receitas: number, custos: number } }, transacao) => {
    const { periodo, valor, tipo } = transacao;
    
    if (!acc[periodo]) {
      acc[periodo] = { receitas: 0, custos: 0 };
    }
    
    if (tipo === 'receita') {
      acc[periodo].receitas += valor;
    } else {
      acc[periodo].custos += valor;
    }
    
    return acc;
  }, {});

  // Converter para arrays ordenados por período
  const periodos = Object.keys(dadosPorMes).sort();
  const receitas = periodos.map(periodo => dadosPorMes[periodo].receitas);
  const custos = periodos.map(periodo => dadosPorMes[periodo].custos);
  const margens = periodos.map(periodo => {
    const { receitas, custos } = dadosPorMes[periodo];
    return receitas > 0 ? ((receitas - custos) / receitas) * 100 : 0;
  });

  return {
    receitas,
    custos,
    margens
  };
}
