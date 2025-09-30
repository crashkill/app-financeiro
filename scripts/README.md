# Scripts de Verificação DRE HITSS

Este diretório contém scripts para verificar e monitorar os dados da tabela `dre_hitss` no Supabase.

## Scripts Disponíveis

### 1. verify-dre-data.js

**Propósito**: Verificação completa dos dados na tabela `dre_hitss`

**Funcionalidades**:
- ✅ Consulta registros das últimas 24 horas
- ✅ Mostra estatísticas gerais da tabela
- ✅ Agrupa uploads por `upload_batch_id`
- ✅ Valida estrutura dos dados
- ✅ Exibe estatísticas por tipo e natureza
- ✅ Calcula totais financeiros
- ✅ Lista períodos únicos

**Como usar**:
```bash
node scripts/verify-dre-data.js
```

**Exemplo de saída**:
```
🔍 Verificando dados na tabela dre_hitss...
==================================================
📊 Registros das últimas 24 horas: 0
📈 Total de registros na tabela: 1000

📦 Últimos uploads por lote:
   Lote: bb0eb3af-16a0-46d7-a7ca-a769ede0ac47
   Arquivo: hitss_auto_2025-09-19.xlsx
   Registros: 20
   Upload: 19/09/2025, 22:46:48

📊 Estatísticas por tipo:
   receita - RECEITA: 1
   despesa - RECEITA: 69
   despesa - CUSTO: 930

💰 Estatísticas financeiras:
   Total valor: R$ 1.918.639,796
   Total lançamento: R$ 1.918.639,796
   Períodos únicos: 55
```

### 2. monitor-uploads.js

**Propósito**: Monitoramento contínuo de novos uploads

**Funcionalidades**:
- 🔄 Monitora novos uploads desde a última verificação
- 📦 Agrupa por lotes de upload
- 🔍 Verifica integridade dos dados
- 💾 Salva timestamp da última verificação
- ⏰ Suporte a execução contínua

**Como usar**:

**Execução única**:
```bash
node scripts/monitor-uploads.js
```

**Monitoramento contínuo** (verifica a cada 30 segundos):
```bash
node scripts/monitor-uploads.js --watch
```

**Monitoramento contínuo com intervalo personalizado** (ex: 60 segundos):
```bash
node scripts/monitor-uploads.js --watch --interval=60
```

**Exemplo de saída com novos uploads**:
```
🔍 Monitorando uploads desde 21/09/2025, 07:35:33
============================================================
🆕 25 novos registros encontrados!

📦 1 lote(s) de upload:
   🔹 Lote: abc123-def456-ghi789
     Arquivo: dre_janeiro_2025.xlsx
     Registros: 25
     Upload: 21/09/2025, 08:45:12
     Tipos: receita - RECEITA(5), despesa - CUSTO(20)
     Total: R$ 125.450,75

🔍 Verificação de integridade:
   ✅ Todos os registros estão íntegros
```

## Configuração

Os scripts utilizam as credenciais do projeto Supabase configuradas diretamente no código:
- **URL**: `https://oomhhhfahdvavnhlbioa.supabase.co`
- **Service Role Key**: Configurada para acesso completo aos dados

## Dependências

Certifique-se de que a dependência está instalada:
```bash
npm install @supabase/supabase-js
```

## Estrutura da Tabela dre_hitss

**Campos principais**:
- `id`: Identificador único
- `upload_batch_id`: UUID do lote de upload
- `file_name`: Nome do arquivo Excel original
- `uploaded_at`: Timestamp do upload
- `tipo`: receita/despesa
- `natureza`: RECEITA/CUSTO
- `descricao`: Descrição da transação
- `valor`: Valor da transação
- `lancamento`: Valor do lançamento contábil
- `data`: Período no formato M/YYYY
- `periodo`: Período contábil
- `raw_data`: Dados originais em JSON

## Arquivos de Estado

O script de monitoramento cria um arquivo `.last-check.json` para rastrear a última verificação:
```json
{
  "lastCheck": "2025-09-21T08:35:33.123Z"
}
```

## Troubleshooting

**Erro de permissão**: Verifique se as credenciais do Supabase estão corretas

**Campos não encontrados**: A estrutura da tabela pode ter mudado - verifique os campos disponíveis

**Timeout de conexão**: Verifique a conectividade com o Supabase

## Próximos Passos

1. ✅ Migração SQL aplicada
2. ✅ Edge Function testada
3. ✅ Scripts de verificação criados
4. ✅ Monitoramento implementado
5. 🔄 **Pronto para uso em produção**

Para testar o sistema completo:
1. Faça upload de um arquivo Excel no bucket `dre_reports`
2. Execute `node scripts/monitor-uploads.js` para verificar o processamento
3. Use `node scripts/verify-dre-data.js` para análise completa dos dados