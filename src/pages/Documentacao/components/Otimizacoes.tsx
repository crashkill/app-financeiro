import React from 'react';
import { Card } from 'react-bootstrap';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const Otimizacoes: React.FC = () => {
  return (
    <div>
      <h2 className="mb-4">Otimizações de Performance</h2>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Banco de Dados e Cache</h3>
        </Card.Header>
        <Card.Body>
          <h4 className="h6">Índices Otimizados</h4>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// Schema do banco com índices compostos
this.version(6).stores({
  transacoes: '++id, tipo, natureza, [projeto+periodo], [descricao+periodo], periodo, projeto, descricao, contaResumo'
});`}
          </SyntaxHighlighter>

          <h4 className="h6 mt-4">Sistema de Cache</h4>
          <p>O sistema implementa um cache em memória com duração de 5 minutos para otimizar consultas frequentes.</p>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// Exemplo de uso do cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const transacoesCache: TransacoesCache = {};

// Verificação de cache
const cacheKey = \`\${tipo}-\${projeto}-\${periodo}\`;
if (useCache && transacoesCache[cacheKey]) {
  const cache = transacoesCache[cacheKey];
  if (Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }
}`}
          </SyntaxHighlighter>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Componentes Otimizados</h3>
        </Card.Header>
        <Card.Body>
          <h4 className="h6">Hooks Personalizados</h4>
          <p>O hook useTransacoes implementa várias otimizações:</p>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// Hook otimizado para transações
export const useTransacoes = (
  tipo?: 'receita' | 'despesa',
  projeto?: string,
  periodo?: string,
  useCache: boolean = true
) => {
  // Cache e estado local
  const [cachedData, setCachedData] = useState<TransacoesData>({ data: [], total: 0 });

  // Query otimizada usando índices compostos
  if (projeto && periodo) {
    query = query.where('[projeto+periodo]').equals([projeto, periodo]);
  }

  // Invalidação seletiva de cache
  const invalidateCache = (transacao: Transacao) => {
    Object.keys(transacoesCache).forEach(key => {
      if (key.includes(transacao.tipo) || 
          key.includes(transacao.projeto || '') || 
          key.includes(transacao.periodo || '')) {
        delete transacoesCache[key];
      }
    });
  };
}`}
          </SyntaxHighlighter>

          <h4 className="h6 mt-4">Componentes React Otimizados</h4>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// Exemplo de componente otimizado
const ProjectFilter: React.FC<ProjectFilterProps> = ({ ... }) => {
  // Uso de useMemo para processamento de listas
  const projetos = useMemo(() => {
    const uniqueProjects = new Set<string>();
    transacoes.forEach(t => {
      if (t.projeto) uniqueProjects.add(t.projeto);
      if (t.descricao) uniqueProjects.add(t.descricao);
    });
    return Array.from(uniqueProjects).sort();
  }, [transacoes]);

  // Handler otimizado
  const handleProjectChange = useCallback((event) => {
    const selectedValues = Array.from(event.target.selectedOptions).map(opt => opt.value);
    onProjectChange(selectedValues);
  }, [onProjectChange]);

  return <Form.Select {...props} />;
};

// Previne re-renders desnecessários
export default React.memo(ProjectFilter);`}
          </SyntaxHighlighter>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Normalização de Dados</h3>
        </Card.Header>
        <Card.Body>
          <p>Hooks do banco de dados garantem consistência dos dados:</p>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// Hooks de normalização
this.transacoes.hook('creating', (primKey, obj) => {
  // Normaliza o valor para número
  obj.valor = converterParaNumero(obj.valor);
  
  // Garante que projeto e descricao não sejam undefined
  obj.projeto = obj.projeto || obj.descricao || 'Sem Projeto';
  obj.descricao = obj.descricao || obj.projeto || 'Sem Descrição';
  
  // Normaliza o período para o formato correto (M/YYYY)
  if (obj.periodo) {
    const [mes, ano] = obj.periodo.split('/');
    obj.periodo = \`\${parseInt(mes)}/\${ano}\`;
  }
});`}
          </SyntaxHighlighter>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Próximas Otimizações Possíveis</h3>
        </Card.Header>
        <Card.Body>
          <ul>
            <li><strong>Paginação de Dados:</strong> Para lidar com grandes volumes de dados</li>
            <li><strong>Lazy Loading:</strong> Carregamento sob demanda de opções em filtros</li>
            <li><strong>Virtual Scrolling:</strong> Para listas muito grandes</li>
            <li><strong>Web Workers:</strong> Para processamento pesado em background</li>
            <li><strong>Service Workers:</strong> Para cache offline e melhor performance</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Otimizacoes;
