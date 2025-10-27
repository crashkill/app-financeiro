import React from 'react';
import { Card, Form } from 'react-bootstrap';

interface ProjectFilterReusableProps {
  projects: string[];
  selectedProjects: string[];
  onChange: (projects: string[]) => void;
  label?: string;
  helpText?: string;
  className?: string;
  isLoading?: boolean;
}

const ProjectFilterReusable: React.FC<ProjectFilterReusableProps> = ({
  projects,
  selectedProjects,
  onChange,
  label = "Filtrar Projetos",
  helpText = "Segure Ctrl para selecionar múltiplos projetos. Nenhuma seleção mostra todos os projetos.",
  className = "",
  isLoading = false
}) => {
  // Handler para mudança na seleção de projetos
  const handleProjectSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    onChange(selected);
  };

  return (
    <Card className={`shadow bg-card text-card-foreground border border-border ${className}`}>
      <Card.Body>
        <div>
          <Form.Label><strong>{label}</strong></Form.Label>
          <Form.Select 
            multiple 
            onChange={handleProjectSelection}
            value={selectedProjects}
            className="form-control bg-input text-foreground border-border focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            style={{ minHeight: '200px' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <option disabled>Carregando projetos...</option>
            ) : projects.length === 0 ? (
              <option disabled>Nenhum projeto disponível</option>
            ) : (
              projects.map((project) => (
                <option key={project} value={project} className="text-slate-900 dark:text-white">
                  {project}
                </option>
              ))
            )}
          </Form.Select>
          <Form.Text className="text-slate-500 dark:text-slate-400">
            {helpText}
          </Form.Text>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProjectFilterReusable;