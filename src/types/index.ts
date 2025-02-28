export interface Transacao {
  id?: number;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  observacao?: string;
  natureza: 'RECEITA' | 'CUSTO';
  lancamento: number;
  projeto?: string;
  periodo: string;
}

export interface FinancialFiltersProps {
  filters: {
    project: string;
    period: string[];
  };
  onFilterChange: (newFilters: { project: string; period: string[] }) => void;
}

export interface CacheOptions {
  expirationTime?: number;
  useLocalStorage?: boolean;
}
