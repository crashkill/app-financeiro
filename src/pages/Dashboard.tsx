import { Container, Row, Col, Card } from 'react-bootstrap'
import { useConfig } from '../contexts/ConfigContext'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { config } = useConfig()
  const { user } = useAuth()

  // Buscar receita total (soma dos lançamentos onde natureza = RECEITA)
  const receitaTotal = useLiveQuery(async () => {
    const transacoes = await db.transacoes
      .where('natureza')
      .equals('RECEITA')
      .toArray()
    
    return transacoes.reduce((total, transacao) => total + transacao.lancamento, 0)
  }, []) || 0

  // Buscar custo total (soma dos lançamentos onde natureza = CUSTO)
  const custoTotal = useLiveQuery(async () => {
    const transacoes = await db.transacoes
      .where('natureza')
      .equals('CUSTO')
      .toArray()
    
    return transacoes.reduce((total, transacao) => total + transacao.lancamento, 0)
  }, []) || 0

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: config.currency
    }).format(value)
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Dashboard</h1>
          <p className="text-muted">Bem-vindo, {user?.name}!</p>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <h5 className="text-muted mb-2">Receita Total</h5>
              <h2 className="text-success mb-0">
                {formatMoney(receitaTotal)}
              </h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <h5 className="text-muted mb-2">Custo Total</h5>
              <h2 className="text-danger mb-0">
                {formatMoney(custoTotal)}
              </h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard
