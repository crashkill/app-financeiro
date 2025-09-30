import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import YearFilter from './YearFilter';

/**
 * Componente de exemplo para demonstrar o uso do YearFilter
 * com diferentes fontes de dados e configurações
 */
const YearFilterExample: React.FC = () => {
  // Estados para diferentes exemplos
  const [transactionsSelectedYear, setTransactionsSelectedYear] = useState<number>(new Date().getFullYear());
  const [customSelectedYear, setCustomSelectedYear] = useState<number>(new Date().getFullYear());
  const [rangeSelectedYear, setRangeSelectedYear] = useState<number>(new Date().getFullYear());
  const [edgeFunctionSelectedYear, setEdgeFunctionSelectedYear] = useState<number>(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  // Lista customizada de anos para exemplo
  const customYears = [2020, 2021, 2022, 2023, 2024];

  const handleError = (error: Error) => {
    setError(error.message);
    console.error('Erro no YearFilter:', error);
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">YearFilter - Exemplos de Uso</h1>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <Alert.Heading>Erro!</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      <Row className="g-4">
        {/* Exemplo 1: Fonte de dados de transações */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">1. Fonte: Transações (Padrão)</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-3">
                Extrai anos automaticamente das transações carregadas.
              </p>
              <YearFilter
                selectedYear={transactionsSelectedYear}
                onChange={setTransactionsSelectedYear}
              />
              <div className="mt-3">
                <strong>Selecionado:</strong> {transactionsSelectedYear || 'Nenhum'}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Exemplo 2: Lista customizada */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">2. Fonte: Lista Customizada</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-3">
                Usa uma lista predefinida de anos específicos.
              </p>
              <YearFilter
                selectedYear={customSelectedYear}
                onChange={setCustomSelectedYear}
                years={customYears}
              />
              <div className="mt-3">
                <strong>Selecionado:</strong> {customSelectedYear || 'Nenhum'}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Exemplo 3: Range de anos */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">3. Fonte: Range de Anos</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-3">
                Gera um intervalo de anos entre startYear e endYear.
              </p>
              <YearFilter
                selectedYear={rangeSelectedYear}
                onChange={setRangeSelectedYear}
                years={Array.from({length: 11}, (_, i) => 2020 + i)}
              />
              <div className="mt-3">
                <strong>Selecionado:</strong> {rangeSelectedYear || 'Nenhum'}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Exemplo 4: Edge Function (Recomendado) */}
        <Col md={6}>
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">4. Fonte: Edge Function ⚡ (Recomendado)</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-3">
                Carrega anos via Edge Function do Supabase para melhor performance.
              </p>
              <YearFilter
                selectedYear={edgeFunctionSelectedYear}
                onChange={setEdgeFunctionSelectedYear}
              />
              <div className="mt-3">
                <strong>Selecionado:</strong> {edgeFunctionSelectedYear || 'Nenhum'}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Seção de informações */}
      <Row className="mt-5">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Informações dos Filtros</h5>
            </Card.Header>
            <Card.Body>
              <h6>Estados Atuais:</h6>
              <pre className="bg-light p-3 rounded">
                {JSON.stringify({
                  transactions: transactionsSelectedYear,
                  custom: customSelectedYear,
                  range: rangeSelectedYear,
                  edge_function: edgeFunctionSelectedYear
                }, null, 2)}
              </pre>
              
              <h6 className="mt-4">Características:</h6>
              <ul>
                <li><strong>Transactions:</strong> Extrai anos das transações automaticamente</li>
                <li><strong>Custom:</strong> Usa lista predefinida de anos</li>
                <li><strong>Range:</strong> Gera intervalo entre startYear e endYear</li>
                <li><strong>Edge Function:</strong> Carrega via API otimizada (recomendado)</li>
              </ul>
              
              <h6 className="mt-4">Benefícios da Edge Function:</h6>
              <ul>
                <li>⚡ <strong>Performance:</strong> Processamento no servidor</li>
                <li>🔄 <strong>Cache:</strong> Dados otimizados e em cache</li>
                <li>📊 <strong>Consistência:</strong> Mesma fonte para toda aplicação</li>
                <li>🛡️ <strong>Segurança:</strong> Validação no backend</li>
                <li>🔄 <strong>Retry:</strong> Tentativas automáticas em caso de erro</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default YearFilterExample;