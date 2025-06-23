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
  PointElement,
  BarController
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Chart } from 'react-chartjs-2'
import type { Transacao } from '../db/database'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
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
      currency: 'BRL',
      signDisplay: 'never'
    }).format(Math.abs(value))
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

  const labels = Array.from(monthlyData.keys()).map(formatMonth)

  const datasets = [
    {
      label: 'Custo',
      data: Array.from(monthlyData.values()).map(d => d.custo),
      backgroundColor: 'rgba(255, 99, 132, 0.7)', // Rosa suave
      stack: 'Stack 0',
      type: 'bar' as const,
      order: 2,
    },
    {
      label: 'Receita',
      data: Array.from(monthlyData.values()).map(d => d.receita),
      backgroundColor: 'rgba(75, 192, 192, 0.7)', // Verde água suave
      stack: 'Stack 0',
      type: 'bar' as const,
      order: 3,
    }
  ]

  const getThemeColor = (lightColor: string, darkColor: string): string => {
    if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return darkColor;
    }
    return lightColor;
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      datalabels: {
        display: true,
        align: 'center' as const,
        anchor: 'center' as const,
        rotation: 270,
        formatter: (value: number) => formatCurrency(value),
        color: '#fff',
        font: {
          weight: 'bold' as const,
        },
      },
      title: {
        display: true,
        text: 'Análise Financeira por Mês',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
        color: getThemeColor('rgb(55, 65, 81)', '#f9fafb'), // Cor do foreground.dark
      },
      legend: {
        position: 'top' as const,
        labels: {
          color: getThemeColor('rgb(71, 85, 105)', '#f9fafb'), // Cor do foreground.dark
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
          color: getThemeColor('rgba(209, 213, 219, 0.5)', 'rgba(55, 65, 81, 0.5)') // Cor do border.dark com opacidade
        },
        ticks: {
          color: getThemeColor('rgb(71, 85, 105)', 'rgb(148, 163, 184)') // Aprox. text-slate-600 / text-slate-400
        }
      },
      y: {
        stacked: true,
        grid: {
          display: false,
          color: getThemeColor('rgba(209, 213, 219, 0.5)', 'rgba(55, 65, 81, 0.5)') // Cor do border.dark com opacidade
        },
        ticks: {
          callback: (value: any) => `R$ ${value}`,
          color: getThemeColor('rgb(71, 85, 105)', 'rgb(148, 163, 184)') // Aprox. text-slate-600 / text-slate-400
        }
      }
    },
  };

  const chartData = {
    labels,
    datasets: datasets.map(ds => ({
      ...ds,
      datalabels: {
        display: true,
        align: 'center' as const,
        anchor: 'center' as const,
        rotation: 270,
        formatter: (value: number) => formatCurrency(value),
        color: '#fff',
        font: {
          weight: 'bold' as const,
        },
      },
    })),
  };

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <Chart type='bar' options={options} data={chartData} />
    </div>
  )
}
