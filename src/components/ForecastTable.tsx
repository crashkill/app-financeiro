import React from 'react';
import { Card } from 'react-bootstrap';
import type { Transacao } from '../db/database';

interface ForecastTableProps {
  data: Transacao[];
  tipo: string;
  onCellChange: (rowIndex: number, field: string, value: string) => void;
}

const ForecastTable: React.FC<ForecastTableProps> = ({ data, tipo, onCellChange }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const total = data.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{tipo}</h5>
        <span className="text-primary fw-bold">{formatCurrency(total)}</span>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="forecast-table-wrapper">
          <table className="forecast-table table table-hover mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-3 py-3">Projeto</th>
                <th className="px-3 py-3">Período</th>
                <th className="px-3 py-3">Valor</th>
                <th className="px-3 py-3">Grupo</th>
                <th className="px-3 py-3">Natureza</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => {
                const projectName = row.projeto || row.descricao || '';
                const isMarket = projectName.includes('MKT') || projectName.includes('MERCADO');
                const grupo = isMarket ? 'MERCADO' : 'GRUPO';
                const natureza = row.natureza || (row.tipo === 'receita' ? 'RECEITA' : 'CUSTO');

                return (
                  <tr key={rowIndex}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={projectName}
                        className="cell-input"
                        readOnly
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.periodo || ''}
                        onChange={(e) => onCellChange(rowIndex, 'periodo', e.target.value)}
                        className="cell-input"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.valor || ''}
                        onChange={(e) => onCellChange(rowIndex, 'valor', e.target.value)}
                        className="cell-input number-input"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={grupo}
                        className="cell-input"
                        readOnly
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={natureza}
                        className="cell-input"
                        readOnly
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ForecastTable;
