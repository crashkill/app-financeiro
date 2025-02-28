import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';

const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const renderSidebar = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Sidebar />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    mockUseAuth.mockClear();
  });

  it('renders dashboard and planilhas links for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      isAdmin: false,
      user: { name: 'Test User' },
    });

    renderSidebar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Planilhas Financeiras')).toBeInTheDocument();
    expect(screen.queryByText('Documentação')).not.toBeInTheDocument();
  });

  it('renders all links including documentacao for admin users', () => {
    mockUseAuth.mockReturnValue({
      isAdmin: true,
      user: { name: 'Admin User' },
    });

    renderSidebar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Planilhas Financeiras')).toBeInTheDocument();
    expect(screen.getByText('Documentação')).toBeInTheDocument();
  });

  it('renders admin-check link for all users', () => {
    mockUseAuth.mockReturnValue({
      isAdmin: false,
      user: { name: 'Test User' },
    });

    renderSidebar();

    expect(screen.getByText('Verificar Admin')).toBeInTheDocument();
  });

  it('applies active class to current route', () => {
    mockUseAuth.mockReturnValue({
      isAdmin: false,
      user: { name: 'Test User' },
    });

    renderSidebar();

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('d-flex align-items-center gap-2');
  });
});