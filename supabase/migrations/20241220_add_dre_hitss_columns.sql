-- Adicionar colunas necessárias para o arquivo DRE HITSS
-- Baseado no mapeamento em MAPEAMENTO.md

ALTER TABLE dre_hitss 
ADD COLUMN IF NOT EXISTS relatorio VARCHAR(255),
ADD COLUMN IF NOT EXISTS cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS linha_negocio VARCHAR(255),
ADD COLUMN IF NOT EXISTS responsavel_area VARCHAR(255),
ADD COLUMN IF NOT EXISTS responsavel_delivery VARCHAR(255),
ADD COLUMN IF NOT EXISTS responsavel_devengado VARCHAR(255),
ADD COLUMN IF NOT EXISTS id_homs VARCHAR(255),
ADD COLUMN IF NOT EXISTS codigo_projeto VARCHAR(255),
ADD COLUMN IF NOT EXISTS filial_faturamento VARCHAR(255),
ADD COLUMN IF NOT EXISTS imposto VARCHAR(255),
ADD COLUMN IF NOT EXISTS conta_resumo VARCHAR(255),
ADD COLUMN IF NOT EXISTS denominacao_conta TEXT,
ADD COLUMN IF NOT EXISTS id_recurso VARCHAR(255),
ADD COLUMN IF NOT EXISTS recurso VARCHAR(255),
ADD COLUMN IF NOT EXISTS lancamento NUMERIC,
ADD COLUMN IF NOT EXISTS periodo VARCHAR(255);

-- Comentários para documentar as colunas
COMMENT ON COLUMN dre_hitss.relatorio IS 'Relatório de origem dos dados';
COMMENT ON COLUMN dre_hitss.cliente IS 'Nome do cliente';
COMMENT ON COLUMN dre_hitss.linha_negocio IS 'Linha de negócio';
COMMENT ON COLUMN dre_hitss.responsavel_area IS 'Responsável pela área';
COMMENT ON COLUMN dre_hitss.responsavel_delivery IS 'Responsável pelo delivery';
COMMENT ON COLUMN dre_hitss.responsavel_devengado IS 'Responsável pelo devengado';
COMMENT ON COLUMN dre_hitss.id_homs IS 'ID HOMS';
COMMENT ON COLUMN dre_hitss.codigo_projeto IS 'Código do projeto';
COMMENT ON COLUMN dre_hitss.filial_faturamento IS 'Filial de faturamento';
COMMENT ON COLUMN dre_hitss.imposto IS 'Informações de imposto';
COMMENT ON COLUMN dre_hitss.conta_resumo IS 'Resumo da conta';
COMMENT ON COLUMN dre_hitss.denominacao_conta IS 'Denominação da conta';
COMMENT ON COLUMN dre_hitss.id_recurso IS 'ID do recurso';
COMMENT ON COLUMN dre_hitss.recurso IS 'Nome do recurso';
COMMENT ON COLUMN dre_hitss.lancamento IS 'Valor do lançamento';
COMMENT ON COLUMN dre_hitss.periodo IS 'Período de referência';

-- Atualizar comentário da tabela
COMMENT ON TABLE dre_hitss IS 'Tabela DRE HITSS com estrutura completa para dados do arquivo Excel';