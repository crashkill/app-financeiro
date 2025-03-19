import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
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
  const [servers, setServers] = useState<Array<{name: string, systemId: string}>>([]);
  const [loadingServers, setLoadingServers] = useState(true);

  // Carrega os servidores disponíveis
  useEffect(() => {
    const loadServers = async () => {
      try {
        setLoadingServers(true);
        // Carrega as configurações do SAP GUI
        await sapGuiService.loadSAPGUIConfig();
        // Obtém os servidores disponíveis
        const availableServers = sapGuiService.getAvailableServers();
        setServers(availableServers);
      } catch (error) {
        console.error('Erro ao carregar servidores:', error);
        setError('Não foi possível carregar a lista de servidores SAP.');
      } finally {
        setLoadingServers(false);
      }
    };

    loadServers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await sapGuiService.connect(server, { username, password });
      if (success) {
        onLoginSuccess();
      } else {
        setError('Falha na autenticação. Verifique suas credenciais.');
      }
    } catch (error: any) {
      setError(`Erro ao conectar ao SAP: ${error.message || 'Verifique suas credenciais.'}`);
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
            {loadingServers ? (
              <div className="d-flex align-items-center mb-3">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Carregando servidores...</span>
              </div>
            ) : (
              <Form.Select
                value={server}
                onChange={(e) => setServer(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Selecione um servidor</option>
                {servers.map((s) => (
                  <option key={s.systemId} value={s.systemId}>
                    {s.name} ({s.systemId})
                  </option>
                ))}
              </Form.Select>
            )}
            <Form.Text className="text-muted">
              Servidores carregados do arquivo de configuração SAP.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Usuário</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Senha</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </Form.Group>

          <Button 
            type="submit" 
            variant="primary" 
            disabled={loading || loadingServers}
            className="w-100"
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Conectando...
              </>
            ) : (
              'Conectar ao SAP'
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default SAPLogin; 