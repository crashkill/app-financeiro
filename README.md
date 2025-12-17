# 🚀 App Financeiro - Sistema de Gestão Financeira

Sistema completo de gestão financeira com funcionalidades robustas para visualização de indicadores, upload de dados, previsões financeiras (forecast) e gerenciamento de profissionais.

## ✨ Funcionalidades Principais

- **📊 Dashboard**: Visão geral com indicadores financeiros em tempo real
- **💰 Planilhas Financeiras**: Visualização detalhada de receitas e despesas
- **📈 Forecast**: Projeções e previsões financeiras com gráficos interativos
- **📤 Upload**: Importação de dados via arquivos Excel
- **👥 Gestão de Profissionais**: Módulo completo para gerenciamento de equipe
- **📚 Documentação**: Informação detalhada sobre arquitetura e funcionamento

## 🛠️ Stack Tecnológica

### Core
- **React 18** - Biblioteca UI moderna
- **TypeScript** - Type safety
- **Vite** - Build tool ultra-rápido

### UI/UX
- **TailwindCSS** - Utility-first CSS
- **React-Bootstrap** - Componentes prontos
- **Chart.js** - Visualização de dados
- **Framer Motion** - Animações fluidas

### Backend & Database
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados relacional
- **IndexedDB (Dexie.js)** - Cache local

### DevOps
- **Docker** - Containerização
- **Nginx** - Web server
- **Vercel** - CI/CD (opcional)

## 🐳 Início Rápido com Docker (Recomendado)

### Pré-requisitos
- Docker Desktop ou Docker Engine
- Docker Compose v2.0+

### 1. Clone o Repositório
```bash
git clone https://github.com/crashkill/app-financeiro.git
cd app-financeiro
```

### 2. Configure as Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Execute com Docker
```bash
# Build e start
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Parar
docker-compose down
```

**Acesse**: http://localhost:3000

📖 **Guia Completo**: Veja [DOCKER-GUIDE.md](./DOCKER-GUIDE.md) para instruções detalhadas.

## 💻 Desenvolvimento Local (Sem Docker)

### Pré-requisitos
- Node.js 18+
- npm ou pnpm

### Instalação
```bash
# Instalar dependências
npm install

# Ou com pnpm
pnpm install
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento (http://localhost:5173)
npm run build            # Build de produção
npm run preview          # Preview do build

# Qualidade de Código
npm run lint             # ESLint
npm run type-check       # TypeScript check
npm run format           # Prettier

# Testes
npm test                 # Executar testes
npm run test:watch       # Modo watch
npm run test:coverage    # Cobertura de testes
```

## 📁 Estrutura do Projeto

```
app-financeiro/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── contexts/       # React Contexts (Auth, etc)
│   ├── hooks/          # Custom hooks
│   ├── services/       # Serviços e APIs
│   ├── utils/          # Funções utilitárias
│   ├── types/          # TypeScript types
│   └── styles/         # Estilos globais
├── public/             # Assets estáticos
├── docs/               # Documentação
├── Dockerfile          # Configuração Docker
├── docker-compose.yml  # Orquestração Docker
└── nginx.conf          # Configuração Nginx
```

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ Sim |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase | ✅ Sim |
| `NODE_ENV` | Ambiente (development/production) | ❌ Não |

### Supabase Setup

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Configure as tabelas necessárias (veja `docs/database-schema.md`)
3. Copie as credenciais para o `.env`

## 🚀 Deploy

### Docker (Produção)

```bash
# Build para produção
docker-compose build --no-cache

# Deploy em servidor
docker-compose up -d
```

### Cloud Platforms

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### AWS ECS/Fargate
Use o `Dockerfile` para criar uma task definition

#### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/app-financeiro
gcloud run deploy --image gcr.io/PROJECT-ID/app-financeiro
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Modo watch
npm run test:watch

# Cobertura
npm run test:coverage
```

## 📊 Monitoramento

O container Docker inclui:
- ✅ Healthcheck automático
- ✅ Logs estruturados
- ✅ Métricas de performance

```bash
# Ver logs
docker-compose logs -f

# Métricas
docker stats app-financeiro
```

## 🔒 Segurança

- ✅ Headers de segurança configurados
- ✅ CSP (Content Security Policy)
- ✅ HTTPS forçado (em produção)
- ✅ Autenticação via Supabase
- ✅ Secrets via environment variables
- ✅ Multi-stage Docker build

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

### Convenções de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 📚 Documentação Adicional

- [Guia Docker](./DOCKER-GUIDE.md) - Containerização completa
- [Changelog](./CHANGELOG.md) - Histórico de versões
- [PRD](./PRD.md) - Product Requirements Document
- [Análise](./ANALISE.yaml) - Análise técnica do projeto

## 🐛 Troubleshooting

### Problemas Comuns

**Build falha**
```bash
# Limpar cache
rm -rf node_modules dist
npm install
npm run build
```

**Docker não inicia**
```bash
# Verificar logs
docker-compose logs app-financeiro

# Reconstruir
docker-compose build --no-cache
docker-compose up -d
```

**Erro de conexão com Supabase**
- Verifique as credenciais no `.env`
- Confirme que o projeto Supabase está ativo
- Verifique as regras de RLS (Row Level Security)

## 📞 Suporte

- 📧 Email: suporte@exemplo.com
- 🐛 Issues: [GitHub Issues](https://github.com/crashkill/app-financeiro/issues)
- 📖 Wiki: [GitHub Wiki](https://github.com/crashkill/app-financeiro/wiki)

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

Desenvolvido com ❤️ pela equipe HITSS

---

**Versão**: 1.0.0  
**Última Atualização**: 2025-11-28  
**Status**: ✅ Em Produção
