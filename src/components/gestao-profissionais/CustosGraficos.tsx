import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
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
    console.log('Dados recebidos:', custosPorTipo);

    // Define ordem específica para os tipos de custo e seus labels de exibição
    const tiposConfig = {
        'SUBCONTRATADOS': { label: 'Subcontratados', key: 'SUBCONTRATADOS', color: 'rgba(255, 159, 64, 0.7)', borderColor: 'rgba(255, 159, 64, 1)' },
        'CLT': { label: 'CLT', key: 'CLT', color: 'rgba(54, 162, 235, 0.7)', borderColor: 'rgba(54, 162, 235, 1)' }
    };
    
    const ordemTipos = ['SUBCONTRATADOS', 'CLT'];

    // Garante que todos os tipos tenham valores, mesmo que zero
    const dadosNormalizados = { ...custosPorTipo };
    ordemTipos.forEach(tipo => {
        if (!dadosNormalizados[tipo]) {
            dadosNormalizados[tipo] = { total: 0, percentual: 0 };
        }
    });

    // Organiza dados na ordem específica
    const tiposOrdenados = Object.entries(dadosNormalizados)
        .filter(([tipo]) => ordemTipos.includes(tipo))
        .sort(([tipoA], [tipoB]) => {
            const indexA = ordemTipos.indexOf(tipoA);
            const indexB = ordemTipos.indexOf(tipoB);
            return indexA - indexB;
        });

    console.log('Dados ordenados:', tiposOrdenados);

    const data = {
        labels: tiposOrdenados.map(([tipo]) => tiposConfig[tipo]?.label || tipo),
        datasets: [
            {
                data: tiposOrdenados.map(([, { total }]) => total),
                backgroundColor: tiposOrdenados.map(([tipo]) => tiposConfig[tipo]?.color),
                borderColor: tiposOrdenados.map(([tipo]) => tiposConfig[tipo]?.borderColor),
                borderWidth: 1,
            },
        ],
    };

    console.log('Dados do gráfico:', data);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const displayLabel = context.label;
                        const valor = formatCurrency(context.raw);
                        
                        // Encontra a chave original baseada no label de exibição
                        const tipoEntry = Object.entries(tiposConfig).find(([_, config]) => config.label === displayLabel);
                        const originalKey = tipoEntry?.[0];
                        
                        // Pega o percentual diretamente do custosPorTipo usando a chave original
                        const percentual = originalKey ? dadosNormalizados[originalKey]?.percentual : 0;
                        
                        return `${displayLabel}: ${valor} (${percentual.toFixed(1)}%)`;
                    }
                }
            },
            datalabels: {
                color: '#000',
                font: {
                    weight: 'bold',
                    size: 11
                },
                formatter: (value: number) => {
                    return value > 0 ? formatCurrency(value) : '';
                },
                display: function(context: any) {
                    return context.dataset.data[context.dataIndex] > 0;
                }
            }
        },
    };

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