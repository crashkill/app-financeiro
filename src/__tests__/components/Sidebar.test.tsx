import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../__mocks__/AuthContext';
import Sidebar from '../../components/Sidebar';
import '@testing-library/jest-dom';

describe('Sidebar Component', () => {
  const renderSidebar = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the sidebar with app title', () => {
    renderSidebar();
    expect(screen.getByText('App Financeiro')).toBeInTheDocument();
  });

  it('should display user email', () => {
    jest.spyOn(require('../../__mocks__/AuthContext'), 'useAuth').mockImplementation(() => ({
      user: { 
        email: 'test@example.com',
        name: 'Test User',
        isAdmin: true
      },
      isAdmin: true,
      login: jest.fn(),
      logout: jest.fn()
    }));

    renderSidebar();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderSidebar();
    
    expect(screen.getByText('Planilhas Financeiras')).toHaveAttribute('href', '/planilhas');
    expect(screen.getByText('Forecast')).toHaveAttribute('href', '/forecast');
    expect(screen.getByText('Gestão de Profissionais')).toHaveAttribute('href', '/profissionais');
  });

  it('should handle logout', () => {
    const mockLogout = jest.fn();
    jest.spyOn(require('../../__mocks__/AuthContext'), 'useAuth').mockImplementation(() => ({
      user: { 
        email: 'test@example.com',
        name: 'Test User',
        isAdmin: true
      },
      isAdmin: true,
      login: jest.fn(),
      logout: mockLogout
    }));

    renderSidebar();
    
    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });
});
