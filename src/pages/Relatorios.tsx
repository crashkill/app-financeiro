import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap'

const Relatorios = () => {
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Relatórios</h1>
          <p className="text-muted">Visualize seus relatórios financeiros</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Filtros</Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Período</Form.Label>
                  <Form.Select>
                    <option>Último mês</option>
                    <option>Últimos 3 meses</option>
                    <option>Últimos 6 meses</option>
                    <option>Este ano</option>
                    <option>Personalizado</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select>
                    <option>Todos</option>
                    <option>Receitas</option>
                    <option>Despesas</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select>
                    <option>Todas</option>
                    <option>Moradia</option>
                    <option>Alimentação</option>
                    <option>Transporte</option>
                    <option>Saúde</option>
                    <option>Educação</option>
                  </Form.Select>
                </Form.Group>

                <Button variant="primary" className="w-100">
                  Gerar Relatório
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Row>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>Balanço Mensal</Card.Title>
                  <Card.Text className="h2">
                    R$ 3.000,00
                  </Card.Text>
                  <div className="text-muted small">
                    Receitas: R$ 8.000,00<br />
                    Despesas: R$ 5.000,00
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>Economia Mensal</Card.Title>
                  <Card.Text className="h2 text-success">
                    37,5%
                  </Card.Text>
                  <div className="text-muted small">
                    Percentual economizado em relação à receita
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>Distribuição de Despesas por Categoria</Card.Title>
                  <div className="text-center text-muted py-5">
                    Área reservada para gráfico
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  )
}

export default Relatorios
