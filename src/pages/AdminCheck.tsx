import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthProviderSwitch';

const AdminCheck: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const storedUser = localStorage.getItem('user');

  return (
    <Container className="py-4">
      <h2>Status do Usuário</h2>

      <Card className="mt-4">
        <Card.Body>
          <h4>Informações do Contexto</h4>
          <pre>
            {JSON.stringify({ user, isAdmin }, null, 2)}
          </pre>

          <h4 className="mt-4">Informações do LocalStorage</h4>
          <pre>
            {JSON.stringify(JSON.parse(storedUser || '{}'), null, 2)}
          </pre>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminCheck;
