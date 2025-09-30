import { useState, useMemo } from 'react'
import { Container, Row, Col, Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap'
import { useTransacoes } from '../hooks/useTransacoes'
import { Transacao } from '../db/database'
import { useConfig } from '../contexts/ConfigContext'
import { YearFilter, ProjectFilter } from '../components/filters'

const Despesas = () => {
  const { config } = useConfig()
  const { transacoes, total, adicionarTransacao, editarTransacao, excluirTransacao, isLoading } = useTransacoes({ tipo: 'despesa' })
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Filtrar transações por ano e projetos selecionados
  const filteredTransactions = useMemo(() => {
    return transacoes.filter(transacao => {
      // Filtro por ano
      const transacaoYear = transacao.periodo ? transacao.periodo.split('/')[1] : new Date(transacao.data).getFullYear().toString()
      const yearMatch = selectedYear === 'all' || transacaoYear === selectedYear
      
      // Filtro por projetos (se nenhum projeto selecionado, mostra todos)
      const projectMatch = selectedProjects.length === 0 || 
        (transacao.projeto && selectedProjects.includes(transacao.projeto))
      
      return yearMatch && projectMatch
    })
  }, [transacoes, selectedYear, selectedProjects])

  // Calcular total das transações filtradas
  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, transacao) => sum + transacao.valor, 0)
  }, [filteredTransactions])
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: '',
    categoria: '',
    observacao: ''
  })

  const handleClose = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({
      descricao: '',
      valor: '',
      data: '',
      categoria: '',
      observacao: ''
    })
  }

  const handleShow = (transacao?: Transacao) => {
    if (transacao) {
      setEditingId(transacao.id ?? null)
      setFormData({
        descricao: transacao.descricao,
        valor: transacao.valor.toString(),
        data: transacao.data,
        categoria: transacao.categoria,
        observacao: transacao.observacao || ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const valor = parseFloat(formData.valor)
    const transacao: Omit<Transacao, 'id'> = {
      tipo: 'despesa',
      natureza: 'CUSTO',
      descricao: formData.descricao,
      valor: valor,
      data: formData.data,
      categoria: formData.categoria,
      observacao: formData.observacao,
      lancamento: valor,
      periodo: new Date(formData.data).toLocaleDateString('pt-BR', { month: 'numeric', year: 'numeric' })
    }

    if (editingId !== null) {
      await editarTransacao(editingId, transacao)
    } else {
      await adicionarTransacao(transacao)
    }

    handleClose()
  }

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: config.currency
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </Container>
    )
  }

  return (
    <Container fluid className="py-3">
      <Row className="mb-4">
        <Col>
          <h1>Despesas</h1>
          <p className="text-muted">Gerencie suas despesas</p>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Filtros</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3">
              <YearFilter
                selectedYear={selectedYear}
                onChange={setSelectedYear}
                label="Filtrar por Ano"
              />
            </Col>
            <Col md={6} className="mb-3">
              <ProjectFilter
                selectedProjects={selectedProjects}
                onChange={setSelectedProjects}
                label="Filtrar por Projetos"
                dataSource="transactions"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Total de Despesas</h5>
                  <h2 className="text-danger mb-0">{formatMoney(filteredTotal)}</h2>
                  <small className="text-muted">
                    {filteredTransactions.length} de {transacoes.length} despesas
                  </small>
                </div>
                <Button variant="primary" onClick={() => handleShow()}>
                  Nova Despesa
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transacao) => (
                    <tr key={transacao.id}>
                      <td>{formatDate(transacao.data)}</td>
                      <td>{transacao.descricao}</td>
                      <td>{transacao.categoria}</td>
                      <td>{formatMoney(transacao.valor)}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShow(transacao)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => transacao.id && excluirTransacao(transacao.id)}
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">
                        {transacoes.length === 0 ? 'Nenhuma despesa cadastrada' : 'Nenhuma despesa encontrada com os filtros aplicados'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Editar Despesa' : 'Nova Despesa'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Valor</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Data</Form.Label>
              <Form.Control
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Categoria</Form.Label>
              <Form.Select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                required
              >
                <option value="">Selecione uma categoria</option>
                <option value="Moradia">Moradia</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Transporte">Transporte</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Lazer">Lazer</option>
                <option value="Outros">Outros</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observação</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Salvar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Despesas
