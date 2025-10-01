import React from 'react';
import { Row, Col, Card, Form } from 'react-bootstrap';

interface Project_YearProps {
  projects: string[];
  years: number[];
  selectedProjects: string[];
  selectedYear: string;
  onProjectsChange: (projects: string[]) => void;
  onYearChange: (year: string) => void;
}

const Project_Year: React.FC<Project_YearProps> = ({
  projects,
  years,
  selectedProjects,
  selectedYear,
  onProjectsChange,
  onYearChange
}) => {
  return (
    <Row className="mb-4 g-3">
      <Col md={8}>
        <Card className="shadow h-100 bg-card text-card-foreground border border-border">
          <Card.Body>
            <div>
              <Form.Label><strong>Filtrar Projetos</strong></Form.Label>
              <Form.Select
                multiple
                value={selectedProjects}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  onProjectsChange(selectedOptions);
                }}
                className="form-control bg-input text-foreground border-border focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                style={{ minHeight: '200px' }}
              >
                {projects.map((projeto) => (
                  <option key={projeto} value={projeto} className="text-slate-900 dark:text-white">
                    {projeto}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-slate-500 dark:text-slate-400">
                Segure Ctrl para selecionar múltiplos projetos. Nenhuma seleção mostra todos os projetos.
              </Form.Text>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="shadow h-100 bg-card text-card-foreground border border-border">
          <Card.Body>
            <div className="mb-3">
              <Form.Label><strong>Filtrar Ano</strong></Form.Label>
              <Form.Select
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                className="form-control bg-input text-foreground border-border focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </Form.Select>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default Project_Year;