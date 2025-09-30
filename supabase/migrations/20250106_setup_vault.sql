-- Configurar Supabase Vault para gerenciar segredos
-- Esta migração habilita o Supabase Vault e cria funções para gerenciar segredos

-- Habilitar a extensão Supabase Vault
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Verificar se a view decrypted_secrets existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'vault' 
        AND table_name = 'decrypted_secrets'
    ) THEN
        RAISE NOTICE 'Supabase Vault configurado com sucesso. View vault.decrypted_secrets disponível.';
    ELSE
        RAISE NOTICE 'Erro: View vault.decrypted_secrets não encontrada após habilitar extensão.';
    END IF;
END $$;

-- Criar função para inserir segredos de forma segura
CREATE OR REPLACE FUNCTION public.insert_secret(
    secret_name TEXT,
    secret_value TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário tem permissão (service_role)
    IF current_setting('role') != 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: apenas service_role pode inserir segredos';
    END IF;
    
    -- Usar a função nativa do Vault para criar o segredo
    RETURN vault.create_secret(secret_value, secret_name);
END;
$$;

-- Criar função para recuperar segredos
CREATE OR REPLACE FUNCTION public.get_secret(
    secret_name TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    secret_value TEXT;
BEGIN
    -- Verificar se o usuário tem permissão (service_role)
    IF current_setting('role') != 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: apenas service_role pode acessar segredos';
    END IF;
    
    -- Buscar o segredo descriptografado
    SELECT decrypted_secret INTO secret_value
    FROM vault.decrypted_secrets
    WHERE name = secret_name;
    
    RETURN secret_value;
END;
$$;

-- Criar função para atualizar segredos
CREATE OR REPLACE FUNCTION public.update_secret(
    secret_name TEXT,
    new_secret_value TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    secret_id UUID;
    rows_affected INTEGER;
BEGIN
    -- Verificar se o usuário tem permissão (service_role)
    IF current_setting('role') != 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: apenas service_role pode atualizar segredos';
    END IF;
    
    -- Buscar o ID do segredo
    SELECT id INTO secret_id
    FROM vault.secrets
    WHERE name = secret_name;
    
    IF secret_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar o segredo
    UPDATE vault.secrets 
    SET secret = new_secret_value, updated_at = CURRENT_TIMESTAMP
    WHERE id = secret_id;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$;

-- Criar função para deletar segredos
CREATE OR REPLACE FUNCTION public.delete_secret(
    secret_name TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    -- Verificar se o usuário tem permissão (service_role)
    IF current_setting('role') != 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: apenas service_role pode deletar segredos';
    END IF;
    
    DELETE FROM vault.secrets WHERE name = secret_name;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$;

-- Criar função para listar todos os segredos (sem valores)
CREATE OR REPLACE FUNCTION public.list_secrets()
RETURNS TABLE(
    id UUID,
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário tem permissão (service_role)
    IF current_setting('role') != 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: apenas service_role pode listar segredos';
    END IF;
    
    RETURN QUERY
    SELECT s.id, s.name, s.description, s.created_at, s.updated_at
    FROM vault.secrets s
    ORDER BY s.name;
END;
$$;

-- Comentários para documentação
COMMENT ON FUNCTION public.insert_secret IS 'Insere um novo segredo no Supabase Vault';
COMMENT ON FUNCTION public.get_secret IS 'Recupera um segredo descriptografado pelo nome';
COMMENT ON FUNCTION public.update_secret IS 'Atualiza um segredo existente';
COMMENT ON FUNCTION public.delete_secret IS 'Remove um segredo do Vault';
COMMENT ON FUNCTION public.list_secrets IS 'Lista todos os segredos (sem valores)';

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Supabase Vault configurado com sucesso!';
    RAISE NOTICE 'Funções disponíveis:';
    RAISE NOTICE '- public.insert_secret(name, value)';
    RAISE NOTICE '- public.get_secret(name)';
    RAISE NOTICE '- public.update_secret(name, new_value)';
    RAISE NOTICE '- public.delete_secret(name)';
    RAISE NOTICE '- public.list_secrets()';
END $$;