import React from 'react';
import { Card } from 'react-bootstrap';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import swaggerSpec from '../../../swagger/swagger.json';

const API: React.FC = () => {
  return (
    <div>
      <h2 className="mb-4">Documentação da API</h2>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Endpoints e Modelos</h3>
        </Card.Header>
        <Card.Body className="p-0">
          <SwaggerUI spec={swaggerSpec} />
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Exemplos de Uso</h3>
        </Card.Header>
        <Card.Body>
          <h4 className="h6">Autenticação</h4>
          <p>Todas as requisições devem incluir o token de autenticação no header:</p>
          <pre className="bg-light p-3 rounded">
            {`Authorization: Bearer <seu-token-jwt>`}
          </pre>

          <h4 className="h6 mt-4">Exemplo de Requisição</h4>
          <pre className="bg-light p-3 rounded">
            {`fetch('/api/projetos', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <seu-token-jwt>',
    'Content-Type': 'application/json'
  }
})`}
          </pre>

          <h4 className="h6 mt-4">Tratamento de Erros</h4>
          <p>A API retorna os seguintes códigos de status:</p>
          <ul>
            <li><code>200</code> - Sucesso</li>
            <li><code>400</code> - Erro de validação</li>
            <li><code>401</code> - Não autorizado</li>
            <li><code>403</code> - Acesso negado</li>
            <li><code>404</code> - Recurso não encontrado</li>
            <li><code>500</code> - Erro interno do servidor</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default API;
