import React from 'react';
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap';

const Documentacao: React.FC = () => {
  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Documentação do Sistema</h1>
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Visão Geral</h4>
            </Card.Header>
            <Card.Body>
              <p>
                A Plataforma HITSS é um sistema integrado para gestão financeira e 
                profissional, oferecendo ferramentas para análise de custos, 
                gerenciamento de profissionais e controle financeiro.
              </p>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Módulos do Sistema</h4>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h5>Dashboard</h5>
                <p>Visão geral com indicadores principais e gráficos de desempenho.</p>
              </ListGroup.Item>
              <ListGroup.Item>
                <h5>Gestão de Profissionais</h5>
                <p>Controle e análise de custos dos profissionais por tipo (CLT, Subcontratados, Outros).</p>
              </ListGroup.Item>
              <ListGroup.Item>
                <h5>Planilhas Financeiras</h5>
                <p>Gerenciamento de planilhas e documentos financeiros.</p>
              </ListGroup.Item>
              <ListGroup.Item>
                <h5>Forecast</h5>
                <p>Projeções e análises futuras de custos e receitas.</p>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Links Úteis</h4>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <a href="https://github.com/seu-usuario/plataforma-hitss" target="_blank" rel="noopener noreferrer">
                  Repositório no GitHub
                </a>
              </ListGroup.Item>
              <ListGroup.Item>
                <a href="/gestao-profissionais">Gestão de Profissionais</a>
              </ListGroup.Item>
              <ListGroup.Item>
                <a href="/dashboard">Dashboard</a>
              </ListGroup.Item>
            </ListGroup>
          </Card>

          <Card>
            <Card.Header>
              <h4 className="mb-0">Suporte</h4>
            </Card.Header>
            <Card.Body>
              <p>Para suporte ou dúvidas, entre em contato com:</p>
              <p>Email: suporte@hitss.com.br</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Documentacao;
