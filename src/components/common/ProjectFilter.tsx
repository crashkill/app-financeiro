import React, { useMemo, useState, useEffect } from 'react';
import { Form, Spinner, Alert } from 'react-bootstrap';
import { useTransacoes } from '../../hooks/useTransacoes';
import { storageService } from '../../services/storageService';

/**
 * Fonte de dados para o filtro de projetos
 */
export type ProjectDataSource = 'transactions' | 'financial' | 'custom';

/**
 * Opções de configuração para o componente ProjectFilter
 */
export interface ProjectFilterOptions {
  /** Mostrar opção "Todos os projetos" */
  showAllOption?: boolean;
  /** Mostrar opção "Nenhum projeto" */
  showNoneOption?: boolean;
  /** Texto da opção "Todos os projetos" */
  allOptionText?: string;
  /** Texto da opção "Nenhum projeto" */
  noneOptionText?: string;
  /** Placeholder quando nenhum projeto está selecionado */
  placeholder?: string;
  /** Texto de ajuda exibido abaixo do select */
  helpText?: string;
  /** Altura mínima do select */
  minHeight?: string;
  /** Classes CSS customizadas */
  className?: string;
  /** Desabilitar o componente */
  disabled?: boolean;
}

/**
 * Props do componente ProjectFilter
 */
export interface ProjectFilterProps {
  /** Projetos atualmente selecionados */
  selectedProjects: string[];
  /** Callback chamado quando a seleção muda */
  onChange: (projects: string[]) => void;
  /** Fonte de dados para carregar os projetos */
  dataSource?: ProjectDataSource;
  /** Lista customizada de projetos (usado quando dataSource é 'custom') */
  customProjects?: string[];
  /** Opções de configuração do componente */
  options?: ProjectFilterOptions;
  /** Label do campo */
  label?: string;
  /** ID do elemento para acessibilidade */
  id?: string;
  /** Callback chamado quando ocorre um erro */
  onError?: (error: Error) => void;
}

/**
 * Valores padrão para as opções
 */
const defaultOptions: Required<ProjectFilterOptions> = {
  showAllOption: false,
  showNoneOption: false,
  allOptionText: 'Todos os projetos',
  noneOptionText: 'Nenhum projeto',
  placeholder: 'Selecione os projetos...',
  helpText: 'Segure Ctrl para selecionar múltiplos projetos. Nenhuma seleção mostra todos os projetos.',
  minHeight: '200px',
  className: '',
  disabled: false,
};

/**
 * Hook customizado para carregar projetos de diferentes fontes
 */
const useProjectData = (
  dataSource: ProjectDataSource,
  customProjects?: string[],
  onError?: (error: Error) => void
) => {
  const [projects, setProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { transacoes, loading: transacoesLoading } = useTransacoes({});

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let projectList: string[] = [];
        
        switch (dataSource) {
          case 'transactions':
            if (!transacoesLoading && transacoes.length > 0) {
              const projectSet = new Set<string>();
              transacoes.forEach(t => {
                if (t.projeto && t.projeto.trim()) {
                  projectSet.add(t.projeto.trim());
                }
              });
              projectList = Array.from(projectSet).sort();
            }
            break;
            
          case 'financial':
            const financialData = storageService.getFinancialData();
            const financialProjects = new Set<string>();
            financialData.forEach(item => {
              if (item.visao && item.visao.trim()) {
                financialProjects.add(item.visao.trim());
              }
            });
            projectList = Array.from(financialProjects).sort();
            break;
            
          case 'custom':
            projectList = customProjects ? [...customProjects].sort() : [];
            break;
            
          default:
            throw new Error(`Fonte de dados não suportada: ${dataSource}`);
        }
        
        setProjects(projectList);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao carregar projetos');
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    if (dataSource === 'transactions') {
      if (!transacoesLoading) {
        loadProjects();
      }
    } else {
      loadProjects();
    }
  }, [dataSource, customProjects, transacoes, transacoesLoading, onError]);

  return { projects, loading: loading || transacoesLoading, error };
};

