import React from 'react';
import { Row, Col, Card, Form } from 'react-bootstrap';
import MonthFilter from './filters/MonthFilter';

interface FilterPanelProps {
  projects: string[];
  selectedProjects: string[];
  years: number[];
  selectedYear: number;
  selectedMonth?: string;
  onProjectChange: (projects: string[]) => void;
  onYearChange: (year: number) => void;
  onMonthChange?: (month: string) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  projects,
  selectedProjects,
  years,
  selectedYear,
  selectedMonth = '',
  onProjectChange,
  onYearChange,
  onMonthChange
}) => {
  // Handler para mudança na seleção de projetos
  const handleProjectSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    onProjectChange(selected);
  };

  // Handler para mudança na seleção do ano
  const handleYearSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onYearChange(parseInt(event.target.value));
  };

  return (
    <Row className="mb-4 g-3">
      <Col md={8}>
        <Card className="shadow h-100 bg-card text-card-foreground border border-border">
          <Card.Body>
            <Form.Group>
              <Form.Label><strong>Filtrar Projetos</strong></Form.Label>
              <Form.Select 
                multiple 
                size="lg"
                onChange={handleProjectSelection}
                value={selectedProjects}
                className="form-control bg-input text-foreground border-border focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                style={{ minHeight: '200px' }}
              >
                {projects.map((project) => (
                  <option key={project} value={project} className="text-slate-900 dark:text-white">
                    {project}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-slate-500 dark:text-slate-400">
                Segure Ctrl para selecionar múltiplos projetos. Nenhuma seleção mostra todos os projetos.
              </Form.Text>
            </Form.Group>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="shadow h-100 bg-card text-card-foreground border border-border">
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label><strong>Filtrar Ano</strong></Form.Label>
              <Form.Select
                onChange={handleYearSelection}
                value={selectedYear}
                className="form-control bg-input text-foreground border-border focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            {onMonthChange && (
              <MonthFilter
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
                label="Filtrar Mês"
              />
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default FilterPanel;
