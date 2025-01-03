import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Box, useTheme } from '@mui/material';
import { ForecastData } from '../types/forecast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ForecastChartProps {
  data: ForecastData;
  showArea?: boolean;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ data, showArea = true }) => {
  const theme = useTheme();

  const chartData = {
    labels: Object.keys(data.dados),
    datasets: [
      {
        label: 'Receita',
        data: Object.values(data.dados).map(d => d.receita),
        borderColor: theme.palette.success.main,
        backgroundColor: showArea ? `${theme.palette.success.main}20` : undefined,
        fill: showArea,
        tension: 0.4,
      },
      {
        label: 'Custo',
        data: Object.values(data.dados).map(d => Math.abs(d.custoTotal)),
        borderColor: theme.palette.error.main,
        backgroundColor: showArea ? `${theme.palette.error.main}20` : undefined,
        fill: showArea,
        tension: 0.4,
      },
      {
        label: 'Margem',
        data: Object.values(data.dados).map(d => d.margemBruta),
        borderColor: theme.palette.primary.main,
        backgroundColor: showArea ? `${theme.palette.primary.main}20` : undefined,
        fill: showArea,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Forecast - ${data.projeto}`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(context.parsed.y);
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value);
          }
        }
      }
    }
  };

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

export default ForecastChart;
