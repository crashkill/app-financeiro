import React, { useState } from 'react';
import { Table } from 'react-bootstrap';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { currencyMask } from '../utils/masks';

interface ForecastTableProps {
  data: Array<{
    projeto: string;
    dados: {
      [mes: string]: {
        receita: number;
        custoTotal: number;
        margemBruta: number;
        margemPercentual: number;
      };
    };
    totais: {
      receita: number;
      custoTotal: number;
      margemBruta: number;
      margemPercentual: number;
    };
  }>;
  onValueChange: (projeto: string, mes: string, tipo: 'receita' | 'custoTotal', valor: number) => void;
}

const ForecastTable: React.FC<ForecastTableProps> = ({ data, onValueChange }) => {
  const [editingValues, setEditingValues] = useState<{[key: string]: string}>({});
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth(); // 0-11

  // Obtém o ano do primeiro item de dados (assumindo que todos os itens são do mesmo ano)
  const anoSelecionado = data[0]?.dados ? 
    parseInt(Object.keys(data[0].dados)[0]?.split('/')[1] || String(anoAtual)) + 2000 
    : anoAtual;

  const isEditable = (mes: string, ano: number) => {
    const mesIndex = meses.indexOf(mes);
    return ano === anoAtual && mesIndex >= mesAtual;
  };

  const getEditingKey = (projeto: string, mes: string, tipo: 'receita' | 'custoTotal') => {
    return `${projeto}-${mes}-${tipo}`;
  };

  const handleFocus = (projeto: string, mes: string, tipo: 'receita' | 'custoTotal', value: number) => {
    const key = getEditingKey(projeto, mes, tipo);
    setEditingValues(prev => ({
      ...prev,
      [key]: currencyMask(Math.abs(value).toString().replace('.', ''))
    }));
  };

  const handleBlur = (
    projeto: string,
    mes: string,
    tipo: 'receita' | 'custoTotal',
    currentValue: number
  ) => {
    const key = getEditingKey(projeto, mes, tipo);
    const editingValue = editingValues[key];

    if (!editingValue) {
      return;
    }

    // Remove caracteres não numéricos
    const numericValue = editingValue.replace(/[^0-9]/g, '');
    
    // Converte para número considerando 2 casas decimais
    let valor = parseInt(numericValue) / 100;

    // Se for custo, torna o valor negativo
    if (tipo === 'custoTotal') {
      valor = -Math.abs(valor);
    }

    // Limpa o valor em edição
    setEditingValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });

    // Chama o callback apenas se o valor mudou
    if (valor !== currentValue) {
      onValueChange(projeto, mes, tipo, valor);
    }
  };

  const handleChange = (projeto: string, mes: string, tipo: 'receita' | 'custoTotal', event: React.ChangeEvent<HTMLInputElement>) => {
    const key = getEditingKey(projeto, mes, tipo);
    const value = event.target.value;
    setEditingValues(prev => ({
      ...prev,
      [key]: currencyMask(value)
    }));
  };

  return (
    <div className="table-responsive">
      <Table hover className="align-middle" style={{ fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th className="text-center text-white" style={{ 
                width: '150px', 
                fontWeight: 'bold',
                backgroundColor: '#4A90E2',
                padding: '10px'
              }}>
              PROJETO
            </th>
            {meses.map(mes => (
              <th key={mes} className="text-center text-white" style={{ 
                width: '120px', 
                fontWeight: 'bold',
                backgroundColor: '#4A90E2',
                padding: '10px'
              }}>
                {mes}/{String(anoSelecionado).slice(-2)}
              </th>
            ))}
            <th className="text-center text-white" style={{ 
                width: '120px', 
                fontWeight: 'bold',
                backgroundColor: '#4A90E2',
                padding: '10px'
              }}>
              TOTAL
            </th>
          </tr>
        </thead>

        {data.map((projeto, index) => (
          <tbody key={index} className="border-bottom">
            <tr>
              <td colSpan={14} className="bg-light fw-bold py-3">
                {projeto.projeto}
              </td>
            </tr>
            <tr>
              <td className="bg-white position-sticky start-0">Receita</td>
              {meses.map(mes => {
                const mesAno = `${mes}/${String(anoSelecionado).slice(-2)}`;
                const valor = projeto.dados[mesAno]?.receita || 0;
                const editavel = isEditable(mes, anoSelecionado);
                const editingKey = getEditingKey(projeto.projeto, mesAno, 'receita');

                return (
                  <td key={mes} className="position-relative p-0" style={{ height: '41px' }}>
                    {editavel ? (
                      <input
                        type="text"
                        className="form-control border-0 text-center h-100"
                        style={{ color: '#28a745' }}
                        value={editingValues[editingKey] || formatCurrency(Math.abs(valor))}
                        onChange={(e) => handleChange(projeto.projeto, mesAno, 'receita', e)}
                        onFocus={() => handleFocus(projeto.projeto, mesAno, 'receita', valor)}
                        onBlur={() => handleBlur(projeto.projeto, mesAno, 'receita', valor)}
                      />
                    ) : (
                      <div className="px-2 py-2 text-center" style={{ color: '#28a745' }}>
                        {formatCurrency(valor)}
                      </div>
                    )}
                  </td>
                );
              })}
              <td className="text-center bg-light fw-bold" style={{ color: '#28a745' }}>
                {formatCurrency(projeto.totais.receita)}
              </td>
            </tr>
            <tr>
              <td className="bg-white position-sticky start-0">Custo Total</td>
              {meses.map(mes => {
                const mesAno = `${mes}/${String(anoSelecionado).slice(-2)}`;
                const valor = projeto.dados[mesAno]?.custoTotal || 0;
                const editavel = isEditable(mes, anoSelecionado);
                const editingKey = getEditingKey(projeto.projeto, mesAno, 'custoTotal');

                return (
                  <td key={mes} className="position-relative p-0" style={{ height: '41px' }}>
                    {editavel ? (
                      <input
                        type="text"
                        className="form-control border-0 text-center h-100"
                        style={{ color: '#dc3545' }}
                        value={editingValues[editingKey] || formatCurrency(Math.abs(valor))}
                        onChange={(e) => handleChange(projeto.projeto, mesAno, 'custoTotal', e)}
                        onFocus={() => handleFocus(projeto.projeto, mesAno, 'custoTotal', valor)}
                        onBlur={() => handleBlur(projeto.projeto, mesAno, 'custoTotal', valor)}
                      />
                    ) : (
                      <div className="px-2 py-2 text-center" style={{ color: '#dc3545' }}>
                        {formatCurrency(valor)}
                      </div>
                    )}
                  </td>
                );
              })}
              <td className="text-center bg-light fw-bold" style={{ color: '#dc3545' }}>
                {formatCurrency(projeto.totais.custoTotal)}
              </td>
            </tr>
            <tr>
              <td className="bg-white position-sticky start-0">Margem Bruta</td>
              {meses.map(mes => {
                const mesAno = `${mes}/${String(anoSelecionado).slice(-2)}`;
                const valor = projeto.dados[mesAno]?.margemBruta || 0;
                return (
                  <td key={mes} className="text-center px-2 py-2" style={{ color: '#4A90E2' }}>
                    {formatCurrency(valor)}
                  </td>
                );
              })}
              <td className="text-center bg-light fw-bold" style={{ color: '#4A90E2' }}>
                {formatCurrency(projeto.totais.margemBruta)}
              </td>
            </tr>
            <tr>
              <td className="bg-white position-sticky start-0">Margem %</td>
              {meses.map(mes => {
                const mesAno = `${mes}/${String(anoSelecionado).slice(-2)}`;
                const valor = projeto.dados[mesAno]?.margemPercentual || 0;
                const isGoodMargin = valor >= 7;
                return (
                  <td key={mes} className="text-center px-2 py-2" style={{
                    color: isGoodMargin ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {formatPercent(valor)}
                  </td>
                );
              })}
              <td className="text-center px-2 py-2" style={{
                color: projeto.totais.margemPercentual >= 7 ? '#28a745' : '#dc3545',
                fontWeight: 'bold'
              }}>
                {formatPercent(projeto.totais.margemPercentual)}
              </td>
            </tr>
          </tbody>
        ))}
      </Table>
    </div>
  );
};

export default ForecastTable;
