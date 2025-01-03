export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(value));
};

export const formatPercent = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

// Aliases para manter compatibilidade com os novos nomes
export const formatarMoeda = formatCurrency;
export const formatarPorcentagem = formatPercent;

// Funções auxiliares para formatação de números
export const formatarNumero = (value: number, decimais: number = 2) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais
  }).format(value);
};

export const formatarData = (data: Date) => {
  return new Intl.DateTimeFormat('pt-BR').format(data);
};

export const formatarDataHora = (data: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
};
