-- Adicionar campo 'ativo' à tabela profissionais para exclusão lógica
-- Este campo permitirá marcar profissionais como inativos em vez de deletá-los fisicamente

ALTER TABLE public.profissionais 
ADD COLUMN ativo BOOLEAN DEFAULT true;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.profissionais.ativo IS 'Indica se o profissional está ativo no sistema (exclusão lógica)';

-- Criar índice para melhorar performance nas consultas por profissionais ativos
CREATE INDEX idx_profissionais_ativo ON public.profissionais(ativo);

-- Atualizar todos os registros existentes para serem ativos por padrão
UPDATE public.profissionais SET ativo = true WHERE ativo IS NULL;