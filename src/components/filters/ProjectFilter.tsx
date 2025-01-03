import React, { useEffect, useState, useMemo } from 'react';
import { Form } from 'react-bootstrap';
import { useTransacoes } from '../../hooks/useTransacoes';

interface ProjectFilterProps {
  selectedProjects: string[];
  onProjectChange: (projects: string[]) => void;
  label?: string;
  height?: string;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({
  selectedProjects,
  onProjectChange,
  label = 'Projetos',
  height = '200px'
}) => {
  // Usa o hook otimizado para buscar transações
  const { transacoes, isLoading } = useTransacoes(undefined, undefined, undefined, true);

  // Processa a lista de projetos de forma otimizada
  const projetos = useMemo(() => {
    const uniqueProjects = new Set<string>();
    
    transacoes.forEach(t => {
      if (t.projeto) uniqueProjects.add(t.projeto);
      if (t.descricao) uniqueProjects.add(t.descricao);
    });

    return Array.from(uniqueProjects).sort((a, b) => a.localeCompare(b));
  }, [transacoes]);

  // Handler otimizado para mudanças
  const handleProjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const selectedValues: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    onProjectChange(selectedValues);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Form.Select
        multiple
        value={selectedProjects}
        onChange={handleProjectChange}
        style={{ height }}
        disabled={isLoading}
      >
        {projetos.map((projeto) => (
          <option key={projeto} value={projeto}>
            {projeto}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default React.memo(ProjectFilter);
