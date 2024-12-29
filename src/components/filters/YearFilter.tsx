import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { db } from '../../db/database';

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
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    const loadYears = async () => {
      try {
        const transacoes = await db.transacoes.toArray();
        const uniqueYears = Array.from(new Set(transacoes.map(t => {
          const [, ano] = (t.periodo || '').split('/');
          return parseInt(ano);
        }))).filter(year => !isNaN(year)).sort((a, b) => b - a);

        setYears(uniqueYears);
      } catch (error) {
        console.error('Erro ao carregar anos:', error);
      }
    };

    loadYears();
  }, []);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    onYearChange(year);
  };

  return (
    <Form.Group>
      <Form.Label>{label}</Form.Label>
      <Form.Select
        value={selectedYear}
        onChange={handleYearChange}
        className="form-select"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default YearFilter;
