import React, { useEffect, useState } from 'react';
import { Card, Col, Form, Row } from 'react-bootstrap';
import { db } from '../db/database';

export interface Filters {
  projects: string[];
  year: number;
}

interface ForecastFiltersProps {
  onFilterChange: (filters: Filters) => void;
  initialFilters: Filters;
}

const ForecastFilters: React.FC<ForecastFiltersProps> = ({ onFilterChange, initialFilters }) => {
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(initialFilters.projects);
  const [selectedYear, setSelectedYear] = useState(initialFilters.year);

  // Carrega projetos disponíveis ao montar o componente
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const transacoes = await db.transacoes.toArray();
        const projetos = [...new Set(transacoes.map(t => t.descricao))];
        setAvailableProjects(projetos.sort());
        
        // Se não houver projetos selecionados, seleciona todos
        if (selectedProjects.length === 0) {
          setSelectedProjects(projetos);
          onFilterChange({
            ...initialFilters,
            projects: projetos
          });
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      }
    };

    loadProjects();
  }, []);

  const handleProjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    setSelectedYear(year);
    onFilterChange({
      projects: selectedProjects,
      year
    });
  };

  // Gera anos para seleção (ano atual - 2 até ano atual + 1)
  const years = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);
  };

  return (
    <Row className="g-3 mb-4">
      <Col md={8}>
        <Card>
          <Card.Body>
            <Form.Group>
              <Form.Label>Projetos</Form.Label>
              <Form.Select 
                multiple 
                value={selectedProjects}
                onChange={handleProjectChange}
                style={{ height: '100px' }}
              >
                {availableProjects.map(project => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Card.Body>
        </Card>
      </Col>
      
      <Col md={4}>
        <Card>
          <Card.Body>
            <Form.Group>
              <Form.Label>Ano</Form.Label>
              <Form.Select
                value={selectedYear}
                onChange={handleYearChange}
              >
                {years().map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ForecastFilters;
