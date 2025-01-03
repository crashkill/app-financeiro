import { Box, Typography, Paper } from "@mui/material";

const Deploy = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Deploy e Manutenção
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          1. Requisitos de Ambiente
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          1.1. Desenvolvimento
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Node.js 18.x ou superior</li>
            <li>npm 8.x ou superior</li>
            <li>Git</li>
            <li>VS Code (recomendado)</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          1.2. Produção
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Servidor web (Nginx/Apache)</li>
            <li>HTTPS configurado</li>
            <li>Navegadores modernos</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          2. Processo de Build
        </Typography>
        <Typography variant="body1" paragraph>
          O processo de build é gerenciado pelo Vite e consiste nos seguintes passos:
        </Typography>
        <Typography variant="body1" component="div" sx={{ fontFamily: "monospace", whiteSpace: "pre-line" }}>
          {`
  # Instalar dependências
  npm install

  # Build de produção
  npm run build

  # Testar build localmente
  npm run preview`}
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          3. Processo de Deploy
        </Typography>

        <Typography variant="h6" gutterBottom>
          3.1. Deploy Manual
        </Typography>
        <Typography variant="body1" component="div">
          <ol>
            <li>Gerar build de produção</li>
            <li>Copiar conteúdo da pasta dist/</li>
            <li>Fazer upload para servidor web</li>
            <li>Configurar redirecionamento para index.html</li>
          </ol>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          3.2. Deploy Automático
        </Typography>
        <Typography variant="body1" component="div">
          <ol>
            <li>Push para branch main</li>
            <li>CI/CD pipeline é acionado</li>
            <li>Testes são executados</li>
            <li>Build é gerado</li>
            <li>Deploy automático é realizado</li>
          </ol>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          4. Monitoramento
        </Typography>

        <Typography variant="h6" gutterBottom>
          4.1. Performance
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Tempo de carregamento</li>
            <li>Uso de memória</li>
            <li>Tamanho do banco IndexedDB</li>
            <li>Erros do cliente</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          4.2. Logs
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Erros de aplicação</li>
            <li>Ações do usuário</li>
            <li>Performance de operações</li>
            <li>Uso de recursos</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          5. Manutenção
        </Typography>

        <Typography variant="h6" gutterBottom>
          5.1. Atualizações
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Atualização de dependências</li>
            <li>Correção de bugs</li>
            <li>Melhorias de performance</li>
            <li>Novas funcionalidades</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          5.2. Backup
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Backup do código fonte</li>
            <li>Backup de configurações</li>
            <li>Backup de dados do usuário</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          6. Segurança
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>HTTPS obrigatório</li>
            <li>Headers de segurança configurados</li>
            <li>CSP implementado</li>
            <li>Sanitização de dados</li>
            <li>Autenticação e autorização</li>
            <li>Proteção contra XSS e CSRF</li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Deploy;