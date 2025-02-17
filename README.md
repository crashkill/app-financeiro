# App Financeiro

Este é um sistema de gestão financeira que oferece funcionalidades robustas para visualização de indicadores, upload de dados, previsões financeiras (forecast), e gerenciamento de profissionais.

## Funcionalidades Principais

- **Dashboard:** Visão geral com indicadores financeiros.
- **Planilhas Financeiras:** Visualização de receitas e despesas.
- **Forecast:** Projeções e previsões financeiras com gráficos interativos.
- **Upload:** Importação de dados via arquivos Excel.
- **Gestão de Profissionais:** Módulo completo para gerenciamento de profissionais, incluindo gráficos de custos e tabelas com filtros e ordenação.
- **Documentação:** Informação detalhada sobre a arquitetura e funcionamento do sistema.

## Organização do Projeto

O projeto utiliza uma arquitetura modular, com separação clara entre componentes, contextos, páginas, rotas e utilitários. Para detalhes mais aprofundados, consulte a [Documentação](./docs/DOCUMENTACAO.md).

## Tecnologias Utilizadas

- React, TypeScript e Vite
- React-Bootstrap e TailwindCSS
- Chart.js para visualização de dados
- Jest e Testing Library para testes

## Estrutura do Projeto

```
src/
├── components/
│   ├── gestao-profissionais/
│   │   └── CustosGrafico.tsx
│   ├── Layout.tsx
│   ├── Menu.tsx
│   └── FilterPanel.tsx
├── contexts/
│   └── AuthContext.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── GestaoProfissionais.tsx
│   ├── PlanilhasFinanceiras.tsx
│   └── ...
├── utils/
│   └── formatters.ts
└── App.tsx
```

## Instalação e Execução

1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie a aplicação:
   ```bash
   npm run dev
   ```
4. Execute os testes:
   ```bash
   npm test
   ```

## Desenvolvimento e Testes

### Requisitos de Qualidade
- Cobertura mínima de testes: 80%
- Todas as novas funcionalidades devem incluir testes
- CI/CD automatizado via GitHub Actions

### TDD (Test-Driven Development)
Este projeto segue as práticas de TDD, onde os testes são escritos antes da implementação:

1. Escrever o teste primeiro
2. Implementar o código
3. Refatorar mantendo os testes passando

### Pipeline CI/CD
O projeto utiliza GitHub Actions para automação de:
- Execução de testes
- Verificação de cobertura (mínimo 80%)
- Build do projeto
- Deploy automático após testes bem-sucedidos

### Executando os Testes
```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Verificar cobertura de testes
npm run test:coverage
```

### Estrutura de Testes
```
src/
└── __tests__/
    ├── App.test.tsx
    ├── Home.test.tsx
    ├── CustosGrafico.test.tsx
    └── ...
```

## Atualizações

Esta documentação foi atualizada para refletir as últimas funcionalidades do sistema, incluindo o módulo de Gestão de Profissionais e a integração com ferramentas modernas de testes e desenvolvimento.

## Contribuição

1. Crie uma branch para sua feature
2. Faça commit das alterações
3. Push para a branch
4. Crie um Pull Request

## Contribuindo

1. Crie os testes primeiro (`*.test.tsx`)
2. Implemente a funcionalidade
3. Garanta que os testes passem
4. Faça o commit incluindo testes e implementação
5. Crie o Pull Request

## Licença
Este projeto está sob a licença MIT.
