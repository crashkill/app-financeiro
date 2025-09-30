import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useTransacoes } from '../../hooks/useTransacoes';

interface ProjectFilterProps {
  selectedProjects: string[];
  onChange: (projects: string[]) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  maxHeight?: string;
  placeholder?: string;
  showSelectAll?: boolean;
}

/**
 * Componente reutilizável para filtro de projetos
 */
const ProjectFilterReusable: React.FC<ProjectFilterProps> = ({ 
  selectedProjects, 
  onChange, 
  label = 'Projetos',
  className = '',
  disabled = false,
  maxHeight = '200px',
  placeholder = 'Selecione os projetos',
  showSelectAll = true
}) => {
  const { transacoes, loading } = useTransacoes({});
  const [allProjects, setAllProjects] = useState<string[]>([]);

  // Extrair projetos únicos das transações
  useEffect(() => {
    const projects = new Set<string>();
    transacoes.forEach(t => {
      if (t.projeto) projects.add(t.projeto);
    });
    setAllProjects(Array.from(projects).sort());
  }, [transacoes]);

  // Função para selecionar todos os projetos
  const handleSelectAll = () => {
    onChange(allProjects);
  };

  // Função para limpar a seleção
  const handleClearSelection = () => {
    onChange([]);
  };

  return (
    <Form.Group className={className}>
      <Form.Label>{label}</Form.Label>
      <Form.Select
        multiple
        value={selectedProjects}
        onChange={(e) => {
          const options = Array.from(e.target.selectedOptions);
          onChange(options.map(option => option.value));
        }}
        disabled={disabled || loading}
        style={{ maxHeight, overflow: 'auto' }}
      >
        {allProjects.length === 0 && (
          <option disabled value="">
            {loading ? 'Carregando projetos...' : 'Nenhum projeto disponível'}
          </option>
        )}
        {allProjects.map(project => (
          <option key={project} value={project}>
            {project}
          </option>
        ))}
      </Form.Select>
      
      {showSelectAll && allProjects.length > 0 && (
        <div className="d-flex justify-content-between mt-1">
          <small 
            className="text-primary cursor-pointer" 
            onClick={handleSelectAll}
            style={{ cursor: 'pointer' }}
          >
            Selecionar todos
          </small>
          <small 
            className="text-danger cursor-pointer" 
            onClick={handleClearSelection}
            style={{ cursor: 'pointer' }}
          >
            Limpar seleção
          </small>
        </div>
      )}
    </Form.Group>
  );
};

export default React.memo(ProjectFilterReusable);