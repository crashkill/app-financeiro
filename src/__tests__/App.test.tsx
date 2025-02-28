/* eslint-env jest */
/// <reference types="jest" />

import { describe, test, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import App from '../App';

describe('App Component', () => {
  test('renders App Component correctly', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    );
    expect(screen.getByTestId('app-container')).toBeInTheDocument();
  });
});
