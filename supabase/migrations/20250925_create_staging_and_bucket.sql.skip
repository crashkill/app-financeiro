-- 2025-09-25: Staging DRE e bucket de Storage dre_reports

-- Tabela de staging para manter linha a linha do Excel
CREATE TABLE IF NOT EXISTS public.stg_dre_hitss_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  row_number INT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (file_hash, row_number)
);

COMMENT ON TABLE public.stg_dre_hitss_raw IS 'Staging row-by-row do Excel HITSS';
COMMENT ON COLUMN public.stg_dre_hitss_raw.payload IS 'Linha bruta do Excel normalizada em JSON';

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS ix_stg_dre_execution_id ON public.stg_dre_hitss_raw(execution_id);
CREATE INDEX IF NOT EXISTS ix_stg_dre_file_hash ON public.stg_dre_hitss_raw(file_hash);

-- Criar bucket de Storage para recepção de arquivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('dre_reports', 'dre_reports', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Políticas básicas (leitura autenticada, gravação via service_role)
DROP POLICY IF EXISTS "dre_reports_select_authenticated" ON storage.objects;
CREATE POLICY "dre_reports_select_authenticated"
ON storage.objects FOR SELECT TO authenticated, service_role
USING (bucket_id = 'dre_reports');

DROP POLICY IF EXISTS "dre_reports_insert_service_role" ON storage.objects;
CREATE POLICY "dre_reports_insert_service_role"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'dre_reports');

DROP POLICY IF EXISTS "dre_reports_update_service_role" ON storage.objects;
CREATE POLICY "dre_reports_update_service_role"
ON storage.objects FOR UPDATE TO service_role
USING (bucket_id = 'dre_reports')
WITH CHECK (bucket_id = 'dre_reports');

DROP POLICY IF EXISTS "dre_reports_delete_service_role" ON storage.objects;
CREATE POLICY "dre_reports_delete_service_role"
ON storage.objects FOR DELETE TO service_role
USING (bucket_id = 'dre_reports');
