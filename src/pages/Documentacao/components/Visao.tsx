import { Box, Typography, Paper } from "@mui/material";

const Visao = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Visão Geral do Sistema
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          1. Objetivo
        </Typography>
        <Typography variant="body1" paragraph>
          O App Financeiro é uma aplicação web desenvolvida para gerenciar e analisar dados financeiros de projetos.
          Oferece funcionalidades para visualização, análise e projeção de dados financeiros, com foco em receitas,
          custos e margens de projetos.
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          2. Principais Funcionalidades
        </Typography>
        <Typography variant="h6" gutterBottom>
          2.1. Dashboard
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Visão consolidada dos indicadores financeiros</li>
            <li>Gráficos de receitas, custos e margens</li>
            <li>Filtros por projeto e período</li>
            <li>Indicadores de performance visual</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          2.2. Planilhas Financeiras
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Visualização detalhada por projeto</li>
            <li>Dados mensais e acumulados</li>
            <li>Cálculo automático de margens</li>
            <li>Exportação de dados</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          2.3. Forecast
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Projeções financeiras</li>
            <li>Análise de tendências</li>
            <li>Comparativo com dados realizados</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          2.4. Upload de Dados
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Importação de planilhas Excel</li>
            <li>Validação automática de dados</li>
            <li>Processamento em lote</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          3. Tecnologias Utilizadas
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Frontend: React, TypeScript, Material-UI, React Bootstrap</li>
            <li>Banco de Dados: DexieJS (IndexedDB)</li>
            <li>Gráficos: Chart.js</li>
            <li>Bundler: Vite</li>
            <li>Controle de Versão: Git</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          4. Requisitos do Sistema
        </Typography>
        <Typography variant="h6" gutterBottom>
          4.1. Requisitos de Hardware
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Processador: 2GHz ou superior</li>
            <li>Memória RAM: 4GB ou superior</li>
            <li>Espaço em Disco: 1GB disponível</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          4.2. Requisitos de Software
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Navegador moderno (Chrome, Firefox, Edge)</li>
            <li>JavaScript habilitado</li>
            <li>Cookies habilitados</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          5. Suporte e Contato
        </Typography>
        <Typography variant="body1" paragraph>
          Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento
          através dos canais:
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Email: suporte@appfinanceiro.com</li>
            <li>Telefone: (11) 1234-5678</li>
            <li>Portal de Suporte: https://suporte.appfinanceiro.com</li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Visao;
