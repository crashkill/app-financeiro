import React from 'react';
import { Form } from 'react-bootstrap';
import { useTransacoes } from '../../hooks/useTransacoes';

interface YearFilterProps {
  selectedYear: number;
  onChange: (year: number) => void;
  years?: number[];
}

const YearFilter: React.FC<YearFilterProps> = ({ selectedYear, onChange, years: providedYears }) => {
  const { transacoes, loading } = useTransacoes({});

  const years = React.useMemo(() => {
    if (providedYears) return providedYears;
    
    const yearsSet = new Set<number>();
    transacoes.forEach(t => {
      const [, ano] = (t.periodo || '').split('/');
      const year = parseInt(ano);
      if (!isNaN(year)) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transacoes, providedYears]);

  return (
    <Form.Group>
      <Form.Label>Ano</Form.Label>
      <Form.Select
        value={selectedYear}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={loading}
      >
        {years.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default YearFilter;
