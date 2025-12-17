-- =====================================================
-- SCRIPT: Expor Supabase Vault via API RPC
-- Execute este SQL no Supabase Studio ou via psql
-- URL: https://supabase.fsw-hitss.duckdns.org
-- =====================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgsodium;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- 2. Verificar se o schema vault existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'vault') THEN
    RAISE EXCEPTION 'Schema vault não existe. Verifique a instalação do Supabase.';
  END IF;
END $$;

-- 3. Criar funções RPC para expor o Vault

-- Função para inserir um segredo
CREATE OR REPLACE FUNCTION public.insert_secret(
  secret_name TEXT,
  secret_value TEXT,
  secret_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Verificar se o chamador tem role de service_role
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado. Requer service_role.';
  END IF;

  -- Inserir o segredo no vault
  SELECT vault.create_secret(secret_value, secret_name, secret_description) INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Função para recuperar um segredo
CREATE OR REPLACE FUNCTION public.get_secret(secret_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  -- Verificar se o chamador tem role de service_role
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado. Requer service_role.';
  END IF;

  -- Buscar o segredo pelo nome
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;
  
  RETURN secret_value;
END;
$$;

-- Função para atualizar um segredo
CREATE OR REPLACE FUNCTION public.update_secret(
  secret_name TEXT,
  new_secret_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_id UUID;
BEGIN
  -- Verificar se o chamador tem role de service_role
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado. Requer service_role.';
  END IF;

  -- Buscar o ID do segredo
  SELECT id INTO secret_id
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;
  
  IF secret_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Atualizar o segredo
  PERFORM vault.update_secret(secret_id, new_secret_value);
  
  RETURN TRUE;
END;
$$;

-- Função para deletar um segredo
CREATE OR REPLACE FUNCTION public.delete_secret(secret_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Verificar se o chamador tem role de service_role
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado. Requer service_role.';
  END IF;

  -- Deletar o segredo pelo nome
  DELETE FROM vault.secrets WHERE name = secret_name;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;

-- Função para listar segredos (apenas metadados, sem valores)
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
  -- Verificar se o chamador tem role de service_role
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado. Requer service_role.';
  END IF;

  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.created_at,
    s.updated_at
  FROM vault.secrets s
  ORDER BY s.name;
END;
$$;

-- 4. Conceder permissões às funções
GRANT EXECUTE ON FUNCTION public.insert_secret(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_secret(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_secret(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_secret(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_secrets() TO service_role;

-- 5. Verificar instalação
DO $$
BEGIN
  RAISE NOTICE '✅ Vault RPC Functions criadas com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE 'Funções disponíveis:';
  RAISE NOTICE '  - insert_secret(name, value, description)';
  RAISE NOTICE '  - get_secret(name)';
  RAISE NOTICE '  - update_secret(name, new_value)';
  RAISE NOTICE '  - delete_secret(name)';
  RAISE NOTICE '  - list_secrets()';
  RAISE NOTICE '';
  RAISE NOTICE 'Uso via API (requer service_role key):';
  RAISE NOTICE '  POST /rest/v1/rpc/insert_secret';
  RAISE NOTICE '  POST /rest/v1/rpc/get_secret';
END $$;
