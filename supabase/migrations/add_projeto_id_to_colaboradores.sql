-- Adicionar campo projeto_id na tabela colaboradores
ALTER TABLE colaboradores 
ADD COLUMN projeto_id bigint REFERENCES projetos(id);

-- Adicionar índice para melhor performance
CREATE INDEX idx_colaboradores_projeto_id ON colaboradores(projeto_id);

-- Comentário para documentar o campo
COMMENT ON COLUMN colaboradores.projeto_id IS 'ID do projeto ao qual o colaborador está vinculado';
