import { useEffect, useState } from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { db } from '../db/database'
import type { Transacao } from '../db/database'
import { ProjectCharts } from '../components/ProjectCharts'
import FilterPanel from '../components/FilterPanel'
import { Bar, Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const Dashboard = () => {
  const [allTransactions, setAllTransactions] = useState<Transacao[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transacao[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [projects, setProjects] = useState<string[]>([])
  const [years, setYears] = useState<number[]>([])
  const [totais, setTotais] = useState({
    receita: 0,
    custo: 0,
    margem: 0,
    margemPercentual: 0
  })
  
  // Dados mensais para gráficos adicionais
  const [dadosMensais, setDadosMensais] = useState<{
    meses: string[],
    receitas: number[],
    custos: number[],
    margens: number[]
  }>({
    meses: [],
    receitas: [],
    custos: [],
    margens: []
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

  // Calcular totais e dados mensais quando as transações filtradas mudam
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

    // Calcular margem e margem percentual
    const margem = totaisCalculados.receita - Math.abs(totaisCalculados.custo);
    const margemPercentual = totaisCalculados.receita !== 0 
      ? (1 - (Math.abs(totaisCalculados.custo) / totaisCalculados.receita)) * 100 
      : 0;

    setTotais({
      ...totaisCalculados,
      margem,
      margemPercentual
    });

    // Preparar dados mensais para gráficos
    const dadosPorMes = new Map<string, { receita: number, custo: number }>();
    
    transacoesRealizadas.forEach(t => {
      const [mes] = (t.periodo || '').split('/');
      if (!mes) return;
      
      const mesFormatado = mes.padStart(2, '0');
      const chave = mesFormatado;
      
      if (!dadosPorMes.has(chave)) {
        dadosPorMes.set(chave, { receita: 0, custo: 0 });
      }
      
      const dados = dadosPorMes.get(chave)!;
      const valor = typeof t.lancamento === 'number' ? t.lancamento : 0;
      const contaResumo = (t.contaResumo || '').toUpperCase().trim();
      
      if (t.natureza === 'RECEITA' && (contaResumo === 'RECEITA DEVENGADA' || contaResumo === 'DESONERAÇÃO DA FOLHA')) {
        dados.receita += valor;
      } else if (t.natureza === 'CUSTO' && 
                (contaResumo.includes('CLT') || 
                 contaResumo.includes('SUBCONTRATADOS') || 
                 contaResumo.includes('OUTROS'))) {
        dados.custo += Math.abs(valor);
      }
    });
    
    // Ordenar meses numericamente
    const mesesOrdenados = Array.from(dadosPorMes.keys()).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Mapear nomes dos meses
    const nomesMeses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    const meses = mesesOrdenados.map(m => nomesMeses[parseInt(m) - 1]);
    const receitas = mesesOrdenados.map(m => dadosPorMes.get(m)!.receita);
    const custos = mesesOrdenados.map(m => dadosPorMes.get(m)!.custo);
    const margens = mesesOrdenados.map(m => {
      const dados = dadosPorMes.get(m)!;
      return dados.receita - dados.custo;
    });
    
    setDadosMensais({ meses, receitas, custos, margens });
    
  }, [filteredTransactions, selectedYear, selectedProjects]);

  // Opções comuns para gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
  };

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
        <Col md={4} className="mb-4">
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
        <Col md={4} className="mb-4">
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
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Margem Total</Card.Title>
              <Card.Text className="h2 text-primary">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'percent',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(totais.margemPercentual / 100)}
              </Card.Text>
              <Card.Text className="text-muted">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totais.margem)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow mb-4">
            <Card.Body>
              <Card.Title>Gráficos de Desempenho</Card.Title>
              <ProjectCharts transactions={filteredTransactions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="shadow mb-4">
            <Card.Body>
              <Card.Title>Evolução Mensal de Receitas e Custos</Card.Title>
              <div style={{ height: '300px' }}>
                <Bar 
                  options={chartOptions}
                  data={{
                    labels: dadosMensais.meses,
                    datasets: [
                      {
                        label: 'Receita',
                        data: dadosMensais.receitas,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                      },
                      {
                        label: 'Custo',
                        data: dadosMensais.custos,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                      }
                    ],
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow mb-4">
            <Card.Body>
              <Card.Title>Tendência de Margem Mensal</Card.Title>
              <div style={{ height: '300px' }}>
                <Line
                  options={chartOptions}
                  data={{
                    labels: dadosMensais.meses,
                    datasets: [
                      {
                        label: 'Margem (R$)',
                        data: dadosMensais.margens,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.1,
                        fill: true
                      }
                    ],
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="shadow mb-4">
            <Card.Body>
              <Card.Title>Distribuição de Receita vs Custo</Card.Title>
              <div style={{ height: '300px' }}>
                <Pie
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(value)} (${((value / (totais.receita + Math.abs(totais.custo))) * 100).toFixed(1)}%)`;
                          }
                        }
                      }
                    }
                  }}
                  data={{
                    labels: ['Receita', 'Custo'],
                    datasets: [
                      {
                        data: [totais.receita, Math.abs(totais.custo)],
                        backgroundColor: [
                          'rgba(75, 192, 192, 0.6)',
                          'rgba(255, 99, 132, 0.6)'
                        ],
                        borderColor: [
                          'rgba(75, 192, 192, 1)',
                          'rgba(255, 99, 132, 1)'
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow mb-4">
            <Card.Body>
              <Card.Title>Composição da Margem</Card.Title>
              <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="text-center">
                  <h1 className="display-4 mb-3">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'percent',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(totais.margemPercentual / 100)}
                  </h1>
                  <p className="lead">Margem = 1 - (Custo/Receita)</p>
                  <div className="d-flex justify-content-around mt-4">
                    <div className="text-success">
                      <strong>Receita:</strong><br />
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totais.receita)}
                    </div>
                    <div className="text-danger">
                      <strong>Custo:</strong><br />
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(Math.abs(totais.custo))}
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard
