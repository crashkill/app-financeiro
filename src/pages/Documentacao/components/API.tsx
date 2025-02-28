import { Box, Typography, Paper } from "@mui/material";

const API = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        API e Serviços
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          1. Serviços de Dados
        </Typography>

        <Typography variant="h6" gutterBottom>
          1.1. ProjetoService
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>getProjetos(): Promise&lt;Projeto[]&gt;</li>
            <li>getProjetoPorId(id: string): Promise&lt;Projeto&gt;</li>
            <li>criarProjeto(projeto: Projeto): Promise&lt;string&gt;</li>
            <li>atualizarProjeto(projeto: Projeto): Promise&lt;void&gt;</li>
            <li>deletarProjeto(id: string): Promise&lt;void&gt;</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          1.2. TransacaoService
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>getTransacoes(filtros: FiltroTransacao): Promise&lt;Transacao[]&gt;</li>
            <li>getTransacaoPorId(id: string): Promise&lt;Transacao&gt;</li>
            <li>criarTransacao(transacao: Transacao): Promise&lt;string&gt;</li>
            <li>atualizarTransacao(transacao: Transacao): Promise&lt;void&gt;</li>
            <li>deletarTransacao(id: string): Promise&lt;void&gt;</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          2. Serviços de Cálculo
        </Typography>

        <Typography variant="h6" gutterBottom>
          2.1. CalculoFinanceiroService
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>calcularTotaisPorProjeto(projetoId: string): Promise&lt;TotaisProjeto&gt;</li>
            <li>calcularMargens(transacoes: Transacao[]): Promise&lt;Margens&gt;</li>
            <li>calcularIndicadores(dados: DadosFinanceiros): Promise&lt;Indicadores&gt;</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          2.2. ProjecaoService
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>projetarReceitas(dados: DadosProjecao): Promise&lt;ProjecaoReceitas&gt;</li>
            <li>projetarCustos(dados: DadosProjecao): Promise&lt;ProjecaoCustos&gt;</li>
            <li>calcularTendencias(historico: DadosHistoricos): Promise&lt;Tendencias&gt;</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          3. Serviços de Importação
        </Typography>

        <Typography variant="h6" gutterBottom>
          3.1. ImportacaoService
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>importarPlanilha(arquivo: File): Promise&lt;ResultadoImportacao&gt;</li>
            <li>validarDados(dados: DadosImportacao): Promise&lt;ResultadoValidacao&gt;</li>
            <li>processarDados(dados: DadosValidados): Promise&lt;void&gt;</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          3.2. ExportacaoService
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>exportarPlanilha(filtros: FiltrosExportacao): Promise&lt;File&gt;</li>
            <li>gerarRelatorio(params: ParametrosRelatorio): Promise&lt;Relatorio&gt;</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          4. Serviços de Utilidade
        </Typography>

        <Typography variant="h6" gutterBottom>
          4.1. FormatadorService
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>formatarMoeda(valor: number): string</li>
            <li>formatarData(data: Date): string</li>
            <li>formatarPorcentagem(valor: number): string</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          4.2. ValidadorService
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>validarTransacao(transacao: Transacao): ResultadoValidacao</li>
            <li>validarProjeto(projeto: Projeto): ResultadoValidacao</li>
            <li>validarDadosImportacao(dados: any): ResultadoValidacao</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          5. Tratamento de Erros
        </Typography>
        <Typography variant="body1" paragraph>
          Todos os serviços implementam tratamento padronizado de erros:
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Erros de validação: ValidationError</li>
            <li>Erros de banco de dados: DatabaseError</li>
            <li>Erros de processamento: ProcessingError</li>
            <li>Erros de importação: ImportError</li>
            <li>Erros genéricos: AppError</li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
};

export default API;
