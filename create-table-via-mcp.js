// Script para criar a tabela dre_hitss via MCP do Supabase
// Este script documenta a estrutura necessária baseada no execute-dre-flow.js

console.log('📋 ESTRUTURA DA TABELA DRE_HITSS');
console.log('=====================================');
console.log('');
console.log('Baseado na análise do arquivo execute-dre-flow.js (linhas 257-265),');
console.log('a tabela dre_hitss deve ter a seguinte estrutura:');
console.log('');
console.log('CAMPOS OBRIGATÓRIOS:');
console.log('- execution_id (TEXT) - ID único da execução');
console.log('- conta (TEXT) - Código da conta contábil');
console.log('- descricao (TEXT) - Descrição da conta');
console.log('- valor (DECIMAL) - Valor monetário');
console.log('- tipo (TEXT) - Tipo da conta (RECEITA, DESPESA, etc.)');
console.log('- periodo (TEXT) - Período de referência');
console.log('- empresa (TEXT) - Nome da empresa');
console.log('- created_at (TIMESTAMPTZ) - Data de criação');
console.log('');
console.log('SQL PARA CRIAÇÃO:');
console.log('==================');

const createTableSQL = `
CREATE TABLE IF NOT EXISTS dre_hitss (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL,
  conta TEXT,
  descricao TEXT,
  valor DECIMAL(15,2),
  tipo TEXT,
  periodo TEXT,
  empresa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dre_hitss_execution_id ON dre_hitss(execution_id);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_empresa ON dre_hitss(empresa);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_periodo ON dre_hitss(periodo);
CREATE INDEX IF NOT EXISTS idx_dre_hitss_created_at ON dre_hitss(created_at);

-- Comentários para documentação
COMMENT ON TABLE dre_hitss IS 'Tabela para armazenar dados do DRE processados pelo sistema HITSS';
COMMENT ON COLUMN dre_hitss.execution_id IS 'ID único da execução do processamento';
COMMENT ON COLUMN dre_hitss.conta IS 'Código da conta contábil';
COMMENT ON COLUMN dre_hitss.descricao IS 'Descrição da conta contábil';
COMMENT ON COLUMN dre_hitss.valor IS 'Valor monetário da conta';
COMMENT ON COLUMN dre_hitss.tipo IS 'Tipo da conta (RECEITA, DESPESA, etc.)';
COMMENT ON COLUMN dre_hitss.periodo IS 'Período de referência dos dados';
COMMENT ON COLUMN dre_hitss.empresa IS 'Nome da empresa';
`;

console.log(createTableSQL);
console.log('');
console.log('INSTRUÇÕES:');
console.log('============');
console.log('1. Acesse o Supabase Dashboard');
console.log('2. Vá para SQL Editor');
console.log('3. Cole o SQL acima');
console.log('4. Execute o comando');
console.log('');
console.log('EXEMPLO DE DADOS:');
console.log('=================');

const exemploData = {
  execution_id: 'exec_20241201_123456',
  conta: '1.01.001',
  descricao: 'Receita de Vendas',
  valor: 1000.50,
  tipo: 'RECEITA',
  periodo: '2024-12',
  empresa: 'HITSS',
  created_at: new Date().toISOString()
};

console.log(JSON.stringify(exemploData, null, 2));
console.log('');
console.log('✅ Documentação da estrutura da tabela dre_hitss concluída!');
console.log('📋 Use as informações acima para criar a tabela no Supabase Dashboard.');