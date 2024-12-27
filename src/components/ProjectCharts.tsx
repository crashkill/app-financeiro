import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Chart } from 'react-chartjs-2'
import type { Transacao } from '../db/database'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
)

interface MonthData {
  receita: number
  custo: number
  percentual: number
  margem: number
}

interface ProjectChartsProps {
  transactions: Transacao[]
}

export function ProjectCharts({ transactions }: ProjectChartsProps) {
  const [monthlyData, setMonthlyData] = useState<Map<string, MonthData>>(new Map())

  useEffect(() => {
    const monthMap = new Map<string, MonthData>()

    // Inicializar todos os meses do ano atual
    for (let mes = 1; mes <= 12; mes++) {
      monthMap.set(`${mes}`, { receita: 0, custo: 0, percentual: 0, margem: 0 })
    }

    // Agrupa transações por mês
    transactions.forEach((transacao) => {
      if (!transacao.periodo) return
      
      const [mes] = transacao.periodo.split('/')
      const data = monthMap.get(mes)
      
      if (data) {
        if (transacao.natureza === 'RECEITA') {
          data.receita += transacao.lancamento
        } else {
          data.custo += transacao.lancamento // Mantém o sinal negativo
        }
      }
    })

    // Calcula o percentual e margem
    monthMap.forEach((data) => {
      // Percentual não é mais usado
      data.percentual = 0
      // Margem = (Receita - |Custo|) / Receita
      data.margem = data.receita > 0 ? (data.receita - Math.abs(data.custo)) / data.receita : 0
    })

    setMonthlyData(monthMap)
  }, [transactions])

  // Formatar valor em reais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Formatar valor em milhões
  const formatMillions = (value: number) => {
    return `${(value / 1000000).toFixed(1)} Mi`
  }

  // Formatar percentual
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  // Formatar mês para exibição
  const formatMonth = (mes: string) => {
    const data = new Date(2000, parseInt(mes) - 1, 1)
    return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(data)
  }

  const chartData = {
    labels: Array.from(monthlyData.keys()).map(formatMonth),
    datasets: [
      {
        label: 'Custo',
        data: Array.from(monthlyData.values()).map(d => d.custo),
        backgroundColor: 'rgba(220, 20, 60, 0.8)', // Vermelho mais escuro (Crimson)
        stack: 'Stack 0',
        type: 'bar' as const,
        order: 2,
        datalabels: {
          align: 'center',
          anchor: 'center',
          rotation: -90,
          formatter: (value: number) => formatCurrency(Math.abs(value)),
          color: '#FFFFFF', // Branco
          font: {
            weight: 'bold',
            size: 11
          }
        }
      },
      {
        label: 'Receita',
        data: Array.from(monthlyData.values()).map(d => d.receita),
        backgroundColor: 'rgba(34, 139, 34, 0.8)', // Verde mais escuro (Forest Green)
        stack: 'Stack 0',
        type: 'bar' as const,
        order: 3,
        datalabels: {
          align: 'center',
          anchor: 'center',
          rotation: -90,
          formatter: (value: number) => formatCurrency(value),
          color: '#FFFFFF', // Branco
          font: {
            weight: 'bold',
            size: 11
          }
        }
      },
      {
        label: 'Margem',
        data: Array.from(monthlyData.values()).map(d => d.margem),
        borderColor: 'rgb(53, 162, 235)', // Voltando ao azul original
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        type: 'line' as const,
        yAxisID: 'y1',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        order: 1,
        fill: false
      },
      {
        label: 'Margem Esperada',
        data: Array.from(monthlyData.values()).map(() => 0.07),
        borderColor: 'rgb(25, 25, 112)', // Mantendo azul escuro
        backgroundColor: 'rgba(25, 25, 112, 0.5)',
        type: 'line' as const,
        yAxisID: 'y1',
        tension: 0,
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 1,
        fill: false
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      datalabels: {
        display: true
      },
      title: {
        display: true,
        text: 'Receita, Custo e Margem por Mês',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12
          },
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw
            const label = context.dataset.label
            const dataIndex = context.dataIndex
            const data = Array.from(monthlyData.values())[dataIndex]
            
            if (label === 'Margem') {
              return `${label}: ${formatPercent(value)}`
            } else if (label === 'Margem Esperada') {
              return `${label}: ${formatPercent(value)}`
            } else if (label === 'Receita') {
              return `${label}: ${formatCurrency(value)}`
            } else {
              return [
                `${label}: ${formatCurrency(Math.abs(value))}`,
                `Margem: ${formatPercent(data.margem)}`
              ]
            }
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        position: 'left',
        ticks: {
          callback: function(value: any) {
            return formatCurrency(Math.abs(value))
          }
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        min: 0,
        max: 1,
        ticks: {
          callback: function(value: any) {
            return formatPercent(value)
          }
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  }

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <Chart type='bar' options={options} data={chartData} />
    </div>
  )
}
