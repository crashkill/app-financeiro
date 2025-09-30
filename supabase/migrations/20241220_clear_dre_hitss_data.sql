-- Limpar dados simulados da tabela dre_hitss
-- Para permitir inserção dos dados reais do arquivo Excel

DELETE FROM dre_hitss;

-- Reset da sequência se houver
-- (não aplicável para UUID, mas mantemos para compatibilidade)

-- Comentário sobre a operação
COMMENT ON TABLE dre_hitss IS 'Tabela DRE HITSS limpa e pronta para dados reais do arquivo Excel';