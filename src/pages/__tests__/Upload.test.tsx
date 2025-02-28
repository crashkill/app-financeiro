import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Upload from '../Upload';
import * as XLSX from 'xlsx';
import { importarDados } from '../../db/database';

// Mock das dependências
jest.mock('../../db/database', () => ({
  importarDados: jest.fn()
}));

jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Componente Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar corretamente', () => {
    render(
      <BrowserRouter>
        <Upload />
      </BrowserRouter>
    );

    expect(screen.getByText('Upload de Dados')).toBeInTheDocument();
    expect(screen.getByText(/Arraste e solte um arquivo Excel aqui/i)).toBeInTheDocument();
  });

  it('deve processar o upload de arquivo com sucesso', async () => {
    const mockData = [
      { id: 1, nome: 'Teste', valor: 100 }
    ];

    // Configura os mocks
    (XLSX.read as jest.Mock).mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {}
      }
    });

    (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockData);
    (importarDados as jest.Mock).mockResolvedValue({ count: 1 });

    render(
      <BrowserRouter>
        <Upload />
      </BrowserRouter>
    );

    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dropzone = screen.getByText(/Arraste e solte um arquivo Excel aqui/i);

    await waitFor(() => {
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file]
        }
      });
    });

    // Verifica se o preview é exibido
    await waitFor(() => {
      expect(screen.getByText('Preview dos Dados')).toBeInTheDocument();
    });

    // Clica no botão de importar
    const importButton = screen.getByText('Importar Dados');
    fireEvent.click(importButton);

    // Verifica se a importação foi concluída
    await waitFor(() => {
      expect(importarDados).toHaveBeenCalledWith(mockData);
      expect(screen.getByText('1 registros importados com sucesso!')).toBeInTheDocument();
    });

    // Verifica se houve redirecionamento
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('deve exibir erro quando o arquivo é inválido', async () => {
    (XLSX.read as jest.Mock).mockImplementation(() => {
      throw new Error('Arquivo inválido');
    });

    render(
      <BrowserRouter>
        <Upload />
      </BrowserRouter>
    );

    const file = new File([''], 'invalid.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dropzone = screen.getByText(/Arraste e solte um arquivo Excel aqui/i);

    await waitFor(() => {
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file]
        }
      });
    });

    expect(screen.getByText('Erro ao ler o arquivo. Certifique-se de que é uma planilha válida.')).toBeInTheDocument();
  });
});