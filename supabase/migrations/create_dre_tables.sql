-- Criação das tabelas DRE necessárias

-- Tabela de categorias DRE
CREATE TABLE IF NOT EXISTS public.dre_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('receita', 'despesa')),
    parent_id UUID REFERENCES public.dre_categories(id),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relatórios DRE
CREATE TABLE IF NOT EXISTS public.dre_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens DRE
CREATE TABLE IF NOT EXISTS public.dre_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.dre_reports(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.dre_categories(id),
    description VARCHAR(500),
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dre_categories_type ON public.dre_categories(type);
CREATE INDEX IF NOT EXISTS idx_dre_categories_parent ON public.dre_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_dre_reports_period ON public.dre_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_dre_reports_status ON public.dre_reports(status);
CREATE INDEX IF NOT EXISTS idx_dre_items_report ON public.dre_items(report_id);
CREATE INDEX IF NOT EXISTS idx_dre_items_category ON public.dre_items(category_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.dre_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver categorias DRE" ON public.dre_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar categorias DRE" ON public.dre_categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver relatórios DRE" ON public.dre_reports
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar relatórios DRE" ON public.dre_reports
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver itens DRE" ON public.dre_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar itens DRE" ON public.dre_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Conceder permissões aos roles
GRANT SELECT ON public.dre_categories TO anon;
GRANT ALL PRIVILEGES ON public.dre_categories TO authenticated;

GRANT SELECT ON public.dre_reports TO anon;
GRANT ALL PRIVILEGES ON public.dre_reports TO authenticated;

GRANT SELECT ON public.dre_items TO anon;
GRANT ALL PRIVILEGES ON public.dre_items TO authenticated;

-- Inserir categorias padrão
INSERT INTO public.dre_categories (name, type, order_index) VALUES
('Receita Operacional', 'receita', 1),
('Receita de Vendas', 'receita', 2),
('Receita de Serviços', 'receita', 3),
('Custo dos Produtos Vendidos', 'despesa', 4),
('Custo dos Serviços Prestados', 'despesa', 5),
('Despesas Operacionais', 'despesa', 6),
('Despesas Administrativas', 'despesa', 7),
('Despesas Comerciais', 'despesa', 8),
('Despesas Financeiras', 'despesa', 9),
('Receitas Financeiras', 'receita', 10)
ON CONFLICT DO NOTHING;
