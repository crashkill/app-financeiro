import React from 'react';
import { Form } from 'react-bootstrap';

interface MonthFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  label?: string;
}

const MonthFilter: React.FC<MonthFilterProps> = ({
  selectedMonth,
  onMonthChange,
  label = 'Mês'
}) => {
  const months = [
    { value: '', label: 'Todos os Meses' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onMonthChange(event.target.value);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Select
        value={selectedMonth}
        onChange={handleMonthChange}
      >
        {months.map(month => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default MonthFilter;