# Deploy no Coolify — App Financeiro

Este guia prepara e empacota o projeto para deploy no Coolify sem alterar layout, estilo ou funcionalidades. O build é estático (Vite) e servido via Nginx, com dados vindos do Supabase.

## Resumo do Pacote
- `Dockerfile` multi-stage (Node 18 + Nginx)
- `nginx.conf` com SPA (`try_files`), gzip, cache de assets e `/health`
- Build do Vite com `minify: 'terser'`
- Suporte a `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` via build args

## Pré-requisitos
- Repositório: `https://github.com/crashkill/app-financeiro.git`
- Variáveis reais do Supabase (Projeto `app-financeiro`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Passo a Passo no Coolify
1. Criar Aplicação
   - Tipo: `Application`
   - Fonte: `Git` → conecte ao GitHub e selecione `crashkill/app-financeiro`
   - Branch: `master`

2. Build
   - Strategy: `Dockerfile`
   - Dockerfile path: `/Dockerfile`
   - Build Args:
     - `VITE_SUPABASE_URL=<sua_url_supabase>`
     - `VITE_SUPABASE_ANON_KEY=<sua_anon_key>`

3. Runtime
   - Container Port: `80`
   - Healthcheck: `/health` (já configurado no Nginx)
   - Domínio: automático do Coolify ou custom (opcional)

4. Deploy
   - Clique em `Deploy` e aguarde o build e publicação

## Observações Importantes
- O Vite injeta `import.meta.env` no momento do build. Por isso, as variáveis `VITE_*` devem ser passadas como build args (não como env runtime).
- A UI não foi alterada; apenas a camada de build/entrega foi ajustada.
- O Nginx está preparado para SPA e cache de assets, mantendo visual e performance.
- As chamadas de dados devem ser centralizadas em Edge Functions do Supabase, nunca calculadas no frontend.

## Troubleshooting
- `404 em rotas SPA`: já coberto por `try_files $uri $uri/ /index.html` no `nginx.conf`.
- `Dados não carregam`: verifique `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e permissões RLS do Supabase.
- `Build falha por minificação`: `terser` já está instalado como devDependency.

## Próximos passos
- Validar visualmente os dashboards, filtros e listagens com o mesmo dataset.
- Opcional: configurar webhooks do GitHub para deploy automático.