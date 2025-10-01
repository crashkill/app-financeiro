-- Script de Teste para Automação HITSS
-- Execute este script no SQL Editor do Supabase para testar a automação

-- 1. Verificar se as tabelas foram criadas corretamente
SELECT 'Verificando tabelas...' as status;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('hitss_data', 'hitss_automation_executions', 'hitss_automation_logs') 
        THEN 'Existe ✅'
        ELSE 'Não encontrada ❌'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%hitss%'
ORDER BY table_name;

-- 2. Verificar se o pg_cron está habilitado
SELECT 'Verificando pg_cron...' as status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') 
        THEN 'pg_cron habilitado ✅'
        ELSE 'pg_cron não encontrado ❌'
    END as pg_cron_status;

-- 3. Verificar se as funções foram criadas
SELECT 'Verificando funções...' as status;

SELECT 
    routine_name,
    'Função criada ✅' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%hitss%'
ORDER BY routine_name;

-- 4. Verificar credenciais no Vault (sem mostrar valores)
SELECT 'Verificando credenciais no Vault...' as status;

SELECT 
    name,
    CASE 
        WHEN name IS NOT NULL THEN 'Configurado ✅'
        ELSE 'Não configurado ❌'
    END as status,
    created_at
FROM vault.secrets 
WHERE name IN ('hitss_username', 'hitss_password', 'hitss_base_url')
ORDER BY name;

-- 5. Verificar status do cron job
SELECT 'Verificando cron jobs...' as status;

SELECT * FROM get_hitss_cron_status();

-- 6. Verificar permissões das tabelas
SELECT 'Verificando permissões...' as status;

SELECT 
    grantee,
    table_name,
    privilege_type,
    'Permissão configurada ✅' as status
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name LIKE '%hitss%'
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 7. Inserir dados de teste para verificar estrutura
SELECT 'Inserindo dados de teste...' as status;

INSERT INTO hitss_automation_executions (
    id,
    status,
    started_at,
    records_processed,
    error_message
) VALUES (
    gen_random_uuid(),
    'completed',
    NOW(),
    0,
    'Teste de estrutura da tabela'
);

INSERT INTO hitss_automation_logs (
    execution_id,
    level,
    message,
    context
) VALUES (
    gen_random_uuid(),
    'info',
    'Teste de log da automação',
    jsonb_build_object(
        'test', true,
        'timestamp', NOW(),
        'component', 'test-script'
    )
);

-- 8. Verificar se os dados de teste foram inseridos
SELECT 'Verificando inserção de dados...' as status;

SELECT 
    'hitss_automation_executions' as tabela,
    COUNT(*) as registros
FROM hitss_automation_executions
UNION ALL
SELECT 
    'hitss_automation_logs' as tabela,
    COUNT(*) as registros
FROM hitss_automation_logs
UNION ALL
SELECT 
    'hitss_data' as tabela,
    COUNT(*) as registros
FROM hitss_data;

-- 9. Testar função de limpeza de logs
SELECT 'Testando função de limpeza...' as status;

SELECT cleanup_old_logs() as resultado_limpeza;

-- 10. Testar função de estatísticas
SELECT 'Testando função de estatísticas...' as status;

SELECT get_automation_stats() as estatisticas;

-- 11. Verificar configurações do projeto
SELECT 'Verificando configurações do projeto...' as status;

SELECT 
    name,
    setting,
    CASE 
        WHEN setting IS NOT NULL AND setting != '' 
        THEN 'Configurado ✅'
        ELSE 'Não configurado ❌'
    END as status
FROM pg_settings 
WHERE name LIKE 'app.%'
ORDER BY name;

-- 12. Resumo do teste
SELECT 'RESUMO DO TESTE' as status;

WITH test_results AS (
    SELECT 
        'Tabelas' as componente,
        CASE 
            WHEN COUNT(*) >= 3 THEN 'OK ✅'
            ELSE 'Erro ❌'
        END as status
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%hitss%'
    
    UNION ALL
    
    SELECT 
        'Funções' as componente,
        CASE 
            WHEN COUNT(*) >= 4 THEN 'OK ✅'
            ELSE 'Erro ❌'
        END as status
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE '%hitss%'
    
    UNION ALL
    
    SELECT 
        'pg_cron' as componente,
        CASE 
            WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') 
            THEN 'OK ✅'
            ELSE 'Erro ❌'
        END as status
    
    UNION ALL
    
    SELECT 
        'Credenciais Vault' as componente,
        CASE 
            WHEN COUNT(*) >= 3 THEN 'OK ✅'
            ELSE 'Configurar ⚠️'
        END as status
    FROM vault.secrets 
    WHERE name IN ('hitss_username', 'hitss_password', 'hitss_base_url')
)
SELECT * FROM test_results;

-- 13. Próximos passos
SELECT 'PRÓXIMOS PASSOS' as status;

SELECT 
    'Para completar a configuração:' as instrucao
UNION ALL
SELECT '1. Configure as credenciais no Supabase Vault (ver VAULT_SETUP.md)'
UNION ALL
SELECT '2. Configure as variáveis do projeto (app.project_url e app.service_role_key)'
UNION ALL
SELECT '3. Teste a execução manual: SELECT call_hitss_automation();'
UNION ALL
SELECT '4. Monitore os logs: SELECT * FROM hitss_automation_logs ORDER BY created_at DESC;'
UNION ALL
SELECT '5. Verifique o cron job: SELECT * FROM get_hitss_cron_status();';

-- Limpar dados de teste
DELETE FROM hitss_automation_executions WHERE error_message = 'Teste de estrutura da tabela';
DELETE FROM hitss_automation_logs WHERE message = 'Teste de log da automação';

SELECT 'Teste concluído! Dados de teste removidos.' as status;