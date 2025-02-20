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

// Mock do Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  Pie: jest.fn(),
  Line: jest.fn(),
  Bar: jest.fn()
}));

// Mock do react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Pie: () => null,
  Line: () => null,
  Bar: () => null
}));

// Mock do IndexedDB
const indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB
});

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock do ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
};

// Limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Configuração global do Jest
jest.setTimeout(10000); // 10 segundos