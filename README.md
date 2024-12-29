# App Financeiro

Aplicação para gerenciamento e visualização de dados financeiros de projetos.

## Funcionalidades

### Dashboard
- Visualização de receitas e custos por projeto
- Gráfico de barras empilhadas mostrando:
  - Receita (verde)
  - Custo (vermelho)
  - Linha de margem (azul)
- Filtros:
  - Seleção múltipla de projetos
  - Seleção de ano (padrão: 2024)
- Totalizadores:
  - Receita total do período
  - Custo total do período

### Gráficos
- Barras empilhadas por mês
- Linha de margem (1 - custo/receita)
- Formatação em milhões (Mi)
- Tooltips detalhados com valores e percentuais

## Tecnologias

- React
- TypeScript
- Chart.js / react-chartjs-2
- React Bootstrap
- DexieJS (IndexedDB)

## Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Estrutura do Projeto

```
src/
  ├── components/         # Componentes reutilizáveis
  │   └── ProjectCharts.tsx  # Gráfico de barras e linha
  ├── pages/             # Páginas da aplicação
  │   └── Dashboard.tsx     # Dashboard principal
  ├── db/               # Configuração do banco de dados
  │   └── database.ts     # Schema e conexão
  ├── styles/           # Estilos
  └── utils/            # Utilitários
```

## Dados

O sistema utiliza dados de:
- Receitas e custos por projeto
- Período (mês/ano)
- Natureza (RECEITA/CUSTO)
- Valores em Reais (BRL)

## Atualizações Recentes

### 29/12/2023
- Melhorada visualização do gráfico:
  - Simplificada interface removendo linhas de margem
  - Ajustadas cores das barras para tons mais suaves
  - Adicionados valores dentro das barras em branco
  - Rotação vertical dos valores para melhor legibilidade
- Corrigido bug de duplicação de dados na importação

### 26/12/2023
- Adicionado gráfico de barras empilhadas com linha de margem
- Implementado filtro de ano
- Melhorada visualização dos dados por mês
- Ajustada formatação de valores em milhões
- Adicionada linha de margem sobre as barras

## Próximos Passos

- [ ] Adicionar mais filtros (categoria, cliente)
- [ ] Implementar exportação de dados
- [ ] Adicionar mais tipos de gráficos
- [ ] Melhorar responsividade
- [ ] Adicionar testes automatizados
