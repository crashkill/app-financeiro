import React from 'react';
import { Form } from 'react-bootstrap';
import { useTransacoes } from '../../hooks/useTransacoes';

interface ProjectFilterOptions {
  placeholder?: string;
}

interface ProjectFilterProps {
  selectedProjects: string[];
  onChange: (projects: string[]) => void;
  options?: ProjectFilterOptions;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'lg';
  style?: React.CSSProperties;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({ 
  selectedProjects, 
  onChange, 
  options,
  className = '',
  disabled = false,
  size,
  style
}) => {
  const { transacoes, loading } = useTransacoes({});
  const isLoading = loading;

  const {
    placeholder = "Todos os projetos"
  } = options || {};

  const projetos = React.useMemo(() => {
    const projects = new Set<string>();
    transacoes.forEach(t => {
      if (t.projeto) projects.add(t.projeto);
    });
    return Array.from(projects).sort();
  }, [transacoes]);

  /**
   * Manipula a mudança de seleção de projetos
   * @param event - Evento de mudança do select
   */
  const handleProjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    onChange(selectedOptions);
  };

  return (
    <Form.Group>
      <Form.Label>Projetos</Form.Label>
      <Form.Select
        multiple
        value={selectedProjects}
        onChange={handleProjectChange}
        className={`${className} ${isLoading ? 'opacity-50' : ''}`}
        disabled={disabled || isLoading}
        size={size}
        style={style}
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

export default ProjectFilter;
