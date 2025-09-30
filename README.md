# App Financeiro

Este é um sistema de gestão financeira que oferece funcionalidades robustas para visualização de indicadores, upload de dados, previsões financeiras (forecast), e gerenciamento de profissionais.

## 🚀 Funcionalidades Principais

- **Dashboard:** Visão geral com indicadores financeiros
- **Planilhas Financeiras:** Visualização de receitas e despesas
- **Forecast:** Projeções e previsões financeiras com gráficos interativos
- **Upload:** Importação de dados via arquivos Excel
- **Gestão de Profissionais:** Módulo completo para gerenciamento de profissionais
- **Documentação:** Informação detalhada sobre a arquitetura e funcionamento do sistema

## 🛠️ Tecnologias

- **Core:** React 18, TypeScript, Vite
- **UI/UX:** React-Bootstrap, TailwindCSS, Chart.js
- **Testes:** Jest, Testing Library
- **CI/CD:** Vercel
- **Gerenciador de Pacotes:** PNPM
- **Banco de Dados Local:** IndexedDB (Dexie.js)

## 📦 Instalação

1. Pré-requisitos:
   ```bash
   # Instalar Node.js 18
   nvm install 18
   nvm use 18

   # Instalar PNPM
   npm install -g pnpm@8
   ```

2. Clone e instalação:
   ```bash
   # Clonar o repositório
   git clone https://github.com/crashkill/app-financeiro.git
   cd app-financeiro

   # Instalar dependências
   pnpm install
   ```

## 🚦 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev            # Inicia servidor de desenvolvimento
pnpm build          # Gera build de produção
pnpm preview        # Visualiza build local

# Testes
pnpm test           # Executa testes
pnpm test:watch     # Executa testes em modo watch
pnpm test:coverage  # Verifica cobertura de testes

# Qualidade de Código
pnpm lint           # Executa linter
pnpm type-check     # Verifica tipos TypeScript
pnpm format         # Formata código com Prettier
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── contexts/           # Contextos React (Auth, etc)
├── db/                 # Configuração IndexedDB
├── pages/             # Páginas da aplicação
├── routes/            # Configuração de rotas
├── utils/             # Funções utilitárias
└── __tests__/         # Testes automatizados
```

## 🔄 CI/CD Pipeline

O projeto utiliza Vercel para automação de:

1. **Validação e Build**
   - Lint check
   - Type check
   - Testes unitários
   - Compilação TypeScript
   - Build do Vite

2. **Deploy Automático**
   - Deploy automático a cada push na branch principal
   - Preview de PRs
   - Rollback simplificado
   - Monitoramento de performance

## 🔒 Segurança

- Headers de segurança configurados
- CSP (Content Security Policy) implementada
- Autenticação robusta
- HTTPS forçado
- Cache otimizado para assets

## 📚 Documentação

Para informações detalhadas sobre a arquitetura, componentes e regras de negócio, consulte a [Documentação Completa](./docs/DOCUMENTACAO.md).

## 🤝 Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/nome-da-feature`
2. Commit suas mudanças: `git commit -m 'feat: adiciona nova feature'`
3. Push para a branch: `git push origin feature/nome-da-feature`
4. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
