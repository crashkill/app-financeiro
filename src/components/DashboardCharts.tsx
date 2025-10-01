import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
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
  Legend,
  Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Line, Pie } from 'react-chartjs-2';
import type { Transacao } from '../db/database';
import { formatCurrency } from '../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

interface DashboardChartsProps {
  transactions: Transacao[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ transactions }) => {
  // Processar dados para gráfico de pizza - Distribuição de custos
  const processarDistribuicaoCustos = () => {
    const custosPorCategoria = transactions.reduce((acc, transacao) => {
      if (transacao.valor < 0) { // Apenas custos (valores negativos)
        const categoria = transacao.categoria || 'Outros';
        acc[categoria] = (acc[categoria] || 0) + Math.abs(transacao.valor);
      }
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(custosPorCategoria);
    const data = Object.values(custosPorCategoria);
    const cores = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 205, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)'
    ];

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: cores.slice(0, labels.length),
        borderColor: cores.slice(0, labels.length).map(cor => cor.replace('0.7', '1')),
        borderWidth: 2
      }]
    };
  };

  // Processar dados para gráfico de linha - Evolução da margem
  const processarEvolucaoMargem = () => {
    const dadosMensais = new Map<string, { receita: number; custo: number }>();

    // Inicializar todos os meses
    for (let mes = 1; mes <= 12; mes++) {
      const chave = mes.toString().padStart(2, '0');
      dadosMensais.set(chave, { receita: 0, custo: 0 });
    }

    // Agrupar transações por mês
    transactions.forEach(transacao => {
      const data = new Date(transacao.data);
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const dadosExistentes = dadosMensais.get(mes) || { receita: 0, custo: 0 };

      if (transacao.valor > 0) {
        dadosExistentes.receita += transacao.valor;
      } else {
        dadosExistentes.custo += Math.abs(transacao.valor);
      }

      dadosMensais.set(mes, dadosExistentes);
    });

    const labels = Array.from(dadosMensais.keys()).map(mes => {
      const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return nomes[parseInt(mes) - 1];
    });

    const margens = Array.from(dadosMensais.values()).map(dados => {
      return dados.receita > 0 ? ((dados.receita - dados.custo) / dados.receita * 100) : 0;
    });

    return {
      labels,
      datasets: [{
        label: 'Margem (%)',
        data: margens,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    };
  };

  // Processar dados para gráfico de barras - Receita vs Custo por projeto
  const processarReceitaCustoPorProjeto = () => {
    const dadosPorProjeto = transactions.reduce((acc, transacao) => {
      const projeto = transacao.projeto || 'Sem Projeto';
      if (!acc[projeto]) {
        acc[projeto] = { receita: 0, custo: 0 };
      }

      if (transacao.valor > 0) {
        acc[projeto].receita += transacao.valor;
      } else {
        acc[projeto].custo += Math.abs(transacao.valor);
      }

      return acc;
    }, {} as Record<string, { receita: number; custo: number }>);

    const labels = Object.keys(dadosPorProjeto);
    const receitas = Object.values(dadosPorProjeto).map(d => d.receita);
    const custos = Object.values(dadosPorProjeto).map(d => d.custo);

    return {
      labels,
      datasets: [
        {
          label: 'Receita',
          data: receitas,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Custo',
          data: custos,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const opcoesComuns = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            return `${label}: ${formatCurrency(value)}`;
          }
        }
      }
    }
  };

  const opcoesPizza = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        formatter: (value: number, context: any) => {
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        },
        color: '#fff',
        font: {
          weight: 'bold' as const,
        }
      }
    }
  };

  const opcoesLinha = {
    ...opcoesComuns,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `${value}%`;
          }
        }
      }
    },
    plugins: {
      ...opcoesComuns.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Margem: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    }
  };

  return (
    <>
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 bg-card text-card-foreground border border-border">
            <Card.Body>
              <Card.Title>Distribuição de Custos por Categoria</Card.Title>
              <div style={{ height: '300px' }}>
                <Pie data={processarDistribuicaoCustos()} options={opcoesPizza} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 bg-card text-card-foreground border border-border">
            <Card.Body>
              <Card.Title>Evolução da Margem Mensal</Card.Title>
              <div style={{ height: '300px' }}>
                <Line data={processarEvolucaoMargem()} options={opcoesLinha} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="bg-card text-card-foreground border border-border">
            <Card.Body>
              <Card.Title>Receita vs Custo por Projeto</Card.Title>
              <div style={{ height: '400px' }}>
                <Bar data={processarReceitaCustoPorProjeto()} options={opcoesComuns} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DashboardCharts;