import React, { useRef } from 'react'
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap'
import { useConfig } from '../contexts/ConfigContext'
import { FaCamera } from 'react-icons/fa'
import AutomationMonitor from '../components/automation/AutomationMonitor'
import AutomationHistory from '../components/automation/AutomationHistory'
import AutomationChart from '../components/automation/AutomationChart'

const Config = () => {
  const { config, updateConfig, uploadUserImage } = useConfig()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        await uploadUserImage(file)
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error)
      }
    }
  }

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ userName: event.target.value })
  }

  return (
    <Container fluid className="py-3">
      <Row className="mb-4">
        <Col>
          <h1>Configurações</h1>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Configurações do Usuário</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-4">
                <div 
                  className="position-relative d-inline-block"
                  style={{ cursor: 'pointer' }}
                  onClick={handleImageClick}
                >
                  {config.userImage ? (
                    <img
                      src={config.userImage}
                      alt="User"
                      className="rounded-circle"
                      style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                      style={{ width: '150px', height: '150px' }}
                    >
                      <FaCamera size={40} className="text-muted" />
                    </div>
                  )}
                  <div 
                    className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2"
                    style={{ transform: 'translate(20%, 20%)' }}
                  >
                    <FaCamera color="white" size={16} />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="d-none"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Nome do Usuário</Form.Label>
                  <Form.Control
                    type="text"
                    value={config.userName}
                    onChange={handleNameChange}
                    placeholder="Digite seu nome"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Formato de Data</Form.Label>
                  <Form.Select 
                    value={config.dateFormat}
                    onChange={(e) => updateConfig({ dateFormat: e.target.value })}
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
                    label="Notificações"
                    checked={config.notifications}
                    onChange={(e) => updateConfig({ notifications: e.target.checked })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="darkMode"
                    label="Modo Escuro"
                    checked={config.darkMode}
                    onChange={(e) => updateConfig({ darkMode: e.target.checked })}
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button variant="primary">
                    Salvar Alterações
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Automação HITSS</h5>
              <p className="text-muted mb-0 small">
                Sistema automatizado que conecta ao HitssControl, baixa dados DRE em formato Excel 
                e processa as informações para a tabela dados_dre no Supabase. 
                Execução programada diariamente às 8h.
              </p>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-info mb-3">
                <strong>Funcionalidade:</strong>
                <ul className="mb-0 mt-2">
                  <li>Conecta automaticamente ao sistema HitssControl</li>
                  <li>Baixa arquivo Excel com dados DRE do período atual</li>
                  <li>Processa e filtra registros "Realizados" com lançamentos válidos</li>
                  <li>Insere dados na tabela <code>dados_dre</code> do Supabase</li>
                  <li>Envia notificação por email sobre o resultado da execução</li>
                </ul>
              </div>
              <AutomationMonitor />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Gráfico de Execuções</h5>
            </Card.Header>
            <Card.Body>
              <AutomationChart 
                data={[
                  { date: '2024-01-15', executions: 5, success: 4, errors: 1 },
                  { date: '2024-01-16', executions: 3, success: 3, errors: 0 },
                  { date: '2024-01-17', executions: 4, success: 3, errors: 1 },
                  { date: '2024-01-18', executions: 6, success: 6, errors: 0 },
                  { date: '2024-01-19', executions: 2, success: 2, errors: 0 },
                  { date: '2024-01-20', executions: 4, success: 3, errors: 1 },
                  { date: '2024-01-21', executions: 5, success: 5, errors: 0 }
                ]}
                type="bar"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Histórico de Execuções</h5>
            </Card.Header>
            <Card.Body>
              <AutomationHistory />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Config
