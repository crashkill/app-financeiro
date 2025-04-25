import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie } from 'react-chartjs-2';
import { Card } from 'react-bootstrap';
import { formatCurrency } from '../../utils/formatters';

// Registrar os elementos necessários do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface CustoGraficoProps {
  custosPorTipo: {
    [key: string]: {
      total: number;
      percentual: number;
    }
  };
}

const CustosGrafico: React.FC<CustoGraficoProps> = ({ custosPorTipo }) => {
  // Define ordem específica para os tipos de custo
  const ordemTipos = ['CLT', 'SUBCONTRATADOS', 'OUTROS'];
  
  // Organiza dados na ordem específica
  const tiposOrdenados = Object.entries(custosPorTipo)
    .sort(([tipoA], [tipoB]) => {
      const indexA = ordemTipos.indexOf(tipoA);
      const indexB = ordemTipos.indexOf(tipoB);
      return indexA - indexB;
    });

  const data = {
    labels: tiposOrdenados.map(([tipo]) => tipo),
    datasets: [
      {
        data: tiposOrdenados.map(([, { total }]) => total),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',   // CLT - Azul
          'rgba(255, 159, 64, 0.7)',   // SUBCONTRATADOS - Laranja
          'rgba(75, 192, 192, 0.7)',   // OUTROS - Verde água
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Definir options com casting para evitar erros de tipo
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            // Formatar o valor usando Intl.NumberFormat para garantir formato em Reais
            const valor = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(context.raw);
            
            const percentual = custosPorTipo[context.label].percentual.toFixed(1);
            return `${context.label}: ${valor} (${percentual}%)`;
          }
        }
      },
      // Configuração para formatar os rótulos dos valores no gráfico
      datalabels: {
        formatter: (value: number) => {
          // Formatar para mostrar em milhares (K) para tornar mais legível
          if (value >= 1000000) {
            return `R$ ${(value / 1000000).toFixed(1)}M`;
          } else if (value >= 1000) {
            return `R$ ${(value / 1000).toFixed(0)}K`;
          }
          return formatCurrency(value);
        },
        color: '#000',
        font: {
          weight: 'bold' as const,
          size: 14
        },
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 4,
        padding: 6
      }
    },
  } as ChartOptions<'pie'>;

  return (
    <Card className="h-100 d-flex flex-column">
      <Card.Body className="d-flex flex-column align-items-center justify-content-center">
        <Card.Title className="text-center mb-4">Distribuição de Custos</Card.Title>
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <Pie data={data} options={options} />
        </div>
      </Card.Body>
    </Card>
  );
};

export default CustosGrafico;