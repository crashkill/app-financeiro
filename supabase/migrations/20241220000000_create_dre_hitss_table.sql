-- Migration: Create dre_hitss table with complete structure
-- Created: 2024-12-20
-- Description: Creates the dre_hitss table with all indexes, constraints, and triggers

-- Create the main table
create table if not exists public.dre_hitss ( 
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
 ) tablespace pg_default; 

-- Create indexes for performance optimization
create index if not exists idx_dre_batch on public.dre_hitss using btree (upload_batch_id) tablespace pg_default; 
create index if not exists idx_dre_conta_resumo on public.dre_hitss using btree (conta_resumo) tablespace pg_default; 
create index if not exists idx_dre_hitss_batch on public.dre_hitss using btree (upload_batch_id) tablespace pg_default; 
create index if not exists idx_dre_hitss_conta_resumo on public.dre_hitss using btree (conta_resumo) tablespace pg_default; 
create index if not exists idx_dre_hitss_data on public.dre_hitss using btree (data) tablespace pg_default; 
create index if not exists idx_dre_hitss_financeiro on public.dre_hitss using btree (tipo, natureza, periodo, projeto) tablespace pg_default; 
create index if not exists idx_dre_hitss_natureza on public.dre_hitss using btree (natureza) tablespace pg_default; 
create index if not exists idx_dre_hitss_periodo on public.dre_hitss using btree (periodo) tablespace pg_default; 
create index if not exists idx_dre_hitss_projeto on public.dre_hitss using btree (projeto) tablespace pg_default; 
create index if not exists idx_dre_hitss_tipo on public.dre_hitss using btree (tipo) tablespace pg_default; 
create index if not exists idx_dre_hitss_valor on public.dre_hitss using btree (valor) tablespace pg_default 
 where (valor <> (0)::numeric); 
create index if not exists idx_dre_natureza on public.dre_hitss using btree (natureza) tablespace pg_default; 
create index if not exists idx_dre_periodo on public.dre_hitss using btree (periodo) tablespace pg_default; 
create index if not exists idx_dre_projeto on public.dre_hitss using btree (projeto) tablespace pg_default; 
create index if not exists idx_dre_tipo on public.dre_hitss using btree (tipo) tablespace pg_default; 

-- Create audit trigger (assuming log_audit_event function exists)
-- Note: This will only work if the log_audit_event function is already created
do $$
begin
  if exists (select 1 from pg_proc where proname = 'log_audit_event') then
    execute 'create trigger audit_dre_hitss 
             after insert or delete or update on dre_hitss 
             for each row execute function log_audit_event()';
  end if;
end $$;

-- Add table and column comments
comment on table public.dre_hitss is 'Tabela para armazenar dados do DRE (Demonstrativo de Resultado do Exercício) da HITSS';
comment on column public.dre_hitss.upload_batch_id is 'ID do lote de upload para rastreamento';
comment on column public.dre_hitss.tipo is 'Tipo do lançamento: receita ou despesa';
comment on column public.dre_hitss.natureza is 'Natureza do lançamento: RECEITA ou CUSTO';
comment on column public.dre_hitss.valor is 'Valor monetário do lançamento';
comment on column public.dre_hitss.lancamento is 'Valor do lançamento contábil';
comment on column public.dre_hitss.raw_data is 'Dados brutos em formato JSON para auditoria';

-- Enable Row Level Security (RLS)
alter table public.dre_hitss enable row level security;

-- Create basic RLS policies
create policy "Enable read access for authenticated users" on public.dre_hitss
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.dre_hitss
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.dre_hitss
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.dre_hitss
  for delete using (auth.role() = 'authenticated');