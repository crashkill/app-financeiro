import { Box, Typography, Paper } from "@mui/material";

const Banco = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Banco de Dados
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          1. Visão Geral
        </Typography>
        <Typography variant="body1" paragraph>
          O sistema utiliza o IndexedDB através da biblioteca DexieJS para armazenamento local dos dados.
          Esta escolha permite trabalhar offline e manter um bom desempenho mesmo com grandes volumes de dados.
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          2. Estrutura do Banco
        </Typography>

        <Typography variant="h6" gutterBottom>
          2.1. Tabela: Projetos
        </Typography>
        <Typography variant="body1" component="div" sx={{ fontFamily: "monospace", whiteSpace: "pre-line" }}>
          {`
  {
    id: string;           // Identificador único do projeto
    nome: string;         // Nome do projeto
    cliente: string;      // Nome do cliente
    inicio: Date;         // Data de início
    fim: Date;           // Data de término prevista
    status: string;       // Status atual do projeto
    descricao: string;    // Descrição detalhada
    created_at: Date;     // Data de criação
    updated_at: Date;     // Data da última atualização
  }`}
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          2.2. Tabela: Transacoes
        </Typography>
        <Typography variant="body1" component="div" sx={{ fontFamily: "monospace", whiteSpace: "pre-line" }}>
          {`
  {
    id: string;           // Identificador único da transação
    projeto_id: string;   // ID do projeto relacionado
    tipo: string;         // Tipo (Receita, Custo, Desoneração)
    valor: number;        // Valor da transação
    data: Date;          // Data da transação
    descricao: string;    // Descrição da transação
    categoria: string;    // Categoria da transação
    created_at: Date;     // Data de criação
    updated_at: Date;     // Data da última atualização
  }`}
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          2.3. Tabela: Configuracoes
        </Typography>
        <Typography variant="body1" component="div" sx={{ fontFamily: "monospace", whiteSpace: "pre-line" }}>
          {`
  {
    id: string;           // Identificador único da configuração
    chave: string;        // Nome da configuração
    valor: string;        // Valor da configuração
    descricao: string;    // Descrição da configuração
    updated_at: Date;     // Data da última atualização
  }`}
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          3. Índices
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>projetos.id (primary key)</li>
            <li>transacoes.id (primary key)</li>
            <li>transacoes.projeto_id (foreign key)</li>
            <li>transacoes.data (para consultas por período)</li>
            <li>transacoes.tipo (para filtros por tipo)</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          4. Migrations
        </Typography>
        <Typography variant="body1" paragraph>
          O sistema utiliza migrations para controle de versão do banco de dados:
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>v1.0.0: Estrutura inicial do banco</li>
            <li>v1.1.0: Adição de campos de auditoria</li>
            <li>v1.2.0: Adição da tabela de configurações</li>
            <li>v1.3.0: Novos índices para otimização</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          5. Operações Principais
        </Typography>

        <Typography variant="h6" gutterBottom>
          5.1. Consultas Comuns
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Busca de transações por projeto</li>
            <li>Filtro por período</li>
            <li>Agregações por tipo de transação</li>
            <li>Cálculos de totais e médias</li>
          </ul>
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          5.2. Operações de Escrita
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Inserção de novas transações</li>
            <li>Atualização de valores</li>
            <li>Exclusão lógica de registros</li>
            <li>Bulk operations para importação</li>
          </ul>
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          6. Considerações de Performance
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li>Uso de índices compostos para consultas frequentes</li>
            <li>Paginação de resultados grandes</li>
            <li>Cache de consultas comuns</li>
            <li>Lazy loading de dados relacionados</li>
            <li>Bulk operations para operações em lote</li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Banco;
