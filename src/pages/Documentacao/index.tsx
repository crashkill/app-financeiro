import React from 'react';
import { Container, Row, Col, Nav, Tab } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

// Componentes da documentação
import Visao from './components/Visao';
import Arquitetura from './components/Arquitetura';
import Calculos from './components/Calculos';
import API from './components/API';

const Documentacao: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Documentação do Sistema</h1>
      
      <Tab.Container id="documentacao-tabs" defaultActiveKey="visao">
        <Row>
          <Col md={3}>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="visao">Visão Geral</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="arquitetura">Arquitetura</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="calculos">Cálculos e Regras</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="api">API</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          
          <Col md={9}>
            <Tab.Content>
              <Tab.Pane eventKey="visao">
                <Visao />
              </Tab.Pane>
              <Tab.Pane eventKey="arquitetura">
                <Arquitetura />
              </Tab.Pane>
              <Tab.Pane eventKey="calculos">
                <Calculos />
              </Tab.Pane>
              <Tab.Pane eventKey="api">
                <API />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default Documentacao;
