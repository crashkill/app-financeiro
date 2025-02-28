import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { sapGuiService } from '../../services/SAPGuiService';

interface SAPLoginProps {
  onLoginSuccess: () => void;
}

const SAPLogin: React.FC<SAPLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const servers = sapGuiService.getAvailableServers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await sapGuiService.connect(server, { username, password });
      if (success) {
        onLoginSuccess();
      }
    } catch (error) {
      setError('Erro ao conectar ao SAP. Verifique suas credenciais.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Header>
        <h4>Login SAP</h4>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Servidor SAP</Form.Label>
            <Form.Select
              value={server}
              onChange={(e) => setServer(e.target.value)}
              required
            >
              <option value="">Selecione um servidor</option>
              {servers.map((s) => (
                <option key={s.systemId} value={s.systemId}>
                  {s.name} ({s.systemId})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Usuário</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Senha</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button 
            type="submit" 
            variant="primary" 
            disabled={loading}
            className="w-100"
          >
            {loading ? 'Conectando...' : 'Conectar ao SAP'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default SAPLogin; 