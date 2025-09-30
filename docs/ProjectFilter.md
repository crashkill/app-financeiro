# ProjectFilter Component

Componente de filtro de projetos reutilizável e flexível para o App Financeiro.

## Visão Geral

O `ProjectFilter` é um componente React altamente configurável que permite filtrar projetos de diferentes fontes de dados. Ele oferece uma interface intuitiva com suporte a seleção múltipla, estados de loading/erro, e opções customizáveis.

## Características

- ✅ **Múltiplas fontes de dados**: Transações, dados financeiros ou lista customizada
- ✅ **Seleção múltipla**: Suporte nativo a seleção de múltiplos projetos
- ✅ **Opções especiais**: "Todos os projetos" e "Nenhum projeto"
- ✅ **Estados visuais**: Loading, erro e feedback de seleção
- ✅ **Acessibilidade**: Labels, ARIA e navegação por teclado
- ✅ **Responsivo**: Adaptável a diferentes tamanhos de tela
- ✅ **Tipagem TypeScript**: Completamente tipado
- ✅ **Customizável**: Estilos, textos e comportamentos configuráveis

## Instalação

O componente está localizado em:
```
src/components/common/ProjectFilter.tsx
```

## Uso Básico

### Exemplo Simples

```tsx
import React, { useState } from 'react';
import ProjectFilter from '../components/common/ProjectFilter';

const MyComponent = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  return (
    <ProjectFilter
      selectedProjects={selectedProjects}
      onChange={setSelectedProjects}
    />
  );
};
```

### Com Hook Utilitário

```tsx
import React from 'react';
import ProjectFilter, { useProjectFilter } from '../components/common/ProjectFilter';

const MyComponent = () => {
  const { selectedProjects, handleProjectChange } = useProjectFilter();

  return (
    <ProjectFilter
      selectedProjects={selectedProjects}
      onChange={handleProjectChange}
    />
  );
};
```

## Props

### ProjectFilterProps

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `selectedProjects` | `string[]` | **Obrigatório** | Projetos atualmente selecionados |
| `onChange` | `(projects: string[]) => void` | **Obrigatório** | Callback chamado quando a seleção muda |
| `dataSource` | `ProjectDataSource` | `'transactions'` | Fonte de dados para carregar os projetos |
| `customProjects` | `string[]` | `undefined` | Lista customizada de projetos |
| `options` | `ProjectFilterOptions` | `{}` | Opções de configuração |
| `label` | `string` | `'Filtrar Projetos'` | Label do campo |
| `id` | `string` | `'project-filter'` | ID do elemento |
| `onError` | `(error: Error) => void` | `undefined` | Callback para tratamento de erros |

### ProjectFilterOptions

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `showAllOption` | `boolean` | `true` | Mostrar opção "Todos os projetos" |
| `showNoneOption` | `boolean` | `true` | Mostrar opção "Nenhum projeto" |
| `allOptionText` | `string` | `'Todos os projetos'` | Texto da opção "Todos" |
| `noneOptionText` | `string` | `'Nenhum projeto'` | Texto da opção "Nenhum" |
| `placeholder` | `string` | `'Selecione os projetos...'` | Placeholder |
| `helpText` | `string` | Texto de ajuda padrão | Texto de ajuda |
| `minHeight` | `string` | `'200px'` | Altura mínima do select |
| `className` | `string` | `''` | Classes CSS customizadas |
| `disabled` | `boolean` | `false` | Desabilitar o componente |

### ProjectDataSource

```tsx
type ProjectDataSource = 'transactions' | 'financial' | 'custom';
```

- **`transactions`**: Carrega projetos das transações do banco de dados
- **`financial`**: Carrega projetos dos dados financeiros
- **`custom`**: Usa a lista fornecida em `customProjects`

## Exemplos Avançados

### Filtro com Dados Financeiros

```tsx
<ProjectFilter
  selectedProjects={selectedProjects}
  onChange={setSelectedProjects}
  dataSource="financial"
  label="Projetos Financeiros"
  options={{
    helpText: "Selecione os projetos para análise financeira"
  }}
/>
```

### Filtro Customizado

```tsx
const customProjects = ['Projeto Alpha', 'Projeto Beta', 'Projeto Gamma'];

<ProjectFilter
  selectedProjects={selectedProjects}
  onChange={setSelectedProjects}
  dataSource="custom"
  customProjects={customProjects}
  options={{
    showAllOption: false,
    showNoneOption: false,
    placeholder: "Escolha um projeto específico...",
    minHeight: "150px"
  }}
/>
```

### Filtro com Tratamento de Erro

```tsx
const [error, setError] = useState<string | null>(null);

<ProjectFilter
  selectedProjects={selectedProjects}
  onChange={setSelectedProjects}
  onError={(err) => setError(err.message)}
  options={{
    helpText: error ? `Erro: ${error}` : "Selecione os projetos"
  }}
/>
```

### Filtro Compacto

```tsx
<ProjectFilter
  selectedProjects={selectedProjects}
  onChange={setSelectedProjects}
  options={{
    showAllOption: false,
    showNoneOption: false,
    helpText: "",
    minHeight: "120px",
    className: "form-select-sm"
  }}
/>
```

