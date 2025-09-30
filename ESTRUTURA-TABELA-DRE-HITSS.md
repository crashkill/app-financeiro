# Estrutura da Tabela DRE_HITSS

## Resumo

Este documento define a estrutura correta da tabela `dre_hitss` baseada na análise do código em `execute-dre-flow.js` (linhas 257-265).

## Problema Identificado

O sistema estava tentando inserir dados na tabela `dre_hitss` com campos que não existiam na estrutura atual da tabela, causando erros como:
- `Could not find the 'conta' column of 'dre_hitss' in the schema cache`
- `Could not find the 'execution_id' column of 'dre_hitss' in the schema cache`

## Estrutura Necessária

### Campos da Tabela

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|----------|
| `id` | BIGSERIAL | Sim (PK) | Chave primária auto-incremento |
| `execution_id` | TEXT | Sim | ID único da execução do processamento |
| `conta` | TEXT | Não | Código da conta contábil |
| `descricao` | TEXT | Não | Descrição da conta contábil |
| `valor` | DECIMAL(15,2) | Não | Valor monetário da conta |
| `tipo` | TEXT | Não | Tipo da conta (RECEITA, DESPESA, etc.) |
| `periodo` | TEXT | Não | Período de referência dos dados |
| `empresa` | TEXT | Não | Nome da empresa |
| `created_at` | TIMESTAMPTZ | Não | Data de criação (padrão: NOW()) |

### SQL de Criação

```sql
CREATE TABLE IF NOT EXISTS dre_hitss (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL,
  conta TEXT,
  descricao TEXT,
  valor DECIMAL(15,2),
  tipo TEXT,
  periodo TEXT,
  empresa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dre_hitss_execution_id ON dre_hitss(execution_id);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_empresa ON dre_hitss(empresa);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_periodo ON dre_hitss(periodo);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_created_at ON dre_hitss(created_at);

-- Comentários para documentação
COMMENT ON TABLE dre_hitss IS 'Tabela para armazenar dados do DRE processados pelo sistema HITSS';
COMMENT ON COLUMN dre_hitss.execution_id IS 'ID único da execução do processamento';
COMMENT ON COLUMN dre_hitss.conta IS 'Código da conta contábil';
COMMENT ON COLUMN dre_hitss.descricao IS 'Descrição da conta contábil';
COMMENT ON COLUMN dre_hitss.valor IS 'Valor monetário da conta';
COMMENT ON COLUMN dre_hitss.tipo IS 'Tipo da conta (RECEITA, DESPESA, etc.)';
COMMENT ON COLUMN dre_hitss.periodo IS 'Período de referência dos dados';
COMMENT ON COLUMN dre_hitss.empresa IS 'Nome da empresa';
```

## Regras de Inserção

### Formato dos Dados

Baseado no código `execute-dre-flow.js`, os dados são inseridos no seguinte formato:

```javascript
const insertData = fileData.registros.map(registro => ({
  execution_id: this.executionId,
  conta: registro.conta,
  descricao: registro.descricao,
  valor: registro.valor,
  tipo: registro.tipo,
  periodo: fileData.periodo,
  empresa: fileData.empresa,
  created_at: new Date().toISOString()
}));
```

### Exemplo de Dados

```json
{
  "execution_id": "exec_20241201_123456",
  "conta": "1.01.001",
  "descricao": "Receita de Vendas",
  "valor": 1000.50,
  "tipo": "RECEITA",
  "periodo": "2024-12",
  "empresa": "HITSS",
  "created_at": "2024-12-01T10:30:00.000Z"
}
```

## Instruções de Implementação

### 1. Criar a Tabela

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Cole o SQL de criação acima
4. Execute o comando

### 2. Verificar a Criação

Após criar a tabela, você pode verificar se foi criada corretamente:

```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'dre_hitss' 
ORDER BY ordinal_position;

-- Testar inserção
INSERT INTO dre_hitss (
  execution_id, conta, descricao, valor, tipo, periodo, empresa
) VALUES (
  'test_exec_001', '1.01.001', 'Teste de Receita', 1000.00, 'RECEITA', '2024-12', 'HITSS'
);

-- Verificar dados inseridos
SELECT * FROM dre_hitss WHERE execution_id = 'test_exec_001';

-- Limpar dados de teste
DELETE FROM dre_hitss WHERE execution_id = 'test_exec_001';
```

### 3. Configurar Permissões

Certifique-se de que as permissões estão configuradas corretamente:

```sql
-- Permitir inserção, seleção, atualização e exclusão para usuários autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON dre_hitss TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dre_hitss TO service_role;
```

## Arquivos Relacionados

- `execute-dre-flow.js` - Contém a lógica de inserção dos dados
- `create-dre-hitss-table.js` - Script para criar a tabela (teste)
- `create-table-via-mcp.js` - Script de documentação da estrutura

## Status

- ✅ Estrutura da tabela identificada
- ✅ SQL de criação documentado
- ✅ Regras de inserção documentadas
- ⏳ **PENDENTE**: Criação da tabela no Supabase Dashboard
- ⏳ **PENDENTE**: Teste de inserção após criação

## Próximos Passos

1. **Criar a tabela** usando o SQL fornecido no Supabase Dashboard
2. **Testar a inserção** executando o `execute-dre-flow.js`
3. **Verificar os dados** na tabela após o processamento
4. **Configurar backups** e políticas de retenção se necessário

---

**Data de Criação**: 2024-12-01  
**Última Atualização**: 2024-12-01  
**Responsável**: Sistema de Análise Automática