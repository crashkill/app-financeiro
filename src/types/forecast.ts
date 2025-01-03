export interface Previsao {
  mes: string;
  valor: number;
}

export interface MonthData {
  receita: number;
  custoTotal: number;
  margemBruta: number;
  margemPercentual: number;
}

export interface ForecastData {
  projeto: string;
  dados: {
    [mes: string]: MonthData;
  };
  totais: {
    receita: number;
    custoTotal: number;
    margemBruta: number;
    margemPercentual: number;
  };
}

export interface ForecastOptions {
  mesesProjecao?: number;
  taxaCrescimentoReceita?: number;
  taxaCrescimentoCusto?: number;
  considerarSazonalidade?: boolean;
}

export interface TendenciaAnalise {
  crescimentoReceita: number;
  crescimentoCusto: number;
  tendenciaMargemBruta: 'alta' | 'estavel' | 'baixa';
  previsaoProximosMeses: {
    receitas: Previsao[];
    custos: Previsao[];
    margens: Previsao[];
  };
}

export interface ForecastFiltros {
  projeto: string;
  ano: number;
  mesesHistoricos?: number;
  mesesProjecao?: number;
  tipoProjecao?: 'linear' | 'exponencial' | 'sazonal';
}
