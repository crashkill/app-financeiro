import React from 'react';
import { Form } from 'react-bootstrap';
import { useTransacoes } from '../../hooks/useTransacoes';

interface ProjectFilterProps {
  selectedProjects: string[];
  onChange: (projects: string[]) => void;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({ selectedProjects, onChange }) => {
  const { transacoes, loading } = useTransacoes({});

  const uniqueProjects = React.useMemo(() => {
    const projects = new Set<string>();
    transacoes.forEach(t => {
      if (t.projeto) projects.add(t.projeto);
    });
    return Array.from(projects).sort();
  }, [transacoes]);

  return (
    <Form.Group>
      <Form.Label>Projetos</Form.Label>
      <Form.Select
        multiple
        value={selectedProjects}
        onChange={(e) => {
          const options = Array.from(e.target.selectedOptions);
          onChange(options.map(option => option.value));
        }}
        disabled={loading}
      >
        {uniqueProjects.map(project => (
          <option key={project} value={project}>
            {project}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default ProjectFilter;
