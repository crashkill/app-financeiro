import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { db } from '../../db/database';

interface ProjectFilterProps {
  selectedProjects: string[];
  onProjectChange: (selected: string[]) => void;
  label?: string;
  height?: string;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({
  selectedProjects,
  onProjectChange,
  label = 'Projetos',
  height = '200px'
}) => {
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const transacoes = await db.transacoes.toArray();
        const uniqueProjects = Array.from(new Set(transacoes.map(t => t.descricao || 'Sem Projeto')));
        setProjects(uniqueProjects);
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      }
    };

    loadProjects();
  }, []);

  const handleProjectSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    onProjectChange(selected);
  };

  return (
    <Form.Group>
      <Form.Label>{label}</Form.Label>
      <Form.Select
        multiple
        value={selectedProjects}
        onChange={handleProjectSelection}
        className="form-select"
        style={{ height }}
      >
        {projects.map((project) => (
          <option key={project} value={project}>
            {project}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default ProjectFilter;
