# YearFilter

Componente de filtro para seleção de anos com múltiplas fontes de dados.

## Visão Geral

O `YearFilter` é um componente React que permite aos usuários selecionar um ano de uma lista de opções. Ele suporta diferentes fontes de dados, incluindo transações, listas customizadas, ranges de anos e Edge Functions do Supabase.

## Características

- ✅ **Múltiplas fontes de dados**: transações, custom, range, edge_function
- ✅ **Carregamento automático**: Extrai anos das transações ou Edge Function
- ✅ **Fallback inteligente**: Range de anos quando não há dados
- ✅ **Tratamento de erros**: Com retry automático para Edge Functions
- ✅ **Acessibilidade**: Labels e IDs apropriados
- ✅ **Customização**: Placeholder, help text, estilos
- ✅ **Performance**: Memoização e otimizações

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `selectedYear` | `string` | - | Ano atualmente selecionado |
| `onChange` | `(year: string) => void` | - | Callback chamado quando o ano é alterado |
| `customYears` | `number[]` | - | Lista customizada de anos (opcional) |
| `dataSource` | `YearDataSource` | `'transactions'` | Fonte de dados para os anos |
| `options` | `YearFilterOptions` | `{}` | Opções de configuração |
| `label` | `string` | `'Ano'` | Label do campo |
| `disabled` | `boolean` | `false` | Se o campo está desabilitado |
| `className` | `string` | `''` | Classes CSS adicionais |
| `id` | `string` | - | ID do elemento |
| `onError` | `(error: Error) => void` | - | Callback para tratamento de erros |

### YearDataSource

```typescript
type YearDataSource = 'transactions' | 'custom' | 'range' | 'edge_function';
```

**Fontes de dados disponíveis:**
- `transactions`: Extrai anos das transações carregadas (padrão)
- `custom`: Usa a lista `customYears` fornecida
- `range`: Gera um range de anos baseado em `startYear` e `endYear`
- `edge_function`: Carrega anos via Edge Function do Supabase (recomendado para performance)

### YearFilterOptions

```typescript
interface YearFilterOptions {
  startYear?: number;     // Ano inicial do range (fallback)
  endYear?: number;       // Ano final do range (fallback)
  placeholder?: string;   // Texto do placeholder
  helpText?: string;      // Texto de ajuda
  disabled?: boolean;     // Se o componente está desabilitado
}
```

## Exemplos de Uso

### Uso Básico (Transações)

```tsx
import { YearFilter } from './components/filters/YearFilter';

function MyComponent() {
  const [selectedYear, setSelectedYear] = useState('');

  return (
    <YearFilter
      selectedYear={selectedYear}
      onChange={setSelectedYear}
      label="Selecione o Ano"
    />
  );
}
```

### Uso com Edge Function (Recomendado)

```tsx
import { YearFilter } from './components/filters/YearFilter';

function MyComponent() {
  const [selectedYear, setSelectedYear] = useState('');

  return (
    <YearFilter
      selectedYear={selectedYear}
      onChange={setSelectedYear}
      dataSource="edge_function"
      label="Filtrar por Ano"
      onError={(error) => console.error('Erro no filtro:', error)}
    />
  );
}
```

### Com Lista Customizada

```tsx
const customYears = [2020, 2021, 2022, 2023];

<YearFilter
  selectedYear={selectedYear}
  onChange={setSelectedYear}
  dataSource="custom"
  customYears={customYears}
  label="Anos Disponíveis"
/>
```

### Com Range de Anos

```tsx
<YearFilter
  selectedYear={selectedYear}
  onChange={setSelectedYear}
  dataSource="range"
  options={{
    startYear: 2020,
    endYear: 2025,
    placeholder: "Escolha um ano"
  }}
  label="Período"
/>
```

### Com Opções Avançadas

```tsx
<YearFilter
  selectedYear={selectedYear}
  onChange={setSelectedYear}
  dataSource="edge_function"
  options={{
    placeholder: "Todos os anos",
    helpText: "Selecione um ano para filtrar os dados",
    startYear: 2020,
    endYear: new Date().getFullYear()
  }}
  label="Filtro de Ano"
  className="custom-year-filter"
  onError={(error) => {
    console.error('Erro no filtro de ano:', error);
    // Implementar notificação de erro
  }}
/>
```

## Estados do Componente

### Loading
Quando `dataSource="transactions"` ou `dataSource="edge_function"`, o componente mostra um spinner durante o carregamento.

### Error
Erros são tratados automaticamente com retry para Edge Functions. Use `onError` para implementar tratamento customizado.

### Empty
Quando não há anos disponíveis, o componente mostra uma opção "Nenhum ano disponível".

## Integração com Edge Functions

O componente utiliza o `YearFilterService` para comunicação com a Edge Function `filter-years`:

```typescript
// Carregamento automático de todos os anos
const response = await YearFilterService.getAllYears();
```

**Benefícios da Edge Function:**
- ⚡ **Performance**: Processamento no servidor
- 🔄 **Cache**: Dados otimizados e em cache
- 📊 **Consistência**: Mesma fonte para toda aplicação
- 🛡️ **Segurança**: Validação no backend

## Estilos e Customização

O componente usa classes Bootstrap por padrão:
- `form-select` para o select
- `form-label` para o label
- `form-text` para texto de ajuda
- `text-danger` para mensagens de erro

### CSS Customizado

```css
.custom-year-filter .form-select {
  border-radius: 8px;
  border-color: #e0e0e0;
}

.custom-year-filter .form-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
```

## Acessibilidade

- ✅ Labels associados corretamente
- ✅ IDs únicos gerados automaticamente
- ✅ Suporte a screen readers
- ✅ Estados de loading e erro anunciados
- ✅ Navegação por teclado

## Performance

- ✅ Memoização com `useMemo`
- ✅ Debounce em operações custosas
- ✅ Lazy loading de dados
- ✅ Cache de resultados
- ✅ Retry automático com backoff

## Troubleshooting

### Problema: Anos não aparecem
**Solução**: Verifique se a fonte de dados está correta e se há dados disponíveis.

### Problema: Erro na Edge Function
**Solução**: O componente faz retry automático. Verifique logs do Supabase se persistir.

### Problema: Performance lenta
**Solução**: Use `dataSource="edge_function"` para melhor performance.

### Problema: Anos duplicados
**Solução**: O componente remove duplicatas automaticamente. Verifique a fonte de dados.