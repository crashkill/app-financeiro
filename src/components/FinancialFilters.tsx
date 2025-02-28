import React, { useState, useCallback, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { storageService } from '../services/storageService';

interface FinancialFiltersProps {
  filters: {
    project: string;
    period: string[];
  };
  onFilterChange: (filters: { project: string; period: string[] }) => void;
}

export const FinancialFilters = React.memo(({ filters, onFilterChange }: FinancialFiltersProps) => {
  const [selectedProject, setSelectedProject] = useState<string>(filters.project);
  const [selectedPeriod, setSelectedPeriod] = useState<string[]>(filters.period);

  const projects = useMemo(() => {
    const financialData = storageService.getFinancialData();
    return [...new Set(financialData.map(item => item.visao))];
  }, []);

  const periods = useMemo(() => [
    'nov/24',
    'dez/24',
    'jan/25',
    'fev/25',
    'mar/25'
  ], []);

  const handleProjectChange = useCallback((value: string) => {
    setSelectedProject(value);
    onFilterChange({
      project: value,
      period: selectedPeriod,
    });
  }, [selectedPeriod, onFilterChange]);

  const handlePeriodChange = useCallback((value: string) => {
    const newPeriod = value ? [value] : [];
    setSelectedPeriod(newPeriod);
    onFilterChange({
      project: selectedProject,
      period: newPeriod,
    });
  }, [selectedProject, onFilterChange]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2">
        <Label>Projeto</Label>
        <Select
          value={selectedProject}
          onValueChange={handleProjectChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Projetos</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project} value={project}>
                {project}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Período</Label>
        <Select
          value={selectedPeriod[0] || ''}
          onValueChange={handlePeriodChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os Períodos</SelectItem>
            {periods.map((period) => (
              <SelectItem key={period} value={period}>
                {period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

FinancialFilters.displayName = 'FinancialFilters';
