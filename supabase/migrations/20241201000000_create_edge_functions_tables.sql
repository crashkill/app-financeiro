-- Criação das tabelas necessárias para as Edge Functions

-- Tabela para armazenar transações financeiras
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_conta VARCHAR(50) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    data_transacao DATE NOT NULL,
    departamento VARCHAR(100),
    centro_custo VARCHAR(100),
    natureza VARCHAR(50) NOT NULL CHECK (natureza IN ('Receita', 'Custo', 'Despesa')),
    resumo_conta TEXT,
    descricao TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar dados de DRE
CREATE TABLE IF NOT EXISTS dados_dre (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_conta VARCHAR(50) NOT NULL,
    nome_conta VARCHAR(200) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    situacao VARCHAR(50) DEFAULT 'Ativo',
    agrupamento VARCHAR(100),
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar profissionais
CREATE TABLE IF NOT EXISTS profissionais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    departamento VARCHAR(100),
    cargo VARCHAR(100),
    salario DECIMAL(10,2),
    data_admissao DATE,
    status VARCHAR(50) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Licença', 'Demitido')),
    tipo_contrato VARCHAR(50) CHECK (tipo_contrato IN ('CLT', 'PJ', 'Terceirizado', 'Estagiário')),
    id_externo VARCHAR(100),
    dados_externos JSONB,
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sincronizado_em TIMESTAMP WITH TIME ZONE
);

-- Tabela para armazenar previsões financeiras
CREATE TABLE IF NOT EXISTS previsoes_financeiras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo_previsao VARCHAR(50) NOT NULL CHECK (tipo_previsao IN ('revenue', 'cost', 'profit', 'cashflow', 'comprehensive')),
    algoritmo VARCHAR(50) NOT NULL,
    periodos_previstos JSONB NOT NULL,
    confianca DECIMAL(5,4),
    pontos_dados_historicos INTEGER,
    metadados JSONB,
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evento VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(100),
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    usuario_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar uploads de arquivos
CREATE TABLE IF NOT EXISTS uploads_arquivos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(50) NOT NULL,
    tamanho_arquivo BIGINT,
    tipo_upload VARCHAR(50) NOT NULL CHECK (tipo_upload IN ('dre', 'financeiro', 'profissionais')),
    status VARCHAR(50) DEFAULT 'processando' CHECK (status IN ('processando', 'concluido', 'erro')),
    registros_processados INTEGER DEFAULT 0,
    registros_com_erro INTEGER DEFAULT 0,
    erros JSONB,
    metadados JSONB,
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processado_em TIMESTAMP WITH TIME ZONE
);

-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50),
    usuario_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes_financeiras(data_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_natureza ON transacoes_financeiras(natureza);
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario ON transacoes_financeiras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_codigo_conta ON transacoes_financeiras(codigo_conta);

CREATE INDEX IF NOT EXISTS idx_dre_periodo ON dados_dre(ano, mes);
CREATE INDEX IF NOT EXISTS idx_dre_codigo_conta ON dados_dre(codigo_conta);
CREATE INDEX IF NOT EXISTS idx_dre_usuario ON dados_dre(usuario_id);

CREATE INDEX IF NOT EXISTS idx_profissionais_email ON profissionais(email);
CREATE INDEX IF NOT EXISTS idx_profissionais_status ON profissionais(status);
CREATE INDEX IF NOT EXISTS idx_profissionais_departamento ON profissionais(departamento);
CREATE INDEX IF NOT EXISTS idx_profissionais_id_externo ON profissionais(id_externo);

CREATE INDEX IF NOT EXISTS idx_previsoes_tipo ON previsoes_financeiras(tipo_previsao);
CREATE INDEX IF NOT EXISTS idx_previsoes_criado_por ON previsoes_financeiras(criado_por);
CREATE INDEX IF NOT EXISTS idx_previsoes_criado_em ON previsoes_financeiras(criado_em);

CREATE INDEX IF NOT EXISTS idx_auditoria_evento ON logs_auditoria(evento);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela ON logs_auditoria(tabela_afetada);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON logs_auditoria(timestamp);

CREATE INDEX IF NOT EXISTS idx_uploads_tipo ON uploads_arquivos(tipo_upload);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads_arquivos(status);
CREATE INDEX IF NOT EXISTS idx_uploads_usuario ON uploads_arquivos(usuario_id);

-- Triggers para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON transacoes_financeiras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dre_updated_at BEFORE UPDATE ON dados_dre
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profissionais_updated_at BEFORE UPDATE ON profissionais
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes_sistema
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações padrão
INSERT INTO configuracoes_sistema (chave, valor, descricao, categoria) VALUES
('forecast_default_algorithm', '"linear_regression"', 'Algoritmo padrão para previsões financeiras', 'forecast'),
('forecast_default_periods', '12', 'Número padrão de períodos para previsão', 'forecast'),
('forecast_confidence_level', '0.95', 'Nível de confiança padrão para intervalos', 'forecast'),
('upload_max_file_size', '52428800', 'Tamanho máximo de arquivo em bytes (50MB)', 'upload'),
('sync_batch_size', '100', 'Tamanho do lote para sincronização de profissionais', 'sync'),
('audit_retention_days', '365', 'Dias de retenção para logs de auditoria', 'audit')
ON CONFLICT (chave) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE dados_dre ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE previsoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads_arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (usuários só podem ver seus próprios dados)
CREATE POLICY "Usuários podem ver suas próprias transações" ON transacoes_financeiras
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver seus próprios dados DRE" ON dados_dre
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver seus próprios profissionais" ON profissionais
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver suas próprias previsões" ON previsoes_financeiras
    FOR ALL USING (auth.uid() = criado_por);

CREATE POLICY "Usuários podem ver seus próprios logs" ON logs_auditoria
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver seus próprios uploads" ON uploads_arquivos
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver configurações do sistema" ON configuracoes_sistema
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem atualizar configurações" ON configuracoes_sistema
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Comentários nas tabelas
COMMENT ON TABLE transacoes_financeiras IS 'Armazena todas as transações financeiras do sistema';
COMMENT ON TABLE dados_dre IS 'Armazena dados do Demonstrativo de Resultado do Exercício';
COMMENT ON TABLE profissionais IS 'Armazena informações dos profissionais da empresa';
COMMENT ON TABLE previsoes_financeiras IS 'Armazena previsões financeiras geradas pelo sistema';
COMMENT ON TABLE logs_auditoria IS 'Armazena logs de auditoria de todas as operações do sistema';
COMMENT ON TABLE uploads_arquivos IS 'Armazena informações sobre uploads de arquivos processados';
COMMENT ON TABLE configuracoes_sistema IS 'Armazena configurações globais do sistema';