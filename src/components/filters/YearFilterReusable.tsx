import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useTransacoes } from '../../hooks/useTransacoes';

interface YearFilterProps {
  selectedYear: number;
  onChange: (year: number) => void;
  years?: number[];
  label?: string;
  className?: string;
  disabled?: boolean;
  defaultToCurrentYear?: boolean;
}

/**
 * Componente reutilizável para filtro de ano
 * Sempre exibe o ano atual como padrão se defaultToCurrentYear for true
 */
const YearFilterReusable: React.FC<YearFilterProps> = ({ 
  selectedYear, 
  onChange, 
  years: providedYears,
  label = 'Ano',
  className = '',
  disabled = false,
  defaultToCurrentYear = true
}) => {
  const { transacoes, loading } = useTransacoes({});
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Inicializar com o ano atual se necessário
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    
    if (defaultToCurrentYear && !selectedYear) {
      onChange(currentYear);
    }
  }, [defaultToCurrentYear, selectedYear, onChange]);

  // Extrair anos únicos das transações ou usar os fornecidos
  useEffect(() => {
    if (providedYears && providedYears.length > 0) {
      setAvailableYears(providedYears.sort((a, b) => b - a));
      return;
    }
    
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    
    // Garantir que o ano atual esteja sempre disponível
    yearsSet.add(currentYear);
    
    transacoes.forEach(t => {
      const [, ano] = (t.periodo || '').split('/');
      const year = parseInt(ano);
      if (!isNaN(year)) yearsSet.add(year);
    });
    
    setAvailableYears(Array.from(yearsSet).sort((a, b) => b - a));
  }, [transacoes, providedYears]);

  return (
    <Form.Group className={className}>
      <Form.Label>{label}</Form.Label>
      <Form.Select
        value={selectedYear || new Date().getFullYear()}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled || loading}
      >
        {availableYears.length === 0 ? (
          <option value={new Date().getFullYear()}>
            {new Date().getFullYear()}
          </option>
        ) : (
          availableYears.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))
        )}
      </Form.Select>
    </Form.Group>
  );
};

export default React.memo(YearFilterReusable);