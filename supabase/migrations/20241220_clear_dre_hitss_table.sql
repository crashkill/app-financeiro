-- Limpar tabela dre_hitss para remover dados simulados
-- Data: 2024-12-20
-- Descrição: Remove todos os dados simulados da tabela dre_hitss para preparar para inserção dos dados reais do Excel

-- Deletar todos os registros da tabela dre_hitss
DELETE FROM dre_hitss;

-- Resetar a sequência se necessário (não aplicável para UUID)
-- Como usamos UUID, não há necessidade de resetar sequência

-- Comentário: Tabela limpa e pronta para receber dados reais do arquivo Excel dre_hitss_1758504595588.xlsx