## Hook useProjectFilter

Hook utilitário que facilita o gerenciamento do estado do filtro.

### Uso

```tsx
const {
  selectedProjects,
  handleProjectChange,
  clearSelection,
  selectAll,
  setSelectedProjects
} = useProjectFilter(['projeto-inicial']);
```

### Métodos

- **`selectedProjects`**: Array dos projetos selecionados
- **`handleProjectChange`**: Função para atualizar a seleção
- **`clearSelection`**: Limpa toda a seleção
- **`selectAll`**: Seleciona todos os projetos fornecidos
- **`setSelectedProjects`**: Define diretamente os projetos selecionados

## Estados do Componente

### Loading
Quando os dados estão sendo carregados, o componente mostra:
- Spinner no canto direito do select
- Select desabilitado
- Mensagem de loading (se configurada)

### Erro
Em caso de erro:
- Alert vermelho com a mensagem de erro
- Callback `onError` é chamado (se fornecido)
- Select não é renderizado

### Vazio
Quando não há projetos:
- Opção "Nenhum projeto encontrado" (desabilitada)
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
.form-control.bg-input.text-foreground.border-border
.focus:ring-blue-500.focus:border-blue-500
.dark:focus:ring-blue-500.dark:focus:border-blue-500

/* Estados */
.text-slate-900.dark:text-white /* Opções normais */
.text-slate-400.dark:text-slate-500 /* Opções desabilitadas */
.font-semibold /* Opções especiais */
```

## Integração com Outros Componentes

### FilterPanel

```tsx
// Substituir o filtro antigo
<ProjectFilter
  selectedProjects={selectedProjects}
  onChange={onProjectChange}
  dataSource="transactions"
/>
```

### ForecastFilters

```tsx
// Usar com previsões
<ProjectFilter
  selectedProjects={filters.projects}
  onChange={(projects) => setFilters({...filters, projects})}
  dataSource="transactions"
  label="Projetos para Previsão"
/>
```

### FinancialFilters

```tsx
// Usar com dados financeiros
<ProjectFilter
  selectedProjects={[filters.project]}
  onChange={(projects) => setFilters({...filters, project: projects[0] || 'all'})}
  dataSource="financial"
  options={{ showAllOption: true, allOptionText: 'Todos os Projetos' }}
/>
```

## Migração do Componente Antigo

### Antes
```tsx
// Componente antigo
<Form.Select multiple value={selectedProjects} onChange={handleChange}>
  {projects.map(project => (
    <option key={project} value={project}>{project}</option>
  ))}
</Form.Select>
```

### Depois
```tsx
// Novo componente
<ProjectFilter
  selectedProjects={selectedProjects}
  onChange={setSelectedProjects}
/>
```

## Performance

- **Memoização**: Uso de `useMemo` para cálculos pesados
- **Lazy loading**: Carregamento sob demanda dos dados
- **Debounce**: Evita re-renders desnecessários
- **Virtual scrolling**: Para listas muito grandes (futuro)

## Testes

```tsx
// Exemplo de teste
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectFilter from '../ProjectFilter';

test('should render project options', () => {
  const mockOnChange = jest.fn();
  
  render(
    <ProjectFilter
      selectedProjects={[]}
      onChange={mockOnChange}
      dataSource="custom"
      customProjects={['Projeto A', 'Projeto B']}
    />
  );
  
  expect(screen.getByText('Projeto A')).toBeInTheDocument();
  expect(screen.getByText('Projeto B')).toBeInTheDocument();
});
```

## Troubleshooting

### Problemas Comuns

1. **Projetos não carregam**
   - Verificar se a fonte de dados está correta
   - Checar se há dados na fonte especificada
   - Verificar console para erros

2. **Seleção não funciona**
   - Verificar se `onChange` está sendo chamado
   - Checar se `selectedProjects` está sendo atualizado
   - Verificar se não há conflito de IDs

3. **Estilos não aplicam**
   - Verificar se Bootstrap e Tailwind estão carregados
   - Checar especificidade CSS
   - Verificar classes customizadas

### Debug

```tsx
// Adicionar logs para debug
<ProjectFilter
  selectedProjects={selectedProjects}
  onChange={(projects) => {
    console.log('Projetos selecionados:', projects);
    setSelectedProjects(projects);
  }}
  onError={(error) => {
    console.error('Erro no ProjectFilter:', error);
  }}
/>
```

## Roadmap

- [ ] Suporte a busca/filtro de texto
- [ ] Virtual scrolling para listas grandes
- [ ] Drag & drop para reordenação
- [ ] Grupos/categorias de projetos
- [ ] Exportação da seleção
- [ ] Histórico de seleções
- [ ] Integração com localStorage
- [ ] Modo single-select
- [ ] Validação de seleção
- [ ] Temas customizáveis

## Contribuição

Para contribuir com melhorias:

1. Criar branch feature
2. Implementar mudanças
3. Adicionar testes
4. Atualizar documentação
5. Criar pull request

## Licença

Este componente faz parte do App Financeiro e segue a mesma licença do projeto.