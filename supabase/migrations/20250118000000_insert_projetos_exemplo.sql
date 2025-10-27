-- Inserir projetos de exemplo para teste do filtro
INSERT INTO projetos (nome, cliente, status, data_inicio, data_fim, valor_total, descricao, responsavel) VALUES
('Sistema de Gestão Financeira', 'HITSS Brasil', 'ativo', '2024-01-15', '2024-12-31', 500000.00, 'Desenvolvimento de sistema completo de gestão financeira', 'João Silva'),
('Portal do Cliente', 'Empresa ABC', 'ativo', '2024-02-01', '2024-08-30', 250000.00, 'Portal web para atendimento ao cliente', 'Maria Santos'),
('App Mobile Vendas', 'Varejo XYZ', 'ativo', '2024-03-10', '2024-10-15', 180000.00, 'Aplicativo mobile para força de vendas', 'Pedro Costa'),
('Sistema ERP', 'Indústria 123', 'ativo', '2024-01-20', '2024-11-30', 750000.00, 'Implementação de sistema ERP completo', 'Ana Oliveira'),
('E-commerce Platform', 'Loja Online', 'ativo', '2024-04-01', '2024-09-30', 320000.00, 'Plataforma de e-commerce com integração de pagamentos', 'Carlos Lima'),
('Sistema de RH', 'Corporação DEF', 'ativo', '2024-02-15', '2024-07-31', 150000.00, 'Sistema de gestão de recursos humanos', 'Lucia Ferreira'),
('Dashboard Analytics', 'Tech Startup', 'ativo', '2024-05-01', '2024-08-15', 95000.00, 'Dashboard de analytics e relatórios', 'Roberto Alves'),
('Sistema de Estoque', 'Distribuidora GHI', 'ativo', '2024-03-01', '2024-12-15', 280000.00, 'Sistema de controle de estoque e logística', 'Fernanda Rocha')
ON CONFLICT (nome) DO NOTHING;