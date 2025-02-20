import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../__mocks__/AuthContext';
import GestaoProfissionais from '../../pages/GestaoProfissionais';
import '@testing-library/jest-dom';
import { useProfissionaisData } from '../../__mocks__/hooks';

jest.mock('../../hooks/useProfissionaisData', () => ({
  useProfissionaisData
}));

describe('GestaoProfissionais Component', () => {
  const renderGestaoProfissionais = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <GestaoProfissionais />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the professionals management component', () => {
    renderGestaoProfissionais();
    
    expect(screen.getByText(/gestão de profissionais/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adicionar profissional/i })).toBeInTheDocument();
  });

  it('should display professionals data in the table', async () => {
    renderGestaoProfissionais();
    
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('Desenvolvedor')).toBeInTheDocument();
      expect(screen.getByText('Analista')).toBeInTheDocument();
      expect(screen.getByText('Projeto A')).toBeInTheDocument();
      expect(screen.getByText('Projeto B')).toBeInTheDocument();
    });
  });

  it('should open add professional modal', async () => {
    renderGestaoProfissionais();
    
    const addButton = screen.getByRole('button', { name: /adicionar profissional/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/novo profissional/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cargo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/projeto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/custo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tipo/i)).toBeInTheDocument();
    });
  });

  it('should handle professional form submission', async () => {
    const mockUpdateProfissional = jest.fn();
    useProfissionaisData.mockImplementationOnce(() => ({
      data: {
        profissionais: [
          {
            id: 1,
            nome: 'João Silva',
            cargo: 'Desenvolvedor',
            projeto: 'Projeto A',
            custo: 8000,
            tipo: 'CLT'
          }
        ],
        custosPorProjeto: [
          { projeto: 'Projeto A', custoTotal: 8000 }
        ]
      },
      isLoading: false,
      error: null,
      updateProfissional: mockUpdateProfissional,
      deleteProfissional: jest.fn()
    }));

    renderGestaoProfissionais();
    
    // Abre o modal
    const addButton = screen.getByRole('button', { name: /adicionar profissional/i });
    fireEvent.click(addButton);
    
    // Preenche o formulário
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Carlos Souza' } });
      fireEvent.change(screen.getByLabelText(/cargo/i), { target: { value: 'Designer' } });
      fireEvent.change(screen.getByLabelText(/projeto/i), { target: { value: 'Projeto C' } });
      fireEvent.change(screen.getByLabelText(/custo/i), { target: { value: '7000' } });
      fireEvent.change(screen.getByLabelText(/tipo/i), { target: { value: 'PJ' } });
    });
    
    // Submete o formulário
    const submitButton = screen.getByRole('button', { name: /salvar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockUpdateProfissional).toHaveBeenCalledWith({
        nome: 'Carlos Souza',
        cargo: 'Designer',
        projeto: 'Projeto C',
        custo: 7000,
        tipo: 'PJ'
      });
    });
  });

  it('should handle professional deletion', async () => {
    const mockDeleteProfissional = jest.fn();
    useProfissionaisData.mockImplementationOnce(() => ({
      data: {
        profissionais: [
          {
            id: 1,
            nome: 'João Silva',
            cargo: 'Desenvolvedor',
            projeto: 'Projeto A',
            custo: 8000,
            tipo: 'CLT'
          }
        ],
        custosPorProjeto: [
          { projeto: 'Projeto A', custoTotal: 8000 }
        ]
      },
      isLoading: false,
      error: null,
      updateProfissional: jest.fn(),
      deleteProfissional: mockDeleteProfissional
    }));

    renderGestaoProfissionais();
    
    // Clica no botão de excluir
    const deleteButton = screen.getByRole('button', { name: /excluir/i });
    fireEvent.click(deleteButton);
    
    // Confirma a exclusão
    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockDeleteProfissional).toHaveBeenCalledWith(1);
    });
  });

  it('should filter professionals by name', async () => {
    renderGestaoProfissionais();
    
    const searchInput = screen.getByRole('textbox', { name: /buscar/i });
    fireEvent.change(searchInput, { target: { value: 'João' } });
    
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
    });
  });

  it('should sort professionals by column', async () => {
    renderGestaoProfissionais();
    
    const nameHeader = screen.getByRole('columnheader', { name: /nome/i });
    fireEvent.click(nameHeader);
    
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('João Silva');
      expect(rows[2]).toHaveTextContent('Maria Santos');
    });
    
    // Clica novamente para inverter a ordem
    fireEvent.click(nameHeader);
    
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Maria Santos');
      expect(rows[2]).toHaveTextContent('João Silva');
    });
  });

  it('should handle empty data state', async () => {
    useProfissionaisData.mockImplementationOnce(() => ({
      data: {
        profissionais: [],
        custosPorProjeto: []
      },
      isLoading: false,
      error: null,
      updateProfissional: jest.fn(),
      deleteProfissional: jest.fn()
    }));

    renderGestaoProfissionais();
    
    await waitFor(() => {
      expect(screen.getByText(/nenhum profissional encontrado/i)).toBeInTheDocument();
    });
  });

  it('should handle loading state', async () => {
    useProfissionaisData.mockImplementationOnce(() => ({
      data: null,
      isLoading: true,
      error: null,
      updateProfissional: jest.fn(),
      deleteProfissional: jest.fn()
    }));

    renderGestaoProfissionais();
    
    await waitFor(() => {
      expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    useProfissionaisData.mockImplementationOnce(() => ({
      data: null,
      isLoading: false,
      error: 'Erro ao carregar dados',
      updateProfissional: jest.fn(),
      deleteProfissional: jest.fn()
    }));

    renderGestaoProfissionais();
    
    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar dados/i)).toBeInTheDocument();
    });
  });

  it('should validate form fields', async () => {
    renderGestaoProfissionais();
    
    // Abre o modal
    const addButton = screen.getByRole('button', { name: /adicionar profissional/i });
    fireEvent.click(addButton);
    
    // Tenta submeter o formulário vazio
    const submitButton = screen.getByRole('button', { name: /salvar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/cargo é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/projeto é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/custo é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/tipo é obrigatório/i)).toBeInTheDocument();
    });
  });

  it('should validate cost field as numeric', async () => {
    renderGestaoProfissionais();
    
    // Abre o modal
    const addButton = screen.getByRole('button', { name: /adicionar profissional/i });
    fireEvent.click(addButton);
    
    // Tenta inserir valor não numérico no campo de custo
    const custoInput = screen.getByLabelText(/custo/i);
    fireEvent.change(custoInput, { target: { value: 'abc' } });
    
    await waitFor(() => {
      expect(screen.getByText(/custo deve ser um número/i)).toBeInTheDocument();
    });
  });
});