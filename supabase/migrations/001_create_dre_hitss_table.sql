-- =====================================================
-- MIGRAÇÃO 001 (COMPLETA): Criação da Tabela DRE HITSS
-- Schema completo baseado no Cloud
-- =====================================================

DROP TABLE IF EXISTS public.dre_hitss CASCADE;

CREATE TABLE public.dre_hitss (
  id uuid not null default gen_random_uuid (),
  projeto character varying(255) not null,
  ano integer not null,
  mes integer not null,
  conta character varying(255) not null,
  descricao text null,
  natureza character varying(20) not null,
  tipo character varying(30) not null,
  valor numeric(15, 2) not null default 0.00,
  observacoes text null,
  data_criacao timestamp with time zone null default CURRENT_TIMESTAMP,
  data_atualizacao timestamp with time zone null default CURRENT_TIMESTAMP,
  usuario_criacao uuid null,
  usuario_atualizacao uuid null,
  ativo boolean null default true,
  metadata jsonb null default '{}'::jsonb,
  tipo_conta character varying(20) null,
  receita_total numeric(15, 2) null default 0,
  custo_total numeric(15, 2) null default 0,
  desoneracao numeric(15, 2) null default 0,
  custo_clt numeric(15, 2) null default 0,
  custo_outros numeric(15, 2) null default 0,
  custo_subcontratados numeric(15, 2) null default 0,
  relatorio character varying(255) null,
  cliente character varying(255) null,
  linha_negocio character varying(255) null,
  responsavel_area character varying(255) null,
  responsavel_delivery character varying(255) null,
  responsavel_devengado character varying(255) null,
  id_homs character varying(255) null,
  codigo_projeto character varying(255) null,
  filial_faturamento character varying(255) null,
  imposto character varying(255) null,
  conta_resumo character varying(255) null,
  denominacao_conta text null,
  id_recurso character varying(255) null,
  recurso character varying(255) null,
  lancamento numeric null,
  periodo character varying(255) null,
  execution_id text null,
  upload_batch_id uuid null,
  file_name text null,
  file_hash text null,
  row_hash text null,
  constraint dre_hitss_pkey primary key (id),
  constraint dre_hitss_mes_check check (
    (
      (mes >= 1)
      and (mes <= 12)
    )
  ),
  constraint dre_hitss_natureza_check check (
    (
      (natureza)::text = any (
        (
          array[
            'RECEITA'::character varying,
            'DESPESA'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint dre_hitss_tipo_check check (
    (
      (tipo)::text = any (
        (
          array[
            'OPERACIONAL'::character varying,
            'NAO_OPERACIONAL'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint dre_hitss_tipo_conta_check check (
    (
      (tipo_conta)::text = any (
        (
          array[
            'Receita'::character varying,
            'Custo'::character varying,
            'Despesa'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

-- Índices
create index IF not exists idx_dre_hitss_projeto_ano_mes on public.dre_hitss using btree (projeto, ano, mes) TABLESPACE pg_default;
create index IF not exists idx_dre_hitss_natureza on public.dre_hitss using btree (natureza) TABLESPACE pg_default;
create index IF not exists idx_dre_hitss_tipo on public.dre_hitss using btree (tipo) TABLESPACE pg_default;
create index IF not exists idx_dre_hitss_tipo_conta on public.dre_hitss using btree (tipo_conta) TABLESPACE pg_default;
create index IF not exists idx_dre_hitss_ativo on public.dre_hitss using btree (ativo) TABLESPACE pg_default where (ativo = true);
create index IF not exists idx_dre_hitss_financial_composite on public.dre_hitss using btree (projeto, ano, mes, natureza, tipo) TABLESPACE pg_default where (ativo = true);
create index IF not exists idx_dre_hitss_valor_filter on public.dre_hitss using btree (valor) TABLESPACE pg_default where (valor <> (0)::numeric);
create index IF not exists idx_dre_hitss_aggregation on public.dre_hitss using btree (projeto, ano, natureza, valor) TABLESPACE pg_default where (ativo = true);
create index IF not exists idx_dre_hitss_ano_mes on public.dre_hitss using btree (ano, mes) TABLESPACE pg_default;
create index IF not exists idx_dre_hitss_file_hash on public.dre_hitss using btree (file_hash) TABLESPACE pg_default;
create index IF not exists idx_dre_hitss_upload_batch on public.dre_hitss using btree (upload_batch_id) TABLESPACE pg_default;
create unique INDEX IF not exists idx_dre_hitss_row_hash_unique on public.dre_hitss using btree (row_hash) TABLESPACE pg_default;

-- RLS
ALTER TABLE public.dre_hitss ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem acessar dre_hitss" ON public.dre_hitss
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Service role acesso total dre_hitss" ON public.dre_hitss
    FOR ALL USING (auth.role() = 'service_role');

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dre_hitss TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dre_hitss TO service_role;
GRANT SELECT ON public.dre_hitss TO anon;

-- Log
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dre_hitss' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela dre_hitss criada com sucesso!';
    ELSE
        RAISE EXCEPTION 'Erro ao criar tabela dre_hitss';
    END IF;
END $$;
