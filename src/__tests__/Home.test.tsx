/* eslint-env jest */
/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, test, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../components/Home';

describe('Home Component', () => {
  test('renders Home Component text', () => {
    render(<Home />);
    expect(screen.getByText('Home Component')).toBeInTheDocument();
  });
});
