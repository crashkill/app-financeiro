import { describe, test, expect } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterRange } from '../components/filters/FilterRange';

describe('FilterRange Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('renderiza com valores padrão', () => {
    render(
      <FilterRange 
        min={0} 
        max={100} 
        value={[20, 80]} 
        onChange={mockOnChange}
        label="Filtro de Valores"
      />
    );
    
    expect(screen.getByText('Filtro de Valores')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  test('atualiza valores ao mudar o range mínimo', () => {
    render(
      <FilterRange 
        min={0} 
        max={100} 
        value={[20, 80]} 
        onChange={mockOnChange}
        label="Filtro de Valores"
      />
    );

    const sliders = screen.getAllByRole('slider');
    const minSlider = sliders[0];
    fireEvent.change(minSlider, { target: { value: 30 } });
    
    expect(mockOnChange).toHaveBeenCalledWith([30, 80]);
  });

  test('atualiza valores ao mudar o range máximo', () => {
    render(
      <FilterRange 
        min={0} 
        max={100} 
        value={[20, 80]} 
        onChange={mockOnChange}
        label="Filtro de Valores"
      />
    );

    const sliders = screen.getAllByRole('slider');
    const maxSlider = sliders[1];
    fireEvent.change(maxSlider, { target: { value: 70 } });
    
    expect(mockOnChange).toHaveBeenCalledWith([20, 70]);
  });

  test('impede valores inválidos no range mínimo', () => {
    render(
      <FilterRange 
        min={0} 
        max={100} 
        value={[20, 80]} 
        onChange={mockOnChange}
        label="Filtro de Valores"
      />
    );

    const sliders = screen.getAllByRole('slider');
    const minSlider = sliders[0];
    fireEvent.change(minSlider, { target: { value: -10 } });
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});