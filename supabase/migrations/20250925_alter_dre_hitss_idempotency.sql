-- 2025-09-25: Ajustes de idempotência e rastreabilidade na dre_hitss
-- Objetivo: adicionar colunas de idempotência/trace e índices auxiliares

-- Colunas opcionais (adicionadas apenas se não existirem)
ALTER TABLE public.dre_hitss 
  ADD COLUMN IF NOT EXISTS execution_id TEXT,
  ADD COLUMN IF NOT EXISTS upload_batch_id UUID,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS row_hash TEXT,
  ADD COLUMN IF NOT EXISTS ano INT,
  ADD COLUMN IF NOT EXISTS mes INT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_dre_hitss_ano_mes ON public.dre_hitss(ano, mes);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_file_hash ON public.dre_hitss(file_hash);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_upload_batch ON public.dre_hitss(upload_batch_id);

-- Índice único para idempotência por linha
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_dre_hitss_row_hash_unique'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX idx_dre_hitss_row_hash_unique ON public.dre_hitss(row_hash)';
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.dre_hitss.execution_id IS 'Identificador da execução do pipeline';
COMMENT ON COLUMN public.dre_hitss.upload_batch_id IS 'Lote de upload (UUID) associado ao arquivo';
COMMENT ON COLUMN public.dre_hitss.file_name IS 'Nome do arquivo de origem no Storage';
COMMENT ON COLUMN public.dre_hitss.file_hash IS 'SHA-256 do arquivo fonte';
COMMENT ON COLUMN public.dre_hitss.row_hash IS 'Hash SHA-256 da linha normalizada para idempotência';
COMMENT ON COLUMN public.dre_hitss.ano IS 'Ano extraído do período da linha';
COMMENT ON COLUMN public.dre_hitss.mes IS 'Mês (1-12) extraído do período da linha';
