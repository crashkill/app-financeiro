import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { ConfigProvider } from '../../contexts/ConfigContext';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', email: 'test@example.com' },
    isAdmin: false,
    logout: jest.fn()
  }),
  AuthProvider: ({ children }) => <>{children}</>
}));

jest.mock('../../contexts/ConfigContext', () => ({
  useConfig: () => ({
    config: {
      userImage: 'test-image.jpg',
      userName: 'Test User',
      currency: 'BRL'
    }
  }),
  ConfigProvider: ({ children }) => <>{children}</>
}));

const renderSidebar = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <Sidebar />
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Sidebar Component', () => {
  it('renders navigation links correctly', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Planilhas Financeiras')).toBeInTheDocument();
    expect(screen.getByText('Forecast')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Documentação')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('does not render admin-only links for non-admin users', () => {
    renderSidebar();
    expect(screen.queryByText('Admin Check')).not.toBeInTheDocument();
  });

  it('renders with correct styling', () => {
    renderSidebar();
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('nav-link');
    expect(dashboardLink).toHaveClass('py-2');
    expect(dashboardLink).toHaveClass('d-flex');
    expect(dashboardLink).toHaveClass('align-items-center');
    expect(dashboardLink).toHaveClass('text-dark');
  });

  it('toggles sidebar when hamburger button is clicked', () => {
    renderSidebar();
    
    const hamburgerButton = screen.getByRole('button');
    expect(screen.getByText('Menu')).toBeInTheDocument();
    
    fireEvent.click(hamburgerButton);
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
  });

  it('applies correct styles to navigation links', () => {
    renderSidebar();
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('nav-link', 'py-2', 'd-flex', 'align-items-center', 'text-dark');
  });
});