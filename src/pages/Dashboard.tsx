import { useEffect, useState } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { db } from '../db/database'
import type { Transacao } from '../db/database'
import { ProjectCharts } from '../components/ProjectCharts'
import FilterPanel from '../components/FilterPanel'

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
    // <<< LOG: Verificar allTransactions
    console.log(`[Dashboard Filtro Ano/Proj] Iniciando filtro. allTransactions.length: ${allTransactions.length}. 10 Primeiras:`, allTransactions.slice(0, 10));
    console.log(`[Dashboard Filtro Ano/Proj] selectedYear: ${selectedYear}, selectedProjects: [${selectedProjects.join(', ')}]`);
    
    const filtered = allTransactions.filter((t, index) => { // Adicionado index
      // Filtrar por projeto
      const matchProject = selectedProjects.length === 0 || 
        selectedProjects.includes(t.projeto || 'Sem Projeto');

      // Filtrar por ano
      const periodoOriginal = t.periodo || '';
      const [, anoStr] = periodoOriginal.split('/');
      const anoInt = parseInt(anoStr);
      const matchYear = anoInt === selectedYear;
      
      // <<< LOG: Detalhes do filtro de ano (primeiras 10 tentativas)
      if (index < 10) {
          console.log(`[Dashboard Filtro Ano/Proj ${index}] periodo: '${periodoOriginal}', anoStr: '${anoStr}', anoInt: ${anoInt}, selectedYear: ${selectedYear}, matchYear: ${matchYear}`);
      }

      return matchProject && matchYear;
    });
    
    console.log(`[Dashboard Filtro Ano/Proj] Resultado (filtered):`, filtered.slice(0, 10));
    
    setFilteredTransactions(filtered);
  }, [selectedProjects, selectedYear, allTransactions]);

  // Calcular totais quando as transações filtradas mudam
  useEffect(() => {
    // Filtrar transações realizadas (não precisamos mais filtrar por Relatorio pois os dados já são filtrados no upload)
    const transacoesRealizadas = filteredTransactions;
    
    console.log(`[Dashboard] Calculando totais sobre ${transacoesRealizadas.length} transações (para Ano=${selectedYear} e ProjetosSelecionados=[${selectedProjects.join(', ')}])`);

    // Diagnóstico: listar todas as receitas para verificar o formato
    const todasReceitas = transacoesRealizadas.filter(t => t.natureza === 'RECEITA');
    console.log(`[Dashboard] Total de transações com natureza RECEITA: ${todasReceitas.length}`);
    
    // Listar os primeiros 5 registros de receita para verificar o formato
    todasReceitas.slice(0, 5).forEach((t, i) => {
      console.log(`[Dashboard] Receita #${i}: ContaResumo="${t.contaResumo}", Valor=${t.lancamento}, Período=${t.periodo}`);
    });
    
    // Verificar registros específicos de RECEITA DEVENGADA
    const receitasDevengadas = transacoesRealizadas.filter(t => 
      (t.contaResumo || '').toUpperCase().trim() === 'RECEITA DEVENGADA');
    console.log(`[Dashboard] Total de transações com ContaResumo "RECEITA DEVENGADA": ${receitasDevengadas.length}`);
    
    // Verificar registros de DESONERAÇÃO DA FOLHA
    const receitasDesoneracao = transacoesRealizadas.filter(t => 
      (t.contaResumo || '').toUpperCase().trim() === 'DESONERAÇÃO DA FOLHA');
    console.log(`[Dashboard] Total de transações com ContaResumo "DESONERAÇÃO DA FOLHA": ${receitasDesoneracao.length}`);

    const totaisCalculados = transacoesRealizadas.reduce((acc, transacao, index) => {
      const valor = typeof transacao.lancamento === 'number' ? transacao.lancamento : 0;
      const contaResumo = (transacao.contaResumo || '').toUpperCase().trim();
      let adicionado = false; // Flag para log

      // Regra para Receita: considera "RECEITA DEVENGADA"
      if (transacao.natureza === 'RECEITA' && contaResumo === 'RECEITA DEVENGADA') {
        acc.receita += valor;
        adicionado = true;
      }
      
      // Regra para Receita: considera também "DESONERAÇÃO DA FOLHA"
      else if (contaResumo === 'DESONERAÇÃO DA FOLHA') {
        acc.receita += valor;
        adicionado = true;
      }
      
      // Regra para Custo: considera CLT, SUBCONTRATADOS, OUTROS
      else if (transacao.natureza === 'CUSTO' && 
              (contaResumo.includes('CLT') || 
               contaResumo.includes('SUBCONTRATADOS') || 
               contaResumo.includes('OUTROS'))) {
        acc.custo += valor;
        adicionado = true;
      }
      
      // <<< LOG: Detalhes da transação sendo processada no reduce (primeiras 20)
      if (index < 20) { 
          console.log(`[Dashboard Reduce ${index}] Transacao: Natureza=${transacao.natureza}, ContaResumo=${contaResumo}, Valor=${valor}, Adicionado=${adicionado}`);
      }
      
      return acc;
    }, { receita: 0, custo: 0 });

    console.log(`[Dashboard] Totais calculados (Refinados): Receita=${totaisCalculados.receita}, Custo=${totaisCalculados.custo}`);

    setTotais(totaisCalculados);
  }, [filteredTransactions, selectedYear, selectedProjects]);

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Dashboard</h1>
        </Col>
      </Row>

      <FilterPanel
        projects={projects}
        selectedProjects={selectedProjects}
        years={years}
        selectedYear={selectedYear}
        onProjectChange={setSelectedProjects}
        onYearChange={setSelectedYear}
      />

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
