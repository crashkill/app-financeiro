-- Criar tabela para logs de execução do DRE
CREATE TABLE IF NOT EXISTS public.dre_execution_logs (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL,
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dre_execution_logs_execution_id ON public.dre_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_dre_execution_logs_step ON public.dre_execution_logs(step);
CREATE INDEX IF NOT EXISTS idx_dre_execution_logs_created_at ON public.dre_execution_logs(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.dre_execution_logs ENABLE ROW LEVEL SECURITY;

-- Conceder permissões para roles anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dre_execution_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dre_execution_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.dre_execution_logs_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.dre_execution_logs_id_seq TO authenticated;

-- Política RLS para permitir acesso completo (pode ser refinada conforme necessário)
CREATE POLICY "Allow all operations on dre_execution_logs" ON public.dre_execution_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.dre_execution_logs IS 'Tabela para armazenar logs de execução do fluxo DRE';
COMMENT ON COLUMN public.dre_execution_logs.execution_id IS 'ID único da execução do fluxo';
COMMENT ON COLUMN public.dre_execution_logs.step IS 'Nome da etapa sendo executada';
COMMENT ON COLUMN public.dre_execution_logs.status IS 'Status da etapa (INICIADO, SUCESSO, ERRO, etc.)';
COMMENT ON COLUMN public.dre_execution_logs.message IS 'Mensagem detalhada sobre a execução da etapa';
