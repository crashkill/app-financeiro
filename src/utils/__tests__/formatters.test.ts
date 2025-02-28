import { formatCurrency, formatPercent } from '../formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
      expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00');
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('R$ -1.234,56');
      expect(formatCurrency(-1000000)).toBe('R$ -1.000.000,00');
    });

    it('handles decimal places correctly', () => {
      expect(formatCurrency(1234.5678)).toBe('R$ 1.234,57');
      expect(formatCurrency(1234.5)).toBe('R$ 1.234,50');
    });
  });

  describe('formatPercent', () => {
    it('formats percentages correctly', () => {
      expect(formatPercent(0.1234)).toBe('12,34%');
      expect(formatPercent(1)).toBe('100,00%');
      expect(formatPercent(0)).toBe('0,00%');
    });

    it('handles negative percentages', () => {
      expect(formatPercent(-0.1234)).toBe('-12,34%');
      expect(formatPercent(-1)).toBe('-100,00%');
    });

    it('handles decimal precision', () => {
      expect(formatPercent(0.12345)).toBe('12,35%');
      expect(formatPercent(0.12)).toBe('12,00%');
    });
  });
});