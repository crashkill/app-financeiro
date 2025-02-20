import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../__mocks__/AuthContext';
import Forecast from '../../pages/Forecast';
import '@testing-library/jest-dom';
import { useForecastData } from '../../__mocks__/hooks';

jest.mock('../../hooks/useForecastData', () => ({
  useForecastData
}));

describe('Forecast Component', () => {
  const renderForecast = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Forecast />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the forecast component', () => {
    renderForecast();
    
    expect(screen.getByText(/forecast/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /ano/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /projeto/i })).toBeInTheDocument();
  });

  it('should display forecast data in the table', async () => {
    renderForecast();
    
    await waitFor(() => {
      // Verifica receitas
      expect(screen.getByText('150.000,00')).toBeInTheDocument();
      expect(screen.getByText('160.000,00')).toBeInTheDocument();
      
      // Verifica custos
      expect(screen.getByText('-100.000,00')).toBeInTheDocument();
      expect(screen.getByText('-105.000,00')).toBeInTheDocument();
    });
  });

  it('should calculate margins correctly', async () => {
    renderForecast();
    
    await waitFor(() => {
      // Margem Bruta Janeiro = 150000 - 100000 = 50000
      expect(screen.getByText('50.000,00')).toBeInTheDocument();
      
      // Margem % Janeiro = (50000 / 150000) * 100 = 33.33%
      expect(screen.getByText('33,33%')).toBeInTheDocument();
      
      // Margem Bruta Fevereiro = 160000 - 105000 = 55000
      expect(screen.getByText('55.000,00')).toBeInTheDocument();
      
      // Margem % Fevereiro = (55000 / 160000) * 100 = 34.38%
      expect(screen.getByText('34,38%')).toBeInTheDocument();
    });
  });

  it('should handle editable fields for future months', async () => {
    renderForecast();
    
    const futureRevenueCell = screen.getByTestId('revenue-input-feb');
    const futureCostCell = screen.getByTestId('cost-input-feb');
    
    // Testa edição de receita
    fireEvent.change(futureRevenueCell, { target: { value: '170000' } });
    await waitFor(() => {
      expect(futureRevenueCell).toHaveValue('170000');
    });
    
    // Testa edição de custo
    fireEvent.change(futureCostCell, { target: { value: '-110000' } });
    await waitFor(() => {
      expect(futureCostCell).toHaveValue('-110000');
    });
  });

  it('should not allow editing past months', async () => {
    renderForecast();
    
    const pastRevenueCell = screen.getByTestId('revenue-input-jan');
    const pastCostCell = screen.getByTestId('cost-input-jan');
    
    expect(pastRevenueCell).toHaveAttribute('readonly');
    expect(pastCostCell).toHaveAttribute('readonly');
  });

  it('should handle year selection', async () => {
    renderForecast();
    
    const yearSelect = screen.getByRole('combobox', { name: /ano/i });
    fireEvent.change(yearSelect, { target: { value: '2024' } });

    await waitFor(() => {
      expect(yearSelect).toHaveValue('2024');
    });
  });

  it('should handle project selection', async () => {
    renderForecast();
    
    const projectSelect = screen.getByRole('combobox', { name: /projeto/i });
    fireEvent.change(projectSelect, { target: { value: 'Projeto A' } });

    await waitFor(() => {
      expect(projectSelect).toHaveValue('Projeto A');
    });
  });

  it('should apply color coding to margins', async () => {
    renderForecast();
    
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

  it('should validate numeric input', async () => {
    renderForecast();
    
    const revenueInput = screen.getByTestId('revenue-input-feb');
    
    // Tenta inserir valor não numérico
    fireEvent.change(revenueInput, { target: { value: 'abc' } });
    
    await waitFor(() => {
      expect(revenueInput).toHaveValue(''); // Deve limpar ou manter valor anterior
    });
  });

  it('should handle empty data state', async () => {
    useForecastData.mockImplementationOnce(() => ({
      data: { receitas: [], custos: [] },
      isLoading: false,
      error: null,
      updateForecast: jest.fn()
    }));

    renderForecast();
    
    await waitFor(() => {
      expect(screen.getByText(/nenhum dado encontrado/i)).toBeInTheDocument();
    });
  });

  it('should handle loading state', async () => {
    useForecastData.mockImplementationOnce(() => ({
      data: null,
      isLoading: true,
      error: null,
      updateForecast: jest.fn()
    }));

    renderForecast();
    
    await waitFor(() => {
      expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    useForecastData.mockImplementationOnce(() => ({
      data: null,
      isLoading: false,
      error: 'Erro ao carregar dados',
      updateForecast: jest.fn()
    }));

    renderForecast();
    
    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar dados/i)).toBeInTheDocument();
    });
  });

  it('should auto-save changes', async () => {
    const mockUpdateForecast = jest.fn();
    useForecastData.mockImplementationOnce(() => ({
      data: {
        receitas: [
          { mes: 'Janeiro', valor: 150000 },
          { mes: 'Fevereiro', valor: 160000 }
        ],
        custos: [
          { mes: 'Janeiro', valor: -100000 },
          { mes: 'Fevereiro', valor: -105000 }
        ]
      },
      isLoading: false,
      error: null,
      updateForecast: mockUpdateForecast
    }));

    renderForecast();
    
    const revenueInput = screen.getByTestId('revenue-input-feb');
    fireEvent.change(revenueInput, { target: { value: '170000' } });
    
    await waitFor(() => {
      expect(mockUpdateForecast).toHaveBeenCalled();
    });
  });
});
