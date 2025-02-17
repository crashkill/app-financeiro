import { describe, test, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Dashboard from '../../pages/Dashboard';

jest.mock('../../hooks/useTransacoes', () => ({
  useTransacoes: () => ({
    transacoes: [],
    loading: false,
    error: null
  })
}));

describe('Dashboard Page', () => {
  test('renderiza os componentes principais do dashboard', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </AuthProvider>
    );

    // Verifica se os elementos principais estão presentes
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
  });

  test('mostra indicadores financeiros', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </AuthProvider>
    );

    // Verifica se os cards de indicadores estão presentes
    expect(screen.getByText(/receitas/i)).toBeInTheDocument();
    expect(screen.getByText(/despesas/i)).toBeInTheDocument();
  });

  test('exibe mensagem quando não há dados', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/não há dados disponíveis/i)).toBeInTheDocument();
  });
});