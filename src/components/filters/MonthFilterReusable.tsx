import React from 'react';
import { Card, Form } from 'react-bootstrap';

export interface MonthOption {
  value: string;
  label: string;
}

interface MonthFilterReusableProps {
  months: MonthOption[];
  selectedMonth: string;
  onChange: (month: string) => void;
  label?: string;
  helpText?: string;
  className?: string;
  isLoading?: boolean;
}

const MonthFilterReusable: React.FC<MonthFilterReusableProps> = ({
  months,
  selectedMonth,
  onChange,
  label = "Filtrar Mês",
  helpText = "Selecione um mês específico ou deixe em branco para ver todos os meses.",
  className = "",
  isLoading = false
}) => {
  // Handler para mudança na seleção do mês
  const handleMonthSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  // Meses padrão caso não sejam fornecidos
  const defaultMonths: MonthOption[] = [
    { value: '', label: 'Todos os meses' },
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

  const monthsToUse = months.length > 0 ? months : defaultMonths;

  return (
    <Card className={`shadow bg-card text-card-foreground border border-border ${className}`}>
      <Card.Body>
        <div>
          <Form.Label><strong>{label}</strong></Form.Label>
          <Form.Select
            onChange={handleMonthSelection}
            value={selectedMonth}
            className="form-control bg-input text-foreground border-border focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            disabled={isLoading}
          >
            {isLoading ? (
              <option disabled>Carregando meses...</option>
            ) : monthsToUse.length === 0 ? (
              <option disabled>Nenhum mês disponível</option>
            ) : (
              monthsToUse.map((month) => (
                <option key={month.value} value={month.value} className="text-slate-900 dark:text-white">
                  {month.label}
                </option>
              ))
            )}
          </Form.Select>
          <Form.Text className="text-slate-500 dark:text-slate-400">
            {helpText}
          </Form.Text>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MonthFilterReusable;