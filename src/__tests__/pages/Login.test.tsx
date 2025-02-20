import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../__mocks__/AuthContext';
import Login from '../../pages/Login';
import '@testing-library/jest-dom';

describe('Login Component', () => {
  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the login form', () => {
    renderLogin();
    
    expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const mockLogin = jest.fn();
    jest.spyOn(require('../../__mocks__/AuthContext'), 'useAuth').mockImplementation(() => ({
      user: null,
      isAdmin: false,
      login: mockLogin,
      logout: jest.fn()
    }));

    renderLogin();
    
    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should show loading state during form submission', async () => {
    const mockLogin = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    jest.spyOn(require('../../__mocks__/AuthContext'), 'useAuth').mockImplementation(() => ({
      user: null,
      isAdmin: false,
      login: mockLogin,
      logout: jest.fn()
    }));

    renderLogin();
    
    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  it('should show error message on invalid credentials', async () => {
    const mockLogin = jest.fn(() => Promise.reject(new Error('Credenciais inválidas')));
    jest.spyOn(require('../../__mocks__/AuthContext'), 'useAuth').mockImplementation(() => ({
      user: null,
      isAdmin: false,
      login: mockLogin,
      logout: jest.fn()
    }));

    renderLogin();
    
    const emailInput = screen.getByLabelText(/e-mail/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });
});