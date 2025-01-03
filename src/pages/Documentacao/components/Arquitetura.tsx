import React from 'react';
import { Card } from 'react-bootstrap';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const Arquitetura: React.FC = () => {
  return (
    <div>
      <h2 className="mb-4">Arquitetura do Sistema</h2>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Estrutura do Projeto</h3>
        </Card.Header>
        <Card.Body>
          <SyntaxHighlighter language="plaintext" style={docco}>
            {`src/
  ├── components/       # Componentes reutilizáveis
  │   ├── filters/        # Filtros reutilizáveis
  │   │   ├── ProjectFilter/  # Filtro de projetos
  │   │   └── YearFilter/     # Filtro de anos
  │   ├── FilterPanel/    # Painel de filtros
  │   ├── ProjectCharts/  # Gráficos de projeto
  │   └── Layout/         # Componentes de layout
  ├── pages/           # Páginas da aplicação
  │   ├── Dashboard/      # Dashboard principal
  │   ├── PlanilhasFinanceiras/  # Planilhas detalhadas
  │   └── Documentacao/   # Documentação do sistema
  ├── db/             # Configuração do banco de dados
  │   └── database.ts   # Schema e conexão
  ├── types/          # Definições de tipos
  ├── utils/          # Utilitários
  │   ├── formatters/   # Formatadores de dados
  │   ├── calculators/  # Funções de cálculo
  │   └── validators/   # Validadores
  └── styles/         # Estilos globais`}
          </SyntaxHighlighter>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Stack Tecnológica</h3>
        </Card.Header>
        <Card.Body>
          <h4 className="h6">Frontend</h4>
          <ul>
            <li>React 18 - Framework principal</li>
            <li>TypeScript - Tipagem estática</li>
            <li>React Bootstrap - Componentes UI</li>
            <li>Tailwind CSS - Estilização</li>
            <li>Chart.js - Visualizações gráficas</li>
            <li>React Query - Gerenciamento de estado</li>
          </ul>

          <h4 className="h6 mt-4">Backend</h4>
          <ul>
            <li>DexieJS - Banco de dados IndexedDB</li>
            <li>Firebase - Autenticação e hosting</li>
          </ul>

          <h4 className="h6 mt-4">Ferramentas de Desenvolvimento</h4>
          <ul>
            <li>Vite - Build tool</li>
            <li>ESLint - Linting</li>
            <li>Prettier - Formatação de código</li>
            <li>PostCSS - Processamento CSS</li>
          </ul>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Padrões de Projeto</h3>
        </Card.Header>
        <Card.Body>
          <h4 className="h6">Componentes</h4>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// Exemplo de estrutura de componente
import React from 'react';
import { Props } from './types';
import { useStyles } from './styles';
import { someUtil } from '@/utils';

export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // Lógica do componente
  return (
    <div>
      {/* JSX */}
    </div>
  );
};`}
          </SyntaxHighlighter>

          <h4 className="h6 mt-4">Componentes Reutilizáveis</h4>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// Exemplo de uso dos filtros reutilizáveis
import ProjectFilter from '@/components/filters/ProjectFilter';
import YearFilter from '@/components/filters/YearFilter';

const MyComponent: React.FC = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  return (
    <>
      <ProjectFilter
        selectedProjects={selectedProjects}
        onProjectChange={setSelectedProjects}
        label="Filtrar Projetos"  // opcional
        height="200px"           // opcional
      />
      <YearFilter
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        label="Ano"             // opcional
      />
    </>
  );
};`}
          </SyntaxHighlighter>

          <h4 className="h6 mt-4">Hooks Personalizados</h4>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// Exemplo de hook personalizado
import { useState, useEffect } from 'react';

export const useCustomHook = (param: Type) => {
  const [state, setState] = useState<State>();

  useEffect(() => {
    // Lógica do hook
  }, [param]);

  return { state };
};`}
          </SyntaxHighlighter>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Fluxo de Dados</h3>
        </Card.Header>
        <Card.Body>
          <ol>
            <li>
              <strong>Entrada de Dados</strong>
              <ul>
                <li>Interface do usuário</li>
                <li>Importação de arquivos</li>
                <li>APIs externas</li>
              </ul>
            </li>
            <li>
              <strong>Processamento</strong>
              <ul>
                <li>Validação de dados</li>
                <li>Cálculos financeiros</li>
                <li>Transformação de dados</li>
              </ul>
            </li>
            <li>
              <strong>Armazenamento</strong>
              <ul>
                <li>IndexedDB local</li>
                <li>Cache de dados</li>
                <li>Estado da aplicação</li>
              </ul>
            </li>
            <li>
              <strong>Apresentação</strong>
              <ul>
                <li>Renderização de componentes</li>
                <li>Atualização de UI</li>
                <li>Feedback ao usuário</li>
              </ul>
            </li>
          </ol>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Arquitetura;
