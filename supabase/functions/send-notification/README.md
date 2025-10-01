# Sistema de Notificação por Email - DRE

Este sistema implementa notificações automáticas por email para o processamento de arquivos DRE no Sistema Financeiro HITSS.

## 📋 Funcionalidades

- ✅ Notificações de sucesso no processamento
- ❌ Notificações de erro com detalhes
- 📊 Relatório detalhado com métricas de processamento
- 🎨 Template HTML responsivo e profissional
- ⚡ Integração automática com Edge Functions

## 🚀 Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env`:

```env
# Configurações de Email (Resend)
RESEND_API_KEY=your-resend-api-key-here

# Configurações de notificação
NOTIFICATION_EMAIL=fabricio.lima@globalhitss.com.br
EMAIL_FROM_NAME=Sistema Financeiro HITSS
EMAIL_FROM_ADDRESS=noreply@hitss.com.br
```

### 2. Obter Chave da API Resend

1. Acesse [https://resend.com](https://resend.com)
2. Crie uma conta ou faça login
3. Vá para [API Keys](https://resend.com/api-keys)
4. Crie uma nova chave da API
5. Copie a chave e adicione no arquivo `.env`

### 3. Deploy das Edge Functions

Certifique-se de que as seguintes Edge Functions estejam deployadas:

- `send-notification` - Função para envio de emails
- `process-dre-upload` - Função atualizada com integração de email

## 📧 Estrutura do Email

### Template de Sucesso
- ✅ Status de sucesso
- 📁 Nome do arquivo processado
- 📈 Quantidade de registros inseridos
- ⏱️ Tempo de execução
- 🕐 Data e hora do processamento

### Template de Erro
- ❌ Status de erro
- 📁 Nome do arquivo (se disponível)
- ⏱️ Tempo de execução
- 🔍 Detalhes do erro
- 🕐 Data e hora da tentativa

## 🧪 Testes

### Teste Manual

Execute o arquivo de teste:

```bash
deno run --allow-net supabase/functions/send-notification/test.ts
```

### Teste via API

```bash
curl -X POST "https://your-project.supabase.co/functions/v1/send-notification" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "fabricio.lima@globalhitss.com.br",
    "fileName": "teste.xlsx",
    "recordsProcessed": 100,
    "executionTime": 2000,
    "success": true
  }'
```

## 🔄 Fluxo de Integração

1. **Upload do arquivo** → Trigger automático
2. **Processamento DRE** → `process-dre-upload` Edge Function
3. **Parsing dos dados** → Inserção na base de dados
4. **Notificação automática** → `send-notification` Edge Function
5. **Email enviado** → Destinatário recebe notificação

## 📊 Métricas Incluídas

- **Nome do arquivo**: Identificação do arquivo processado
- **Registros processados**: Quantidade de linhas inseridas
- **Tempo de execução**: Duração do processamento em milissegundos
- **Status**: Sucesso ou erro
- **Detalhes do erro**: Mensagem específica em caso de falha
- **Timestamp**: Data e hora exata do processamento

## 🛠️ Manutenção

### Logs

Verifique os logs das Edge Functions no dashboard do Supabase:

1. Acesse o projeto no Supabase
2. Vá para "Edge Functions"
3. Selecione a função desejada
4. Visualize os logs em tempo real

### Troubleshooting

**Erro: RESEND_API_KEY não configurada**
- Verifique se a variável está definida no ambiente
- Confirme se a chave da API está correta

**Email não enviado**
- Verifique os logs da função `send-notification`
- Confirme se o domínio está verificado no Resend
- Verifique se há limites de envio atingidos

**Notificação não disparada**
- Verifique os logs da função `process-dre-upload`
- Confirme se a integração está ativa
- Verifique se há erros na chamada da API

## 📝 Changelog

### v1.0.0 (2024)
- ✨ Implementação inicial do sistema de notificação
- 📧 Template HTML responsivo
- 🔗 Integração com process-dre-upload
- 🧪 Arquivo de testes incluído
- 📚 Documentação completa

## 👥 Contato

Para suporte ou dúvidas sobre o sistema de notificação:
- Email: fabricio.lima@globalhitss.com.br
- Sistema: App Financeiro HITSS