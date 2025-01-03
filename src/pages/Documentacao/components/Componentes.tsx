import { Box, Typography, Paper } from "@mui/material";

const Componentes = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Componentes do Sistema
      </Typography>

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

      <Paper elevation={2} sx={{ p: 3 }}>
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
    </Box>
  );
};

export default Componentes;
