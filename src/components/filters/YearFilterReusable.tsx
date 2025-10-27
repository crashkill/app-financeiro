import React from 'react';
import { Card, Form } from 'react-bootstrap';

interface YearFilterReusableProps {
  years: number[];
  selectedYear: number;
  onChange: (year: number) => void;
  label?: string;
  className?: string;
  showMonthFilter?: boolean;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  isLoading?: boolean;
}

const YearFilterReusable: React.FC<YearFilterReusableProps> = ({
  years,
  selectedYear,
  onChange,
  label = "Filtrar Ano",
  className = "",
  showMonthFilter = false,
  selectedMonth = "",
  onMonthChange,
  isLoading = false
}) => {
  // Handler para mudança na seleção do ano
  const handleYearSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(parseInt(event.target.value));
  };

  // Handler para mudança na seleção do mês
  const handleMonthSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (onMonthChange) {
      onMonthChange(event.target.value);
    }
  };

  const months = [
    { value: '', label: 'Todos os meses' },
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  return (
    <Card className={`shadow bg-card text-card-foreground border border-border ${className}`}>
      <Card.Body>
        <div className="mb-3">
          <Form.Label><strong>{label}</strong></Form.Label>
          <Form.Select
            onChange={handleYearSelection}
            value={selectedYear}
            className="form-control bg-input text-foreground border-border focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            disabled={isLoading}
          >
            {isLoading ? (
              <option disabled>Carregando anos...</option>
            ) : years.length === 0 ? (
              <option disabled>Nenhum ano disponível</option>
            ) : (
              years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))
            )}
          </Form.Select>
        </div>
        
        {showMonthFilter && onMonthChange && (
          <div>
            <Form.Label><strong>Filtrar Mês</strong></Form.Label>
            <Form.Select
              onChange={handleMonthSelection}
              value={selectedMonth}
              className="form-control bg-input text-foreground border-border focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </Form.Select>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default YearFilterReusable;