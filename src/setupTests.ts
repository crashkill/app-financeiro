import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
  [Symbol.iterator]: function* () {
    yield* Object.entries(this);
  }
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock do Chart.js para os testes
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  registerables: [],
}));

// Mock para react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Pie: () => null,
  Line: () => null,
  Bar: () => null,
}));

// Limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});