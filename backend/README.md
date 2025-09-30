# Robô HITSS Backend

Robô automatizado para download e processamento de dados Excel da API HITSS.

## 🚀 Funcionalidades

- **Download automático**: Baixa arquivo Excel da API HITSS
- **Processamento inteligente**: Extrai e formata dados DRE
- **Integração Supabase**: Insere dados processados na tabela `dre_hitss`
- **API REST**: Endpoints para controle e monitoramento
- **Logs detalhados**: Rastreamento completo de execuções

## 📋 Pré-requisitos

- Node.js 16+
- Acesso ao Supabase
- Credenciais da API HITSS

## 🛠️ Instalação

1. **Instalar dependências**:
```bash
npm install
```

2. **Configurar variáveis de ambiente**:
```bash
cp .env.example .env
# Editar .env com suas credenciais
```

3. **Testar configuração**:
```bash
npm test
```

## 🎯 Uso

### Iniciar servidor
```bash
npm start          # Produção
npm run dev        # Desenvolvimento
```

### Executar robô diretamente
```bash
npm run robot
```

## 📡 API Endpoints

### `POST /api/hitss-robot/execute`
Executa o robô HITSS.

**Headers:**
```
Authorization: Bearer hitss-robot-key
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "execution_id": "uuid",
  "batch_id": "HITSS_AUTO_timestamp",
  "records_processed": 150,
  "records_failed": 2,
  "records_inserted": 148,
  "message": "Robô HITSS executado com sucesso"
}
```

### `GET /api/hitss-robot/status/:executionId`
Verifica status de uma execução.

### `GET /api/hitss-robot/executions`
Lista execuções recentes.

### `GET /health`
Health check do serviço.

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | - |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Service Role Key | - |
| `PORT` | Porta do servidor | 3001 |
| `BACKEND_API_KEY` | Chave de autenticação | hitss-robot-key |
| `BACKEND_URL` | URL base do backend | http://localhost:3001 |

## 🏗️ Arquitetura

```
backend/
├── hitss-robot.js      # Classe principal do robô
├── server.js           # Servidor Express
├── test-robot.js       # Testes automatizados
├── package.json        # Dependências
└── .env.example        # Exemplo de configuração
```

## 🔄 Fluxo de Execução

1. **Inicialização**: Cria registro de execução no Supabase
2. **Download**: Baixa Excel da API HITSS
3. **Processamento**: Extrai e formata dados DRE
4. **Inserção**: Salva dados na tabela `dre_hitss`
5. **Finalização**: Atualiza status da execução

## 🧪 Testes

```bash
npm test               # Testa todas as funcionalidades
node test-robot.js     # Execução detalhada
```

## 📊 Monitoramento

- **Logs**: Console detalhado de cada execução
- **Supabase**: Registros na tabela `automation_executions`
- **API**: Endpoints de status e histórico

## 🔗 Integração com Supabase

O robô se integra com:
- **Edge Functions**: Acionamento via Cron Jobs
- **Tabela dre_hitss**: Armazenamento de dados
- **Tabela automation_executions**: Log de execuções

## 🚨 Tratamento de Erros

- **Retry automático**: Para falhas temporárias
- **Logs detalhados**: Para debugging
- **Status tracking**: Via Supabase
- **Rollback**: Em caso de falha na inserção

## 📈 Performance

- **Processamento em lotes**: 100 registros por vez
- **Timeout configurável**: 30s para download
- **Memória otimizada**: Streaming de dados
- **Cleanup automático**: Remove dados antigos