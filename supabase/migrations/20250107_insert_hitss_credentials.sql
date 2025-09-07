-- Inserir credenciais da HITSS no Supabase Vault
-- Esta migração adiciona as credenciais específicas para automação HITSS

-- Inserir URL base da HITSS Control
SELECT vault.create_secret(
  'https://hitsscontrol.globalhitss.com.br/',
  'hitss_base_url',
  'URL base da plataforma HITSS Control'
);

-- Inserir username da HITSS
SELECT vault.create_secret(
  'fabricio.lima',
  'hitss_username',
  'Username para login na HITSS'
);

-- Inserir senha da HITSS
SELECT vault.create_secret(
  'F4br1c10FSW@2025@',
  'hitss_password',
  'Senha para login na HITSS'
);

-- Verificar se os segredos foram criados
DO $$
DECLARE
    secret_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO secret_count
    FROM vault.decrypted_secrets
    WHERE name IN ('hitss_base_url', 'hitss_username', 'hitss_password');
    
    IF secret_count = 3 THEN
        RAISE NOTICE '✅ Credenciais HITSS inseridas com sucesso no Vault';
    ELSE
        RAISE NOTICE '⚠️ Apenas % de 3 credenciais foram inseridas', secret_count;
    END IF;
END $$;

-- Comentário sobre segurança
-- IMPORTANTE: Esta migração contém credenciais sensíveis.
-- Em produção, considere usar variáveis de ambiente ou outro método seguro.
-- As credenciais ficam criptografadas no Supabase Vault.