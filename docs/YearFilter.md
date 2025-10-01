# YearFilter Component

Componente de filtro de anos reutilizável e flexível para o App Financeiro.

## Visão Geral

O `YearFilter` é um componente React altamente configurável que permite filtrar anos de diferentes fontes de dados. Ele oferece uma interface intuitiva com suporte a opções customizáveis, estados de loading/erro, e funcionalidades avançadas.

## Características

- ✅ **Múltiplas fontes de dados**: Transações, anos customizados ou range de anos
- ✅ **Opções especiais**: "Todos os anos" e anos específicos
- ✅ **Estados visuais**: Loading, erro e feedback de seleção
- ✅ **Acessibilidade**: Labels, ARIA e navegação por teclado
- ✅ **Responsivo**: Adaptável a diferentes tamanhos de tela
- ✅ **Tipagem TypeScript**: Completamente tipado
- ✅ **Customizável**: Estilos, textos e comportamentos configuráveis
- ✅ **Performance**: Memoização e otimizações

## Instalação

```tsx
import { YearFilter } from '../components/filters';
// ou
import YearFilter from '../components/filters/YearFilter';
```

## Uso Básico

```tsx
import React, { useState } from 'react';
import { YearFilter } from '../components/filters';

const MyComponent = () => {
  const [selectedYear, setSelectedYear] = useState<string>('all');

  return (
    <YearFilter
      selectedYear={selectedYear}
      onChange={setSelectedYear}
    />
  );
};
```

## Props

### YearFilterProps

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `selectedYear` | `string` | **Obrigatório** | Ano selecionado |
| `onChange` | `(year: string) => void` | **Obrigatório** | Callback de mudança |
| `customYears` | `number[]` | `undefined` | Lista de anos customizados |
| `options` | `YearFilterOptions` | `{}` | Opções de configuração |
| `label` | `string` | `'Ano'` | Label do campo |
| `id` | `string` | Auto-gerado | ID do elemento |
| `className` | `string` | `''` | Classes CSS customizadas |
| `disabled` | `boolean` | `false` | Desabilitar o componente |
| `onError` | `(error: Error) => void` | `undefined` | Callback de erro |

### YearFilterOptions

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `showAllOption` | `boolean` | `true` | Mostrar opção "Todos os anos" |
| `allOptionText` | `string` | `'Todos os anos'` | Texto da opção "Todos" |
| `startYear` | `number` | `2020` | Ano inicial (quando não há dados) |
| `endYear` | `number` | Ano atual | Ano final (quando não há dados) |
| `placeholder` | `string` | `'Selecione o ano...'` | Placeholder |
| `helpText` | `string` | Texto de ajuda padrão | Texto de ajuda |
| `className` | `string` | `''` | Classes CSS customizadas |
| `disabled` | `boolean` | `false` | Desabilitar o componente |

## Exemplos Avançados

### Com Anos Customizados

```tsx
<YearFilter
  selectedYear={selectedYear}
  onChange={setSelectedYear}
  customYears={[2020, 2021, 2022, 2023, 2024]}
  options={{
    showAllOption: true,
    allOptionText: 'Todos os períodos'
  }}
/>
```

### Com Range de Anos

```tsx
<YearFilter
  selectedYear={selectedYear}
  onChange={setSelectedYear}
  options={{
    startYear: 2018,
    endYear: 2025,
    showAllOption: false
  }}
/>
```

### Com Tratamento de Erro

```tsx
const [error, setError] = useState<string | null>(null);

<YearFilter
  selectedYear={selectedYear}
  onChange={setSelectedYear}
  onError={(err) => setError(err.message)}
  options={{
    helpText: error ? `Erro: ${error}` : "Selecione o ano"
  }}
/>
```

## Estados do Componente

### Loading
Quando carregando dados de transações:
- Spinner visível no select
- Opções desabilitadas temporariamente
- Feedback visual de carregamento

### Erro
Quando há erro no carregamento:
- Alert de erro (se callback `onError` não fornecido)
- Opção "Erro ao carregar anos" (desabilitada)
- Opções especiais ainda são mostradas (se habilitadas)

### Sem Dados
Quando não há anos disponíveis:
- Opção "Nenhum ano encontrado" (desabilitada)
- Opções especiais ainda são mostradas (se habilitadas)

## Acessibilidade

- **Labels**: Associação correta entre label e select
- **ARIA**: Atributos `aria-label` e `aria-describedby`
- **Teclado**: Navegação completa por teclado
- **Screen readers**: Textos descritivos e feedback de seleção

## Estilos

O componente usa classes do Bootstrap e Tailwind CSS:

```css
/* Classes principais */
.form-select /* Bootstrap select */
.position-relative /* Container posicionamento */
.position-absolute /* Spinner positioning */
.top-50.end-0.translate-middle-y /* Spinner alignment */
```

## Integração com Dados Financeiros

```tsx
// Usar com dados financeiros
<YearFilter
  selectedYear={filters.year}
  onChange={(year) => setFilters({...filters, year})}
  options={{ 
    showAllOption: true, 
    allOptionText: 'Todos os Anos',
    helpText: 'Filtrar transações por ano'
  }}
/>
```

## Migração do Componente Antigo

Se você está migrando do componente antigo:

```tsx
// Antes
<YearFilter
  selectedYear={year}
  onChange={setYear}
/>

// Depois (mantém compatibilidade)
<YearFilter
  selectedYear={year}
  onChange={setYear}
  options={{
    showAllOption: true,
    allOptionText: 'Todos os anos'
  }}
/>
```

## Performance

- **Memoização**: Componente memoizado com `React.memo`
- **Cálculos otimizados**: Anos únicos calculados apenas quando necessário
- **Debounce**: Evita re-renderizações desnecessárias

## Troubleshooting

### Problema: Anos não aparecem
**Solução**: Verifique se há transações com datas válidas ou forneça `customYears`

### Problema: Erro de carregamento
**Solução**: Implemente callback `onError` para tratamento personalizado

### Problema: Performance lenta
**Solução**: Use `customYears` para listas grandes ou implemente paginação

## Changelog

### v2.0.0
- ✅ Adicionado suporte a anos customizados
- ✅ Implementado estados de loading/erro
- ✅ Melhorada acessibilidade
- ✅ Adicionada documentação JSDoc
- ✅ Otimizada performance com memoização

### v1.0.0
- ✅ Versão inicial com funcionalidades básicas