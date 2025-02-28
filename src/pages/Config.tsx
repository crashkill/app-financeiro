import React, { useRef } from 'react'
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap'
import { useConfig } from '../contexts/ConfigContext'
import { FaCamera } from 'react-icons/fa'

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
      </Row>
    </Container>
  )
}

export default Config
