import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import ProjectFilter, { useProjectFilter, ProjectDataSource } from '../components/common/ProjectFilter';

/**
 * Componente de exemplo para demonstrar o uso do ProjectFilter
 */
const ProjectFilterExample: React.FC = () => {
  // Estados para diferentes exemplos
  const [basicSelectedProjects, setBasicSelectedProjects] = useState<string[]>([]);
  const [financialSelectedProjects, setFinancialSelectedProjects] = useState<string[]>([]);
  const [customSelectedProjects, setCustomSelectedProjects] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Hook utilitário
  const { 
    selectedProjects: hookProjects, 
    handleProjectChange, 
    clearSelection, 
    selectAll 
  } = useProjectFilter(['NSPCLA182 - Absorção AMX - TQI - Sustentação']);
  
  // Projetos customizados para exemplo
  const customProjects = [
    'Projeto Alpha - Desenvolvimento Web',
    'Projeto Beta - Mobile App',
    'Projeto Gamma - Data Analytics',
    'Projeto Delta - DevOps',
    'Projeto Epsilon - Machine Learning'
  ];
  
  // Função para simular seleção de todos os projetos
  const handleSelectAllCustom = () => {
    setCustomSelectedProjects([...customProjects]);
  };
  
  // Função para limpar seleção customizada
  const handleClearCustom = () => {
    setCustomSelectedProjects([]);
  };
  
  // Handler de erro
  const handleError = (err: Error) => {
    setError(err.message);
    setTimeout(() => setError(null), 5000);
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Exemplos do Componente ProjectFilter</h1>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <strong>Erro:</strong> {error}
        </Alert>
      )}
      
      <Row className="g-4">
        {/* Exemplo Básico */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">1. Uso Básico (Transações)</h5>
            </Card.Header>
            <Card.Body>
              <ProjectFilter
                selectedProjects={basicSelectedProjects}
                onChange={setBasicSelectedProjects}
                dataSource="transactions"
                onError={handleError}
              />
              
              <div className="mt-3">
                <h6>Projetos Selecionados:</h6>
                <div className="bg-light p-2 rounded">
                  {basicSelectedProjects.length > 0 ? (
                    <ul className="mb-0 ps-3">
                      {basicSelectedProjects.map(project => (
                        <li key={project} className="small">{project}</li>
                      ))}
                    </ul>
                  ) : (
                    <small className="text-muted">Nenhum projeto selecionado</small>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Exemplo com Dados Financeiros */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">2. Dados Financeiros</h5>
            </Card.Header>
            <Card.Body>
              <ProjectFilter
                selectedProjects={financialSelectedProjects}
                onChange={setFinancialSelectedProjects}
                dataSource="financial"
                label="Projetos Financeiros"
                options={{
                  helpText: "Selecione projetos para análise financeira",
                  minHeight: "150px"
                }}
                onError={handleError}
              />
              
              <div className="mt-3">
                <h6>Seleção Atual:</h6>
                <div className="bg-light p-2 rounded">
                  <small>
                    {financialSelectedProjects.length > 0 
                      ? `${financialSelectedProjects.length} projeto(s) selecionado(s)`
                      : 'Nenhuma seleção'
                    }
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Exemplo Customizado */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">3. Projetos Customizados</h5>
            </Card.Header>
            <Card.Body>
              <ProjectFilter
                selectedProjects={customSelectedProjects}
                onChange={setCustomSelectedProjects}
                dataSource="custom"
                customProjects={customProjects}
                label="Projetos de Desenvolvimento"
                options={{
                  showAllOption: true,
                  showNoneOption: true,
                  allOptionText: "🚀 Todos os Projetos",
                  noneOptionText: "❌ Nenhum Projeto",
                  helpText: "Projetos de exemplo para demonstração",
                  minHeight: "180px"
                }}
                onError={handleError}
              />
              
              <div className="mt-3 d-flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline-primary"
                  onClick={handleSelectAllCustom}
                >
                  Selecionar Todos
                </Button>
                <Button 
                  size="sm" 
                  variant="outline-secondary"
                  onClick={handleClearCustom}
                >
                  Limpar Seleção
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Exemplo com Hook */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">4. Usando Hook useProjectFilter</h5>
            </Card.Header>
            <Card.Body>
              <ProjectFilter
                selectedProjects={hookProjects}
                onChange={handleProjectChange}
                dataSource="transactions"
                label="Com Hook Utilitário"
                options={{
                  helpText: "Exemplo usando o hook useProjectFilter",
                  className: "border-primary"
                }}
                onError={handleError}
              />
              
              <div className="mt-3 d-flex gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  variant="success"
                  onClick={() => selectAll(customProjects)}
                >
                  Hook: Selecionar Todos
                </Button>
                <Button 
                  size="sm" 
                  variant="warning"
                  onClick={clearSelection}
                >
                  Hook: Limpar
                </Button>
              </div>
              
              <div className="mt-2">
                <small className="text-info">
                  Estado gerenciado pelo hook: {hookProjects.length} projeto(s)
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Exemplo Compacto */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">5. Versão Compacta</h5>
            </Card.Header>
            <Card.Body>
              <ProjectFilter
                selectedProjects={customSelectedProjects.slice(0, 2)}
                onChange={(projects) => setCustomSelectedProjects(projects.slice(0, 2))}
                dataSource="custom"
                customProjects={customProjects.slice(0, 3)}
                label="Filtro Compacto"
                options={{
                  showAllOption: false,
                  showNoneOption: false,
                  helpText: "",
                  minHeight: "100px",
                  className: "form-select-sm"
                }}
                onError={handleError}
              />
              
              <div className="mt-2">
                <small className="text-muted">
                  Versão simplificada sem opções especiais
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Exemplo com Erro Simulado */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">6. Tratamento de Erro</h5>
            </Card.Header>
            <Card.Body>
              <ProjectFilter
                selectedProjects={[]}
                onChange={() => {}}
                dataSource="custom"
                customProjects={undefined} // Vai causar erro
                label="Teste de Erro"
                options={{
                  helpText: "Este exemplo demonstra o tratamento de erro"
                }}
                onError={handleError}
              />
              
              <div className="mt-2">
                <small className="text-warning">
                  ⚠️ Este exemplo propositalmente causa erro para demonstrar o tratamento
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Resumo das Seleções */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📊 Resumo das Seleções</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <h6>Básico:</h6>
                  <p className="small text-muted">
                    {basicSelectedProjects.length} projeto(s)
                  </p>
                </Col>
                <Col md={3}>
                  <h6>Financeiro:</h6>
                  <p className="small text-muted">
                    {financialSelectedProjects.length} projeto(s)
                  </p>
                </Col>
                <Col md={3}>
                  <h6>Customizado:</h6>
                  <p className="small text-muted">
                    {customSelectedProjects.length} projeto(s)
                  </p>
                </Col>
                <Col md={3}>
                  <h6>Hook:</h6>
                  <p className="small text-muted">
                    {hookProjects.length} projeto(s)
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Informações de Debug */}
      <Row className="mt-3">
        <Col>
          <Card className="border-info">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">🔧 Debug Info</h6>
            </Card.Header>
            <Card.Body>
              <pre className="small mb-0">
                {JSON.stringify({
                  basicSelectedProjects,
                  financialSelectedProjects,
                  customSelectedProjects: customSelectedProjects.slice(0, 2),
                  hookProjects,
                  customProjectsAvailable: customProjects.length,
                  lastError: error
                }, null, 2)}
              </pre>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProjectFilterExample;