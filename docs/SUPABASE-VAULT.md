# 🔐 Supabase Vault - Gerenciamento Seguro de Segredos

## 📋 Visão Geral

O Supabase Vault é uma solução nativa para armazenar segredos de forma criptografada no banco de dados PostgreSQL. Este documento explica como usar o Vault no projeto.

## 🚀 Configuração Inicial

### 1. Migração SQL Aplicada

A migração `20250106_setup_vault.sql` foi aplicada com sucesso, configurando:

- ✅ Extensão `supabase_vault` habilitada
- ✅ Funções de gerenciamento de segredos criadas
- ✅ Permissões configuradas para `service_role`

### 2. Segredos Migrados

Os seguintes segredos foram migrados do Doppler para o Vault:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

## 🛠️ Como Usar

### Backend (Node.js/Edge Functions)

```typescript
import { SupabaseVaultManager } from '../src/utils/supabaseVault';

// Criar instância do gerenciador
const vaultManager = new SupabaseVaultManager();

// Recuperar um segredo
const apiKey = await vaultManager.getSecret('OPENAI_API_KEY');

// Criar um novo segredo
const secretId = await vaultManager.insertSecret('NEW_API_KEY', 'valor-secreto');

// Atualizar um segredo
const updated = await vaultManager.updateSecret('API_KEY', 'novo-valor');

// Listar todos os segredos (sem valores)
const secrets = await vaultManager.listSecrets();
```

### Frontend (React)

```typescript
import { useVaultSecrets } from '../hooks/useVaultSecrets';

function MyComponent() {
  const { getSecret, listSecrets, setSecret, loading, error } = useVaultSecrets();
  
  const handleGetSecret = async () => {
    const secret = await getSecret('API_KEY');
    console.log('Segredo:', secret);
  };
  
  return (
    <div>
      <button onClick={handleGetSecret} disabled={loading}>
        Recuperar Segredo
      </button>
      {error && <p>Erro: {error}</p>}
    </div>
  );
}
```

### Edge Function (Proxy Seguro)

Para acessar segredos no frontend, use a Edge Function `vault-secrets`:

```typescript
// Recuperar segredo via Edge Function
const { data } = await supabase.functions.invoke('vault-secrets', {
  body: {
    action: 'get',
    secretName: 'API_KEY'
  }
});

console.log('Segredo:', data.secret);
```

## 📁 Estrutura de Arquivos

```
├── src/
│   ├── utils/
│   │   └── supabaseVault.ts          # Utilitários para gerenciar Vault
│   └── hooks/
│       └── useVaultSecrets.ts        # Hook React para Vault
├── supabase/
│   ├── functions/
│   │   └── vault-secrets/
│   │       └── index.ts              # Edge Function para proxy
│   └── migrations/
│       └── 20250106_setup_vault.sql  # Migração do Vault
├── scripts/
│   └── migrate-secrets.ts            # Script de migração
└── docs/
    └── SUPABASE-VAULT.md            # Esta documentação
```

## 🔧 Scripts Disponíveis

### Migrar Segredos do Doppler

```bash
# Migrar todos os segredos disponíveis
doppler run -- npx tsx scripts/migrate-secrets.ts

# Listar segredos atuais no Vault
doppler run -- npx tsx scripts/migrate-secrets.ts --list

# Ajuda
npx tsx scripts/migrate-secrets.ts --help
```

## 🔒 Segurança

### ⚠️ Regras Importantes

1. **NUNCA** use `service_role` no frontend
2. **SEMPRE** use Edge Functions para acessar segredos no frontend
3. **APENAS** usuários autenticados podem acessar segredos
4. Segredos são criptografados automaticamente pelo Vault

### 🛡️ Permissões

- **Frontend**: Acesso via Edge Function com autenticação
- **Backend**: Acesso direto com `service_role`
- **Edge Functions**: Acesso direto com `service_role`

## 📊 Funções Disponíveis

### Funções SQL Criadas

| Função | Descrição | Parâmetros |
|--------|-----------|------------|
| `insert_secret` | Criar novo segredo | `secret_name`, `secret_value` |
| `get_secret` | Recuperar segredo | `secret_name` |
| `update_secret` | Atualizar segredo | `secret_name`, `new_secret_value` |
| `delete_secret` | Deletar segredo | `secret_name` |
| `list_secrets` | Listar metadados | - |

### Classes TypeScript

| Classe | Descrição | Uso |
|--------|-----------|-----|
| `SupabaseVaultManager` | Gerenciador principal | Backend/Edge Functions |
| `DopplerToVaultMigrator` | Migração de segredos | Scripts |
| `useVaultSecrets` | Hook React | Frontend |

## 🚀 Próximos Passos

### 1. Migrar Mais Segredos

Adicione outros segredos importantes ao Doppler e execute a migração:

```bash
# Adicionar segredos no Doppler
doppler secrets set DATABASE_URL="postgresql://..."
doppler secrets set NEXTAUTH_SECRET="..."

# Migrar para o Vault
doppler run -- npx tsx scripts/migrate-secrets.ts
```

### 2. Atualizar Código Existente

Substitua acessos diretos a `process.env` por chamadas ao Vault:

```typescript
// ❌ Antes
const apiKey = process.env.OPENAI_API_KEY;

// ✅ Depois (Backend)
const apiKey = await vaultManager.getSecret('OPENAI_API_KEY');

// ✅ Depois (Frontend)
const { getSecret } = useVaultSecrets();
const apiKey = await getSecret('OPENAI_API_KEY');
```

### 3. Deploy da Edge Function

```bash
# Deploy da função vault-secrets
supabase functions deploy vault-secrets
```

### 4. Testes

```bash
# Testar acesso aos segredos
doppler run -- npm test

# Testar Edge Function
curl -X POST 'https://oomhhhfahdvavnhlbioa.supabase.co/functions/v1/vault-secrets' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"action": "list"}'
```

## 🐛 Troubleshooting

### Erro: "Configuração do Supabase incompleta"

```bash
# Verificar se as variáveis estão configuradas
doppler secrets | grep SUPABASE

# Adicionar se necessário
doppler secrets set NEXT_PUBLIC_SUPABASE_URL="..."
doppler secrets set SUPABASE_SERVICE_ROLE_KEY="..."
```

### Erro: "permission denied for table"

```sql
-- Verificar permissões
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'vault' AND grantee IN ('anon', 'authenticated');

-- Conceder permissões se necessário
GRANT ALL PRIVILEGES ON vault.secrets TO authenticated;
```

### Erro na Edge Function

```bash
# Ver logs da função
supabase functions logs vault-secrets

# Redeploy se necessário
supabase functions deploy vault-secrets
```

## 📚 Recursos Adicionais

- [Documentação Oficial do Supabase Vault](https://supabase.com/docs/guides/database/vault)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [PostgreSQL Encryption](https://www.postgresql.org/docs/current/encryption-options.html)

---

**✅ Status**: Configuração completa e funcional  
**📅 Última atualização**: Janeiro 2025  
**👨‍💻 Responsável**: SOLO Coding Agent