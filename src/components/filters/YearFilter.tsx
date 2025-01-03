import React, { useMemo } from 'react';
import { Form } from 'react-bootstrap';
import { useTransacoes } from '../../hooks/useTransacoes';

interface YearFilterProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  label?: string;
}

const YearFilter: React.FC<YearFilterProps> = ({
  selectedYear,
  onYearChange,
  label = 'Ano'
}) => {
  // Usa o hook otimizado para buscar transações
  const { transacoes, isLoading } = useTransacoes(undefined, undefined, undefined, true);

  // Processa a lista de anos de forma otimizada
  const anos = useMemo(() => {
    const uniqueYears = new Set<number>();
    const currentYear = new Date().getFullYear();
    
    // Adiciona o ano atual por padrão
    uniqueYears.add(currentYear);
    
    // Adiciona anos das transações
    transacoes.forEach(t => {
      if (t.periodo) {
        const [, ano] = t.periodo.split('/');
        const yearNum = parseInt(ano);
        if (yearNum >= 2000 && yearNum <= 2100) {
          uniqueYears.add(yearNum);
        }
      }
    });

    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [transacoes]);

  // Handler otimizado para mudanças
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    if (!isNaN(year)) {
      onYearChange(year);
    }
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Select
        value={selectedYear}
        onChange={handleYearChange}
        disabled={isLoading}
      >
        {anos.map((ano) => (
          <option key={ano} value={ano}>
            {ano}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default React.memo(YearFilter);
