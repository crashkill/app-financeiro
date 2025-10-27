import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import ProjectFilterReusable from './ProjectFilterReusable';
import YearFilterReusable from './YearFilterReusable';

/**
 * Exemplo de uso dos componentes de filtro reutilizáveis
 * 
 * Este componente demonstra como usar os filtros ProjectFilterReusable e YearFilterReusable
 * mantendo o mesmo layout e estilo do FilterPanel original.
 */
const FilterExample: React.FC = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  return (
    <Row className="mb-4 g-3">
      {/* Filtro de Projetos - Ocupa 8 colunas (md-8) */}
      <Col md={8}>
        <ProjectFilterReusable
          selectedProjects={selectedProjects}
          onChange={setSelectedProjects}
          className="h-100"
        />
      </Col>
      
      {/* Filtro de Ano - Ocupa 4 colunas (md-4) */}
      <Col md={4}>
        <YearFilterReusable
          selectedYear={selectedYear}
          onChange={setSelectedYear}
          className="h-100"
          showMonthFilter={true}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </Col>
    </Row>
  );
};

export default FilterExample;