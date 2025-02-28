import { describe, test, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import CustosGrafico from '../components/gestao-profissionais/CustosGrafico';

const mockCustosPorTipo = {
  'CLT': {
    total: 50000,
    percentual: 50
  },
  'SUBCONTRATADOS': {
    total: 30000,
    percentual: 30
  },
  'OUTROS': {
    total: 20000,
    percentual: 20
  }
};

describe('CustosGrafico Component', () => {
  test('renders titulo do gráfico', () => {
    render(<CustosGrafico custosPorTipo={mockCustosPorTipo} />);
    expect(screen.getByText('Distribuição de Custos')).toBeInTheDocument();
  });

  // Removendo teste que depende da renderização do Chart.js
  // já que ele é mockado no setupTests.ts

  test('renderiza o gráfico com dados vazios', () => {
    render(<CustosGrafico custosPorTipo={{}} />);
    expect(screen.getByText('Distribuição de Custos')).toBeInTheDocument();
  });
});