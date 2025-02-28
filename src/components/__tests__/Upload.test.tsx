import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Upload from '../../pages/Upload';
import * as database from '../../db/database';

// Mock do módulo de banco de dados
jest.mock('../../db/database', () => ({
  importarDados: jest.fn()
}));

// Mock do useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Upload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload area correctly', () => {
    render(
      <BrowserRouter>
        <Upload />
      </BrowserRouter>
    );

    expect(screen.getByText(/Arraste e solte um arquivo Excel aqui/i)).toBeInTheDocument();
    expect(screen.getByText('Upload de Dados')).toBeInTheDocument();
  });

  it('shows preview when file is uploaded', async () => {
    const file = new File(
      ['test data'],
      'test.xlsx',
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    render(
      <BrowserRouter>
        <Upload />
      </BrowserRouter>
    );

    const input = screen.getByRole('button');
    Object.defineProperty(input, 'files', {
      value: [file]
    });

    fireEvent.drop(input, {
      dataTransfer: {
        files: [file]
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Preview dos Dados')).toBeInTheDocument();
    });
  });

  it('handles successful data import', async () => {
    const mockData = [{ id: 1, value: 'test' }];
    (database.importarDados as jest.Mock).mockResolvedValueOnce({ count: 1 });

    render(
      <BrowserRouter>
        <Upload />
      </BrowserRouter>
    );

    // Simular upload de arquivo
    const file = new File(
      ['test data'],
      'test.xlsx',
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const input = screen.getByRole('button');
    Object.defineProperty(input, 'files', {
      value: [file]
    });

    fireEvent.drop(input, {
      dataTransfer: {
        files: [file]
      }
    });

    await waitFor(() => {
      const importButton = screen.getByText('Importar Dados');
      fireEvent.click(importButton);
    });

    await waitFor(() => {
      expect(screen.getByText('1 registros importados com sucesso!')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles import error', async () => {
    (database.importarDados as jest.Mock).mockRejectedValueOnce(new Error('Import failed'));

    render(
      <BrowserRouter>
        <Upload />
      </BrowserRouter>
    );

    // Simular upload de arquivo
    const file = new File(
      ['test data'],
      'test.xlsx',
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const input = screen.getByRole('button');
    Object.defineProperty(input, 'files', {
      value: [file]
    });

    fireEvent.drop(input, {
      dataTransfer: {
        files: [file]
      }
    });

    await waitFor(() => {
      const importButton = screen.getByText('Importar Dados');
      fireEvent.click(importButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Erro ao importar os dados. Verifique o formato do arquivo.')).toBeInTheDocument();
    });
  });
});