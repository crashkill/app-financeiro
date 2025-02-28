import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../__mocks__/AuthContext';
import PlanilhasFinanceiras from '../../pages/PlanilhasFinanceiras';
import '@testing-library/jest-dom';
import { useFinancialData } from '../../__mocks__/hooks';

jest.mock('../../hooks/useFinancialData', () => ({
  useFinancialData
}));

describe('PlanilhasFinanceiras Component', () => {
  const renderPlanilhas = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <PlanilhasFinanceiras />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the financial spreadsheet component', () => {
    renderPlanilhas();
    
    expect(screen.getByText(/planilhas financeiras/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /ano/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /projeto/i })).toBeInTheDocument();
  });

  it('should display financial data in the table', async () => {
    renderPlanilhas();
    
    await waitFor(() => {
      // Verifica receitas
      expect(screen.getByText('100.000,00')).toBeInTheDocument();
      expect(screen.getByText('120.000,00')).toBeInTheDocument();
      
      // Verifica desoneração
      expect(screen.getByText('5.000,00')).toBeInTheDocument();
      expect(screen.getByText('6.000,00')).toBeInTheDocument();
      
      // Verifica custos
      expect(screen.getByText('-80.000,00')).toBeInTheDocument();
      expect(screen.getByText('-85.000,00')).toBeInTheDocument();
    });
  });

  it('should calculate margins correctly', async () => {
    renderPlanilhas();
    
    await waitFor(() => {
      // Cálculo da margem para Janeiro: ((100000 - 80000 + 5000) / 100000) * 100 = 25%
      expect(screen.getByText('25,00%')).toBeInTheDocument();
      
      // Cálculo da margem para Fevereiro: ((120000 - 85000 + 6000) / 120000) * 100 ≈ 34.17%
      expect(screen.getByText('34,17%')).toBeInTheDocument();
    });
  });

  it('should handle year selection', async () => {
    renderPlanilhas();
    
    const yearSelect = screen.getByRole('combobox', { name: /ano/i });
    fireEvent.change(yearSelect, { target: { value: '2024' } });

    await waitFor(() => {
      expect(yearSelect).toHaveValue('2024');
    });
  });

  it('should handle project selection', async () => {
    renderPlanilhas();
    
    const projectSelect = screen.getByRole('combobox', { name: /projeto/i });
    fireEvent.change(projectSelect, { target: { value: 'Projeto A' } });

    await waitFor(() => {
      expect(projectSelect).toHaveValue('Projeto A');
    });
  });

  it('should apply color coding to margins', async () => {
    renderPlanilhas();
    
    await waitFor(() => {
      const margins = screen.getAllByText(/\d+,\d+%/);
      
      margins.forEach(margin => {
        const value = parseFloat(margin.textContent.replace(',', '.'));
        if (value >= 7) {
          expect(margin).toHaveStyle({ color: '#28a745' });
        } else {
          expect(margin).toHaveStyle({ color: '#dc3545' });
        }
      });
    });
  });

  it('should handle empty data state', async () => {
    useFinancialData.mockImplementationOnce(() => ({
      data: { receitas: [], desoneracao: [], custos: [] },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    }));

    renderPlanilhas();
    
    await waitFor(() => {
      expect(screen.getByText(/nenhum dado encontrado/i)).toBeInTheDocument();
    });
  });

  it('should handle loading state', async () => {
    useFinancialData.mockImplementationOnce(() => ({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    }));

    renderPlanilhas();
    
    await waitFor(() => {
      expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    useFinancialData.mockImplementationOnce(() => ({
      data: null,
      isLoading: false,
      error: 'Erro ao carregar dados',
      refetch: jest.fn()
    }));

    renderPlanilhas();
    
    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar dados/i)).toBeInTheDocument();
    });
  });
});
