import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { act } from 'react-dom/test-utils';
import React from 'react';

// Mock component to test the useAuth hook
const TestComponent = () => {
  const { user, isAdmin, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="user-status">{user ? 'logged-in' : 'logged-out'}</div>
      <div data-testid="admin-status">{isAdmin ? 'admin' : 'not-admin'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear any stored auth state
    localStorage.clear();
  });

  it('provides initial authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
    expect(screen.getByTestId('admin-status')).toHaveTextContent('not-admin');
  });

  it('handles login successfully', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');

    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-in');
    });
  });

  it('handles logout successfully', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // First login
    const loginButton = screen.getByText('Login');
    await act(async () => {
      fireEvent.click(loginButton);
    });

    // Then logout
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      fireEvent.click(logoutButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged-out');
      expect(screen.getByTestId('admin-status')).toHaveTextContent('not-admin');
    });
  });
});