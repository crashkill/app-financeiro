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
