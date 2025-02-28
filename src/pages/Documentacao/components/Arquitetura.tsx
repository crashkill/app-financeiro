import { Box, Typography, Paper } from "@mui/material";

const Arquitetura = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Arquitetura do Sistema
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          1. Visão Geral da Arquitetura
        </Typography>
        <Typography variant="body1" paragraph>
          O App Financeiro utiliza uma arquitetura moderna baseada em componentes React, com armazenamento
          local usando IndexedDB. A aplicação é estruturada em camadas bem definidas para facilitar a
          manutenção e escalabilidade.
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          2. Estrutura de Diretórios
        </Typography>
        <Typography variant="body1" component="div" sx={{ fontFamily: "monospace", whiteSpace: "pre-line" }}>
          {`
src/
  ├── components/      # Componentes reutilizáveis
  │   ├── filters/     # Componentes de filtro
  │   ├── tables/      # Componentes de tabela
  │   └── charts/      # Componentes de gráfico
  │
  ├── contexts/        # Contextos React
  │   ├── AuthContext  # Contexto de autenticação
  │   └── ConfigContext# Contexto de configuração
  │
  ├── pages/          # Páginas da aplicação
  │   ├── Dashboard/
  │   ├── Planilhas/
  │   └── Documentacao/
  │
  ├── db/             # Configuração do banco
  │   └── database.ts
  │
  ├── types/          # Tipos TypeScript
  │   ├── models.ts
  │   └── utils.ts
  │
  └── utils/          # Funções utilitárias
      ├── formatters/
      └── calculators/
          `}
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          3. Camadas da Aplicação
        </Typography>

        <Typography variant="h6" gutterBottom>
          3.1. Camada de Apresentação
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Componentes React com TypeScript</li>
            <li>Material-UI e React Bootstrap para UI</li>
            <li>Chart.js para visualizações gráficas</li>
            <li>Gerenciamento de estado com Context API</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          3.2. Camada de Lógica de Negócio
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Hooks personalizados para lógica reutilizável</li>
            <li>Serviços para operações complexas</li>
            <li>Validadores e calculadores</li>
            <li>Transformadores de dados</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          3.3. Camada de Dados
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>DexieJS para interação com IndexedDB</li>
            <li>Modelos de dados tipados</li>
            <li>Migrations para evolução do banco</li>
            <li>Cache em memória para performance</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          4. Fluxo de Dados
        </Typography>
        <Typography variant="body1" paragraph>
          O fluxo de dados na aplicação segue um padrão unidirecional:
        </Typography>
        <Typography variant="body1" component="div">
          <ol>
            <li>Usuário interage com a interface</li>
            <li>Componente dispara ação</li>
            <li>Serviço processa a ação</li>
            <li>Dados são atualizados no banco</li>
            <li>Interface é atualizada via hooks</li>
          </ol>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          5. Otimizações
        </Typography>
        <Typography variant="h6" gutterBottom>
          5.1. Performance
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Lazy loading de componentes</li>
            <li>Memoização de cálculos pesados</li>
            <li>Cache de dados frequentes</li>
            <li>Virtualização de listas longas</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          5.2. Segurança
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Validação de dados em todas as camadas</li>
            <li>Sanitização de inputs</li>
            <li>Controle de acesso por rota</li>
            <li>Proteção contra XSS</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          6. Considerações Técnicas
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Compatibilidade com navegadores modernos</li>
            <li>Responsividade em diferentes dispositivos</li>
            <li>Acessibilidade (WCAG 2.1)</li>
            <li>SEO e meta tags</li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Arquitetura;
