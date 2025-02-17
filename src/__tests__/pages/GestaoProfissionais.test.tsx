import { describe, test, expect } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import GestaoProfissionais from '../../pages/GestaoProfissionais';

const mockProfissionais = [
  {
    id: 1,
    nome: 'João Silva',
    tipo: 'CLT',
    custo: 10000,
    projeto: 'Projeto A'
  },
  {
    id: 2,
    nome: 'Maria Santos',
    tipo: 'PJ',
    custo: 12000,
    projeto: 'Projeto B'
  }
];

jest.mock('../../services/storageService', () => ({
  getProfissionais: () => Promise.resolve(mockProfissionais)
}));

describe('GestaoProfissionais Page', () => {
  test('renderiza a página corretamente', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <GestaoProfissionais />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/gestão de profissionais/i)).toBeInTheDocument();
    expect(screen.getByTestId('profissionais-table')).toBeInTheDocument();
  });

  test('exibe gráfico de distribuição de custos', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <GestaoProfissionais />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/distribuição de custos/i)).toBeInTheDocument();
  });

  test('permite filtrar profissionais', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <GestaoProfissionais />
        </BrowserRouter>
      </AuthProvider>
    );

    const filterInput = screen.getByPlaceholderText(/filtrar/i);
    fireEvent.change(filterInput, { target: { value: 'João' } });

    // Verifica se o filtro foi aplicado
    expect(await screen.findByText('João Silva')).toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });

  test('permite ordenar por diferentes colunas', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <GestaoProfissionais />
        </BrowserRouter>
      </AuthProvider>
    );

    const sortButton = screen.getByText(/nome/i);
    fireEvent.click(sortButton);

    // Verifica se a ordenação foi aplicada
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('João Silva');
    expect(rows[2]).toHaveTextContent('Maria Santos');
  });
});