-- Migration para adicionar SUPABASE_SERVICE_ROLE_KEY ao Vault
-- Data: 2025-01-07
-- Descrição: Adiciona a chave service_role ao Vault para uso na automação

-- Inserir SUPABASE_SERVICE_ROLE_KEY no Vault
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E',
  'SUPABASE_SERVICE_ROLE_KEY',
  'Chave service_role do Supabase para automação HITSS'
);

-- Verificar se o segredo foi criado
DO $$
DECLARE
    key_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM vault.decrypted_secrets 
        WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
    ) INTO key_exists;
    
    IF key_exists THEN
        RAISE NOTICE '✅ SUPABASE_SERVICE_ROLE_KEY adicionada com sucesso ao Vault';
    ELSE
        RAISE NOTICE '❌ Falha ao adicionar SUPABASE_SERVICE_ROLE_KEY ao Vault';
    END IF;
END $$;

-- Comentário sobre segurança
-- IMPORTANTE: Esta chave permite acesso total ao banco de dados.
-- Ela é necessária para que a automação funcione via cron job.
-- A chave fica criptografada no Supabase Vault.