/**
 * Componente de filtro de projetos reutilizável e flexível
 * 
 * @example
 * ```tsx
 * // Uso básico com transações
 * <ProjectFilter
 *   selectedProjects={selectedProjects}
 *   onChange={setSelectedProjects}
 * />
 * 
 * // Uso com dados financeiros
 * <ProjectFilter
 *   selectedProjects={selectedProjects}
 *   onChange={setSelectedProjects}
 *   dataSource="financial"
 * />
 * 
 * // Uso com projetos customizados
 * <ProjectFilter
 *   selectedProjects={selectedProjects}
 *   onChange={setSelectedProjects}
 *   dataSource="custom"
 *   customProjects={['Projeto A', 'Projeto B']}
 *   options={{
 *     showAllOption: false,
 *     placeholder: 'Escolha um projeto...'
 *   }}
 * />
 * ```
 */
const ProjectFilter: React.FC<ProjectFilterProps> = ({
  selectedProjects,
  onChange,
  dataSource = 'transactions',
  customProjects,
  options = {},
  label = 'Filtrar Projetos',
  id = 'project-filter',
  onError,
}) => {
  const config = { ...defaultOptions, ...options };
  const { projects, loading, error } = useProjectData(dataSource, customProjects, onError);

  /**
   * Manipula a mudança de seleção no select
   */
  const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const selected: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        const value = options[i].value;
        selected.push(value);
      }
    }
    
    onChange(selected);
  };

  /**
   * Determina o valor atual do select baseado na seleção
   */
  const selectValue = useMemo(() => {
    return selectedProjects;
  }, [selectedProjects]);

  if (error) {
    return (
      <Form.Group>
        <Form.Label htmlFor={id}>
          <strong>{label}</strong>
        </Form.Label>
        <Alert variant="danger" className="mb-0">
          <small>Erro ao carregar projetos: {error.message}</small>
        </Alert>
      </Form.Group>
    );
  }

  return (
    <Form.Group>
      <Form.Label htmlFor={id}>
        <strong>{label}</strong>
      </Form.Label>
      
      <div className="position-relative">
        <Form.Select
          id={id}
          multiple
          value={selectValue}
          onChange={handleSelectionChange}
          disabled={config.disabled || loading}
          className={`
            form-control bg-input text-foreground border-border 
            focus:ring-blue-500 focus:border-blue-500 
            dark:focus:ring-blue-500 dark:focus:border-blue-500 
            ${config.className}
          `.trim()}
          style={{ minHeight: config.minHeight }}
          aria-label={label}
          aria-describedby={`${id}-help`}
        >

          
          {/* Lista de projetos */}
          {projects.map(project => (
            <option 
              key={project} 
              value={project}
              className="text-slate-900 dark:text-white"
            >
              {project}
            </option>
          ))}
          
          {/* Mensagem quando não há projetos */}
          {!loading && projects.length === 0 && (
            <option disabled className="text-slate-400 dark:text-slate-500">
              Nenhum projeto encontrado
            </option>
          )}
        </Form.Select>
        
        {/* Indicador de loading */}
        {loading && (
          <div 
            className="position-absolute top-50 end-0 translate-middle-y me-3"
            style={{ pointerEvents: 'none' }}
          >
            <Spinner animation="border" size="sm" />
          </div>
        )}
      </div>
      
      {/* Texto de ajuda */}
      {config.helpText && (
        <Form.Text id={`${id}-help`} className="text-slate-500 dark:text-slate-400">
          {config.helpText}
        </Form.Text>
      )}
      
      {/* Informação sobre seleção atual */}
      {selectedProjects.length > 0 && (
        <Form.Text className="text-info">
          {selectedProjects.length === projects.length 
            ? `Todos os ${projects.length} projetos selecionados`
            : `${selectedProjects.length} de ${projects.length} projetos selecionados`
          }
        </Form.Text>
      )}
    </Form.Group>
  );
};

export default ProjectFilter;

/**
 * Hook utilitário para usar o ProjectFilter com estado local
 * 
 * @example
 * ```tsx
 * const { selectedProjects, handleProjectChange, clearSelection, selectAll } = useProjectFilter();
 * 
 * return (
 *   <ProjectFilter
 *     selectedProjects={selectedProjects}
 *     onChange={handleProjectChange}
 *   />
 * );
 * ```
 */
export const useProjectFilter = (initialProjects: string[] = []) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>(initialProjects);
  
  const handleProjectChange = (projects: string[]) => {
    setSelectedProjects(projects);
  };
  
  const clearSelection = () => {
    setSelectedProjects([]);
  };
  
  const selectAll = (allProjects: string[]) => {
    setSelectedProjects([...allProjects]);
  };
  
  return {
    selectedProjects,
    handleProjectChange,
    clearSelection,
    selectAll,
    setSelectedProjects,
  };
};