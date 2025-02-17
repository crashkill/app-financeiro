import React from 'react';
import { Card } from 'react-bootstrap';

interface FilterRangeProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label: string;
}

export const FilterRange: React.FC<FilterRangeProps> = ({
  min,
  max,
  value,
  onChange,
  label
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const newValue = parseInt(e.target.value);
    // Prevenir valores menores que o mínimo ou maiores que o máximo
    if (newValue < min || newValue > max) {
      return;
    }
    
    const newRange: [number, number] = [...value] as [number, number];
    newRange[index] = newValue;
    
    // Garantir que min <= max
    if (index === 0 && newRange[0] > newRange[1]) {
      newRange[0] = newRange[1];
    } else if (index === 1 && newRange[1] < newRange[0]) {
      newRange[1] = newRange[0];
    }
    
    onChange(newRange);
  };

  return (
    <Card className="p-3">
      <div className="d-flex flex-column">
        <label className="mb-2">{label}</label>
        <div className="d-flex align-items-center gap-2">
          <input
            type="range"
            min={min}
            max={max}
            value={value[0]}
            onChange={(e) => handleChange(e, 0)}
            className="flex-grow-1"
          />
          <span>{value[0]}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <input
            type="range"
            min={min}
            max={max}
            value={value[1]}
            onChange={(e) => handleChange(e, 1)}
            className="flex-grow-1"
          />
          <span>{value[1]}</span>
        </div>
      </div>
    </Card>
  );
};