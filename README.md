# App Financeiro

Aplicação web para gerenciamento financeiro desenvolvida com React, TypeScript e Vite.

## Funcionalidades

### Dashboard
- Visualização da Receita Total (soma de todos os lançamentos com natureza RECEITA)
- Visualização do Custo Total (soma de todos os lançamentos com natureza CUSTO)

### Receitas e Despesas
- Listagem de todas as transações
- Adição de novas transações
- Edição de transações existentes
- Exclusão de transações
- Categorização das transações
- Visualização do total por tipo

### Upload de Arquivos
- Importação de dados via arquivo Excel (.xlsx, .xls) ou CSV
- Preview dos dados antes da importação
- Validação do formato dos dados
- Importação automática para o banco de dados local

### Relatórios
- Visualização de relatórios financeiros
- Filtros por período
- Filtros por categoria
- Gráficos de distribuição

### Configurações
- Personalização da moeda (BRL, USD, EUR)
- Formato de data
- Notificações
- Modo escuro

## Tecnologias Utilizadas

- React 18
- TypeScript
- Vite
- React Router
- React Bootstrap
- IndexedDB (Dexie.js)
- XLSX
- React Dropzone

## Estrutura do Projeto

```
app-financeiro/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── contexts/        # Contextos do React (Auth, Config)
│   ├── db/             # Configuração do banco de dados local
│   ├── hooks/          # Hooks personalizados
│   ├── pages/          # Páginas da aplicação
│   ├── styles/         # Arquivos de estilo
│   ├── App.tsx         # Componente principal
│   └── main.tsx        # Ponto de entrada
├── public/             # Arquivos públicos
└── package.json        # Dependências e scripts
```

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto:
```bash
npm run dev
```

## Formato do Arquivo de Importação

O arquivo Excel/CSV deve conter as seguintes colunas:

- natureza: RECEITA ou CUSTO
- lancamento: valor numérico
- projeto: (opcional) nome do projeto
- descricao: descrição da transação
- data: data da transação
- categoria: categoria da transação

## Credenciais de Teste

- Email: admin
- Senha: admin

## Contribuição

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
