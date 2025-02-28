import { Box, Typography, Paper } from "@mui/material";

const Componentes = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Componentes do Sistema
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: "#ffebee" }}>
        <Typography variant="h5" gutterBottom sx={{ color: "#d32f2f" }}>
          Arquivos Importantes - Não Modificar Layout
        </Typography>
        <Typography variant="body1" paragraph>
          Os seguintes arquivos são classificados como críticos e não devem ter seu layout alterado sem aprovação adequada:
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>
              <Typography variant="body1" fontWeight="bold">src/components/Sidebar.tsx</Typography>
              <Typography variant="body2">
                Componente de navegação principal do sistema. Alterações no layout podem afetar negativamente a experiência do usuário e a navegabilidade da aplicação.
              </Typography>
            </li>
            {/* Adicionar outros arquivos importantes aqui quando necessário */}
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          1. Componentes de Layout
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          1.1. Sidebar
        </Typography>
        <Typography variant="body1" paragraph>
          Menu lateral responsivo que fornece navegação principal do sistema.
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Navegação entre páginas</li>
            <li>Indicador de página atual</li>
            <li>Ícones personalizados</li>
            <li>Suporte a submenus</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          1.2. Header
        </Typography>
        <Typography variant="body1" paragraph>
          Cabeçalho com informações do usuário e ações globais.
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Perfil do usuário</li>
            <li>Notificações</li>
            <li>Ações rápidas</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          2. Componentes de Dados
        </Typography>

        <Typography variant="h6" gutterBottom>
          2.1. Tabelas Financeiras
        </Typography>
        <Typography variant="body1" paragraph>
          Exibição de dados financeiros em formato tabular com recursos avançados.
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Ordenação por colunas</li>
            <li>Filtros avançados</li>
            <li>Paginação</li>
            <li>Exportação de dados</li>
            <li>Células editáveis</li>
            <li>Totalizadores</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          2.2. Gráficos
        </Typography>
        <Typography variant="body1" paragraph>
          Visualizações gráficas dos dados financeiros.
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Gráficos de linha para tendências</li>
            <li>Gráficos de barra para comparações</li>
            <li>Gráficos de pizza para distribuição</li>
            <li>Tooltips informativos</li>
            <li>Zoom e pan</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          3. Componentes de Entrada
        </Typography>

        <Typography variant="h6" gutterBottom>
          3.1. Filtros
        </Typography>
        <Typography variant="body1" paragraph>
          Controles para filtrar e refinar dados.
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Filtro de projetos</li>
            <li>Filtro de período</li>
            <li>Filtro de tipo de transação</li>
            <li>Busca textual</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          3.2. Formulários
        </Typography>
        <Typography variant="body1" paragraph>
          Formulários para entrada e edição de dados.
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Validação em tempo real</li>
            <li>Máscaras de entrada</li>
            <li>Auto-complete</li>
            <li>Formatação automática</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          4. Componentes de Feedback
        </Typography>

        <Typography variant="h6" gutterBottom>
          4.1. Notificações
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Mensagens de sucesso</li>
            <li>Alertas de erro</li>
            <li>Avisos de sistema</li>
            <li>Toasts informativos</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          4.2. Loaders
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Indicadores de carregamento</li>
            <li>Skeletons</li>
            <li>Barras de progresso</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          5. Componentes Utilitários
        </Typography>

        <Typography variant="h6" gutterBottom>
          5.1. Modais
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Diálogos de confirmação</li>
            <li>Formulários em modal</li>
            <li>Visualização detalhada</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          5.2. Tooltips
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Dicas de uso</li>
            <li>Informações detalhadas</li>
            <li>Atalhos de teclado</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          6. Integrações Externas
        </Typography>

        <Typography variant="h6" gutterBottom>
          6.1. Consulta SAP
        </Typography>
        <Typography variant="body1" paragraph>
          Interface para consulta de dados do SAP diretamente da aplicação web.
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Autenticação com credenciais SAP</li>
            <li>Seleção de servidores SAP</li>
            <li>Execução de transações comuns</li>
            <li>Visualização de resultados em formato tabular</li>
            <li>Suporte para parâmetros específicos por transação</li>
          </ul>
        </Typography>

        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          <strong>Implementação:</strong> Esta funcionalidade utiliza um serviço de intermediação entre a aplicação web e o SAP GUI. Na versão atual, os dados são simulados para fins de demonstração, mas em um ambiente de produção pode ser integrado com APIs SAP ou extensões do navegador para controle direto do SAP GUI.
        </Typography>
        
        <Typography variant="body1" paragraph>
          <strong>Credenciais:</strong> A funcionalidade utiliza suas credenciais pessoais do SAP. Nenhuma senha é armazenada na aplicação.
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>Transações Suportadas:</strong>
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li><code>S_ALR_87013019</code> - Relatório de Finanças</li>
            <li><code>ME23N</code> - Exibir Pedido de Compra</li>
            <li><code>FB03</code> - Exibir Documento Contábil</li>
            <li><code>XD03</code> - Exibir Cliente</li>
            <li><code>MM03</code> - Exibir Material</li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Componentes;
