import { useState, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import FinancialTable from '../components/FinancialTable';
import { FinancialFilters } from '../components/FinancialFilters';
import { storageService, FinancialData } from '../services/storageService';

interface Filters {
  project: string;
  period: string[];
}

const Financial = () => {
  const [filters, setFilters] = useState<Filters>({
    project: 'all',
    period: [],
  });

  const financialData = useMemo(() => storageService.getFinancialData(), []);

  const filteredData = useMemo(() => {
    let filteredByProject: { [key: string]: FinancialData[] } = {};

    if (filters.project === 'all') {
      // Group data by project
      financialData.forEach(item => {
        if (!filteredByProject[item.visao]) {
          filteredByProject[item.visao] = [];
        }
        filteredByProject[item.visao].push(item);
      });
    } else {
      // Filter for specific project
      const projectData = financialData.filter(item => item.visao === filters.project);
      if (projectData.length > 0) {
        filteredByProject[filters.project] = projectData;
      }
    }

    // Apply period filter if selected
    if (filters.period.length > 0) {
      Object.keys(filteredByProject).forEach(project => {
        filteredByProject[project] = filteredByProject[project].map(item => ({
          ...item,
          months: Object.fromEntries(
            Object.entries(item.months).filter(([month]) => 
              filters.period.includes(month)
            )
          ),
        }));
      });
    }

    return filteredByProject;
  }, [financialData, filters]);

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">Planilhas Financeiras</h1>
          <p className="text-muted">Visualize e analise seus dados financeiros</p>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card className="filter-section">
            <Card.Body>
              <FinancialFilters filters={filters} onFilterChange={handleFilterChange} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          {Object.entries(filteredData).map(([project, data]) => (
            <Card key={project} className="mb-4">
              <Card.Body>
                <h3 className="mb-4">{project}</h3>
                <FinancialTable data={data} />
              </Card.Body>
            </Card>
          ))}
          {Object.keys(filteredData).length === 0 && (
            <Card className="text-center">
              <Card.Body className="py-5">
                <p className="text-muted mb-0">
                  Nenhum dado encontrado. Importe dados na página de configurações.
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Financial;
