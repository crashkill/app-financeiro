import { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { useConfig } from '../contexts/ConfigContext'

const Configuracoes = () => {
  const { user } = useAuth()
  const { config, updateConfig } = useConfig()
  const [showSuccess, setShowSuccess] = useState(false)

  const handlePreferenceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    updateConfig({
      currency: formData.get('currency') as string,
      dateFormat: formData.get('dateFormat') as string,
      notifications: formData.get('notifications') === 'on',
      darkMode: formData.get('darkMode') === 'on',
    })

    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Configurações</h1>
          <p className="text-muted">Gerencie suas preferências</p>
        </Col>
      </Row>

      {showSuccess && (
        <Row className="mb-4">
          <Col>
            <Alert variant="success">
              Configurações salvas com sucesso!
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="mb-4">Perfil</Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control type="text" defaultValue={user?.email} disabled />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" defaultValue={user?.email} disabled />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="mb-4">Preferências</Card.Title>
              <Form onSubmit={handlePreferenceSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Moeda</Form.Label>
                  <Form.Select 
                    name="currency"
                    defaultValue={config.currency}
                  >
                    <option value="BRL">Real (R$)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Formato de Data</Form.Label>
                  <Form.Select 
                    name="dateFormat"
                    defaultValue={config.dateFormat}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check 
                    type="switch"
                    id="notifications"
                    name="notifications"
                    label="Receber notificações"
                    defaultChecked={config.notifications}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check 
                    type="switch"
                    id="darkMode"
                    name="darkMode"
                    label="Modo escuro"
                    defaultChecked={config.darkMode}
                  />
                </Form.Group>

                <Button variant="primary" type="submit">
                  Salvar Preferências
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Configuracoes
