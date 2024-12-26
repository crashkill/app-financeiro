import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Form } from 'react-bootstrap'
import { db } from '../db/database'
import type { Transacao } from '../db/database'
import { ProjectCharts } from '../components/ProjectCharts'

const Dashboard = () => {
  const [allTransactions, setAllTransactions] = useState<Transacao[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transacao[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [projects, setProjects] = useState<string[]>([])
  const [years, setYears] = useState<number[]>([])
  const [totais, setTotais] = useState({
    receita: 0,
    custo: 0
  })

  // Carregar todas as transações
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const transacoes = await db.transacoes.toArray()
        setAllTransactions(transacoes)

        // Extrair lista única de projetos
        const uniqueProjects = Array.from(new Set(transacoes.map(t => t.descricao || 'Sem Projeto')))
        setProjects(uniqueProjects)

        // Extrair lista única de anos
        const uniqueYears = Array.from(new Set(transacoes.map(t => {
          const [, ano] = (t.periodo || '').split('/')
          return parseInt(ano)
        }))).filter(year => !isNaN(year)).sort((a, b) => b - a) // Ordenar decrescente

        setYears(uniqueYears)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    carregarDados()
  }, [])

  // Filtrar transações quando a seleção muda
  useEffect(() => {
    const filtered = allTransactions.filter(t => {
      // Filtrar por projeto
      const matchProject = selectedProjects.length === 0 || 
        selectedProjects.includes(t.descricao || 'Sem Projeto')

      // Filtrar por ano
      const [, ano] = (t.periodo || '').split('/')
      const matchYear = parseInt(ano) === selectedYear

      return matchProject && matchYear
    })
    
    setFilteredTransactions(filtered)
  }, [selectedProjects, selectedYear, allTransactions])

  // Calcular totais quando as transações filtradas mudam
  useEffect(() => {
    const totaisCalculados = filteredTransactions.reduce((acc, transacao) => {
      const valor = typeof transacao.lancamento === 'number' ? transacao.lancamento : 0
      
      if (transacao.natureza === 'RECEITA') {
        acc.receita += valor
      } else if (transacao.natureza === 'CUSTO') {
        acc.custo += valor
      }
      return acc
    }, { receita: 0, custo: 0 })

    setTotais(totaisCalculados)
  }, [filteredTransactions])

  // Handler para mudança na seleção de projetos
  const handleProjectSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options
    const selected: string[] = []
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value)
      }
    }
    setSelectedProjects(selected)
  }

  // Handler para mudança na seleção do ano
  const handleYearSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value))
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Dashboard</h1>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={9}>
          <Card className="shadow">
            <Card.Body>
              <Form.Group>
                <Form.Label><strong>Filtrar Projetos</strong></Form.Label>
                <Form.Select 
                  multiple 
                  size={5}
                  onChange={handleProjectSelection}
                  value={selectedProjects}
                  className="form-control"
                >
                  {projects.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Segure Ctrl para selecionar múltiplos projetos. Nenhuma seleção mostra todos os projetos.
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow h-100">
            <Card.Body>
              <Form.Group>
                <Form.Label><strong>Filtrar Ano</strong></Form.Label>
                <Form.Select
                  onChange={handleYearSelection}
                  value={selectedYear}
                  className="form-control"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Receita Total</Card.Title>
              <Card.Text className="h2 text-success">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totais.receita)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Custo Total</Card.Title>
              <Card.Text className="h2 text-danger">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(Math.abs(totais.custo))}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow">
            <Card.Body>
              <ProjectCharts transactions={filteredTransactions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard
