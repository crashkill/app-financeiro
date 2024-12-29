import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Card } from 'react-bootstrap';
import { db } from '../db/database';

interface ForecastFiltersProps {
  onFilterChange: (filters: Filters) => void;
  initialFilters?: Filters;
}

export interface Filters {
  projects?: string[];
  year?: number;
}

const ForecastFilters: React.FC<ForecastFiltersProps> = ({ onFilterChange, initialFilters }) => {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(initialFilters?.projects || []);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(initialFilters?.year || new Date().getFullYear());

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const transacoes = await db.transacoes.toArray();
        
        // Extrair lista única de projetos
        const uniqueProjects = Array.from(new Set(transacoes.map(t => t.descricao || 'Sem Projeto')));
        setProjects(uniqueProjects);

        // Extrair lista única de anos
        const uniqueYears = Array.from(new Set(transacoes.map(t => {
          const [, ano] = (t.periodo || '').split('/');
          return parseInt(ano);
        }))).filter(year => !isNaN(year)).sort((a, b) => b - a);

        setYears(uniqueYears);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    carregarDados();
  }, []);

  // Handler para mudança na seleção de projetos
  const handleProjectSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedProjects(selected);
    onFilterChange({
      projects: selected,
      year: selectedYear
    });
  };

  // Handler para mudança na seleção do ano
  const handleYearSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    setSelectedYear(year);
    onFilterChange({
      projects: selectedProjects,
      year
    });
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Filtros</h5>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Projetos</Form.Label>
              <Form.Select 
                multiple 
                value={selectedProjects}
                onChange={handleProjectSelection}
                className="form-select"
                style={{ height: '200px' }}
              >
                {projects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Ano</Form.Label>
              <Form.Select
                value={selectedYear}
                onChange={handleYearSelection}
                className="form-select"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ForecastFilters;
