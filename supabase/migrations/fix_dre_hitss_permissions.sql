-- Configurar permissões para a tabela dre_hitss
-- Este script garante que a role anon possa acessar os dados da tabela

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'dre_hitss'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Conceder permissões de leitura para a role anon
GRANT SELECT ON dre_hitss TO anon;

-- Conceder todas as permissões para a role authenticated
GRANT ALL PRIVILEGES ON dre_hitss TO authenticated;

-- Criar política RLS para permitir leitura de todos os registros ativos
DROP POLICY IF EXISTS "Allow read access to active dre_hitss records" ON dre_hitss;

CREATE POLICY "Allow read access to active dre_hitss records"
  ON dre_hitss
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- Criar política RLS para permitir leitura de todos os registros para usuários autenticados
DROP POLICY IF EXISTS "Allow full read access to authenticated users" ON dre_hitss;

CREATE POLICY "Allow full read access to authenticated users"
  ON dre_hitss
  FOR SELECT
  TO authenticated
  USING (true);

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'dre_hitss';

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'dre_hitss';

-- Verificar permissões após a configuração
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'dre_hitss'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;
