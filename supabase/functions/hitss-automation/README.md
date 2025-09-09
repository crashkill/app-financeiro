# HITSS Automation Edge Function

Esta Edge Function automatiza o processo de importação de dados de projetos do sistema HitssControl para o banco de dados Supabase.

## Funcionalidades

- ✅ Login automático no HitssControl
- ✅ Download de arquivo XLSX com dados dos projetos
- ✅ Processamento e inserção dos dados no banco
- ✅ Limpeza de dados antigos antes da inserção
- ✅ Notificação por e-mail (opcional)
- ✅ Tratamento de erros e logs detalhados

## Configuração

### Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no Supabase Dashboard ou no arquivo `.env.local`:

```bash
# Credenciais do HitssControl
HITSS_USER=seu_usuario_hitss
HITSS_PASS=sua_senha_hitss

# Token do Postmark (opcional - para notificações por e-mail)
POSTMARK_TOKEN=seu_token_postmark

# Configurações do Supabase (já configuradas automaticamente)
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### Estrutura da Tabela

A função espera que exista uma tabela `hitss_projetos` com a seguinte estrutura:

```sql
CREATE TABLE hitss_projetos (
  id SERIAL PRIMARY KEY,
  projeto TEXT,
  cliente TEXT,
  responsavel TEXT,
  status TEXT,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Como Usar

### 1. Execução Manual

Faça uma requisição POST para a Edge Function:

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/hitss-automation \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

### 2. Execução Programada

Configure um cron job ou use o Supabase Cron para executar automaticamente:

```sql
-- Executar todos os dias às 8:00
SELECT cron.schedule('hitss-sync', '0 8 * * *', 'SELECT net.http_post(url:=''https://seu-projeto.supabase.co/functions/v1/hitss-automation'', headers:=''{}''::jsonb);');
```

### 3. Integração com Frontend

```typescript
const { data, error } = await supabase.functions.invoke('hitss-automation');

if (error) {
  console.error('Erro na automação:', error);
} else {
  console.log('Automação executada com sucesso:', data);
}
```

## Fluxo de Execução

1. **Autenticação**: Faz login no HitssControl usando as credenciais configuradas
2. **Download**: Baixa o arquivo XLSX com os dados dos projetos
3. **Processamento**: Converte o XLSX em dados estruturados
4. **Limpeza**: Remove dados antigos da tabela `hitss_projetos`
5. **Inserção**: Insere os novos dados na tabela
6. **Notificação**: Envia e-mail de confirmação (se configurado)

## Logs e Monitoramento

A função gera logs detalhados que podem ser visualizados no Supabase Dashboard:

- Processo de login
- Download do arquivo
- Número de registros processados
- Erros e avisos
- Status do envio de e-mail

## Tratamento de Erros

A função trata os seguintes cenários de erro:

- Credenciais inválidas
- Falha no download do arquivo
- Problemas na inserção de dados
- Falha no envio de e-mail (não crítico)

## Segurança

- As credenciais são armazenadas como variáveis de ambiente
- Usa HTTPS para todas as comunicações
- Logs não expõem informações sensíveis
- Validação de dados antes da inserção

## Troubleshooting

### Erro de Login
- Verifique se as credenciais `HITSS_USER` e `HITSS_PASS` estão corretas
- Confirme se o usuário tem acesso ao HitssControl

### Erro de Download
- Verifique se a URL de exportação está correta
- Confirme se o usuário tem permissão para exportar dados

### Erro de Inserção
- Verifique se a tabela `hitss_projetos` existe
- Confirme se as permissões RLS estão configuradas corretamente

### E-mail não Enviado
- Verifique se o `POSTMARK_TOKEN` está configurado
- Confirme se o domínio de envio está verificado no Postmark