-- Criação da tabela dre_hitss com estrutura completa
create table public.dre_hitss ( 
   id serial not null, 
   upload_batch_id uuid not null, 
   file_name text not null, 
   uploaded_at timestamp without time zone null default now(), 
   tipo character varying(20) not null, 
   natureza character varying(20) not null, 
   descricao text not null, 
   valor numeric(15, 2) not null, 
   data text not null, 
   categoria text null, 
   observacao text null, 
   lancamento numeric(15, 2) not null, 
   projeto text null, 
   periodo character varying(10) null, 
   denominacao_conta text null, 
   conta_resumo text null, 
   linha_negocio text null, 
   relatorio text null, 
   raw_data jsonb null, 
   created_at timestamp without time zone null default now(), 
   updated_at timestamp without time zone null default now(), 
   constraint dre_hitss_pkey primary key (id), 
   constraint dre_hitss_natureza_check check ( 
     ( 
       (natureza)::text = any ( 
         array[ 
           ('RECEITA'::character varying)::text, 
           ('CUSTO'::character varying)::text 
         ] 
       ) 
     ) 
   ), 
   constraint dre_hitss_tipo_check check ( 
     ( 
       (tipo)::text = any ( 
         array[ 
           ('receita'::character varying)::text, 
           ('despesa'::character varying)::text 
         ] 
       ) 
     ) 
   ) 
 ) TABLESPACE pg_default; 
 
-- Criação dos índices
create index IF not exists idx_dre_batch on public.dre_hitss using btree (upload_batch_id) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_conta_resumo on public.dre_hitss using btree (conta_resumo) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_hitss_batch on public.dre_hitss using btree (upload_batch_id) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_hitss_conta_resumo on public.dre_hitss using btree (conta_resumo) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_hitss_data on public.dre_hitss using btree (data) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_hitss_financeiro on public.dre_hitss using btree (tipo, natureza, periodo, projeto) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_hitss_natureza on public.dre_hitss using btree (natureza) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_hitss_periodo on public.dre_hitss using btree (periodo) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_hitss_projeto on public.dre_hitss using btree (projeto) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_hitss_tipo on public.dre_hitss using btree (tipo) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_hitss_valor on public.dre_hitss using btree (valor) TABLESPACE pg_default 
 where 
   (valor <> (0)::numeric); 
 
create index IF not exists idx_dre_natureza on public.dre_hitss using btree (natureza) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_periodo on public.dre_hitss using btree (periodo) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_projeto on public.dre_hitss using btree (projeto) TABLESPACE pg_default; 
 
create index IF not exists idx_dre_tipo on public.dre_hitss using btree (tipo) TABLESPACE pg_default; 
 
-- Criação do trigger de auditoria
create trigger audit_dre_hitss 
after INSERT 
or DELETE 
or 
update on dre_hitss for EACH row 
execute FUNCTION log_audit_event ();

-- Comentários da tabela
COMMENT ON TABLE public.dre_hitss IS 'Tabela para armazenar dados do DRE (Demonstrativo de Resultado do Exercício) da HITSS';
COMMENT ON COLUMN public.dre_hitss.upload_batch_id IS 'ID do lote de upload para rastreamento';
COMMENT ON COLUMN public.dre_hitss.tipo IS 'Tipo do lançamento: receita ou despesa';
COMMENT ON COLUMN public.dre_hitss.natureza IS 'Natureza do lançamento: RECEITA ou CUSTO';
COMMENT ON COLUMN public.dre_hitss.valor IS 'Valor monetário do lançamento';
COMMENT ON COLUMN public.dre_hitss.lancamento IS 'Valor do lançamento contábil';
COMMENT ON COLUMN public.dre_hitss.raw_data IS 'Dados brutos em formato JSON para auditoria';