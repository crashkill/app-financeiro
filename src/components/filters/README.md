# Componentes de Filtro Reutilizáveis

Este diretório contém componentes de filtro reutilizáveis que mantêm o layout e estilo originais do sistema, permitindo consistência visual em todas as páginas.

## 📋 Componentes Disponíveis

### 1. ProjectFilterReusable
Componente para filtrar projetos com seleção múltipla.

### 2. YearFilterReusable
Componente para filtrar anos com opção adicional de filtro por mês.

---

## 🔧 Props Disponíveis

### ProjectFilterReusableProps

| Prop | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|--------|-----------|
| `selectedProjects` | `string[]` | ✅ | - | Array com os projetos selecionados |
| `onChange` | `(projects: string[]) => void` | ✅ | - | Callback executado quando a seleção muda |
| `label` | `string` | ❌ | "Filtrar Projetos" | Texto do label do filtro |
| `helpText` | `string` | ❌ | "Segure Ctrl para selecionar múltiplos projetos..." | Texto de ajuda |
| `className` | `string` | ❌ | "" | Classes CSS adicionais |

### YearFilterReusableProps

| Prop | Tipo | Obrigatório | Padrão | Descrição |
|------|------|-------------|--------|-----------|
| `selectedYear` | `number` | ✅ | - | Ano selecionado |
| `onChange` | `(year: number) => void` | ✅ | - | Callback executado quando o ano muda |
| `label` | `string` | ❌ | "Filtrar Ano" | Texto do label do filtro |
| `className` | `string` | ❌ | "" | Classes CSS adicionais |
| `showMonthFilter` | `boolean` | ❌ | `false` | Se deve mostrar o filtro de mês |
| `selectedMonth` | `string` | ❌ | "" | Mês selecionado (formato "01"-"12") |
| `onMonthChange` | `(month: string) => void` | ❌ | - | Callback para mudança do mês |

---

## 🚀 Exemplos de Uso

### Uso Básico

```tsx
import React, { useState } from 'react';
import { ProjectFilterReusable, YearFilterReusable } from '../components/filters';

const MinhaPage: React.FC = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  return (
    <div>
      <ProjectFilterReusable
        selectedProjects={selectedProjects}
        onChange={setSelectedProjects}
      />
      
      <YearFilterReusable
        selectedYear={selectedYear}
        onChange={setSelectedYear}
      />
    </div>
  );
};
```

### Uso Avançado com Layout Responsivo

```tsx
import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { ProjectFilterReusable, YearFilterReusable } from '../components/filters';

const PaginaCompleta: React.FC = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  return (
    <Row className="mb-4 g-3">
      {/* Filtro de Projetos - 8 colunas */}
      <Col md={8}>
        <ProjectFilterReusable
          selectedProjects={selectedProjects}
          onChange={setSelectedProjects}
          label="Selecionar Projetos"
          helpText="Escolha um ou mais projetos para filtrar os dados"
          className="h-100"
        />
      </Col>
      
      {/* Filtro de Ano com Mês - 4 colunas */}
      <Col md={4}>
        <YearFilterReusable
          selectedYear={selectedYear}
          onChange={setSelectedYear}
          label="Período"
          className="h-100"
          showMonthFilter={true}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </Col>
    </Row>
  );
};
```

### Uso com Filtro de Mês

```tsx
import React, { useState } from 'react';
import { YearFilterReusable } from '../components/filters';

const FiltroComMes: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  return (
    <YearFilterReusable
      selectedYear={selectedYear}
      onChange={setSelectedYear}
      showMonthFilter={true}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
    />
  );
};
```

---

## 🔄 Como Integrar em Páginas Existentes

### 1. Substituir FilterPanel Existente

**Antes:**
```tsx
// Código antigo usando FilterPanel
<FilterPanel
  selectedProjects={selectedProjects}
  onProjectsChange={setSelectedProjects}
  selectedYear={selectedYear}
  onYearChange={setSelectedYear}
  selectedMonth={selectedMonth}
  onMonthChange={setSelectedMonth}
/>
```

**Depois:**
```tsx
// Novo código usando componentes reutilizáveis
<Row className="mb-4 g-3">
  <Col md={8}>
    <ProjectFilterReusable
      selectedProjects={selectedProjects}
      onChange={setSelectedProjects}
      className="h-100"
    />
  </Col>
  <Col md={4}>
    <YearFilterReusable
      selectedYear={selectedYear}
      onChange={setSelectedYear}
      className="h-100"
      showMonthFilter={true}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
    />
  </Col>
</Row>
```

### 2. Importação

```tsx
// Importação individual
import ProjectFilterReusable from '../components/filters/ProjectFilterReusable';
import YearFilterReusable from '../components/filters/YearFilterReusable';

// Ou importação via index
import { ProjectFilterReusable, YearFilterReusable } from '../components/filters';
```

---

## 🆚 Diferenças entre Componentes Antigos e Novos

### Componentes Antigos (ProjectFilter, YearFilter)
- ❌ Dependem do hook `useTransacoes`
- ❌ Acoplados à lógica específica de cada página
- ❌ Não reutilizáveis entre páginas diferentes
- ❌ Fonte de dados inconsistente

### Componentes Novos (ProjectFilterReusable, YearFilterReusable)
- ✅ Usam `filterDataService` para consistência de dados
- ✅ Totalmente reutilizáveis e desacoplados
- ✅ Props configuráveis para diferentes cenários
- ✅ Mantêm layout e estilo originais
- ✅ Fonte de dados unificada via Edge Functions
- ✅ Tratamento de erro e loading states
- ✅ Suporte a customização via props

---

## 📊 Fonte de Dados

Os componentes utilizam o `filterDataService` que:

- **Obtém dados via Edge Functions** do Supabase (projeto `app-financeiro`)
- **Mantém cache** para melhor performance
- **Garante consistência** entre todas as páginas
- **Trata erros** automaticamente
- **Extrai valores únicos** de projetos e anos da tabela `dre_hitss`

---

## 🎨 Layout e Estilo

Os componentes mantêm **exatamente** o mesmo layout e estilo dos filtros originais:

- **Card com shadow** e bordas consistentes
- **Form.Select** do react-bootstrap
- **Classes CSS** idênticas para temas claro/escuro
- **Altura mínima** de 200px para filtro de projetos
- **Responsividade** mantida
- **Acessibilidade** preservada

---

## 🔍 Estados de Loading

Os componentes incluem estados de loading automáticos:

- **"Carregando projetos..."** / **"Carregando anos..."** durante fetch
- **"Nenhum projeto disponível"** / **"Nenhum ano disponível"** quando vazio
- **Desabilitação** dos selects durante carregamento

---

## 📝 Exemplo Completo

Veja o arquivo `FilterExample.tsx` neste diretório para um exemplo completo de implementação que demonstra o uso correto dos componentes mantendo o layout original.

---

## ⚠️ Importante

- **NÃO altere** o layout ou estilo dos componentes
- **SEMPRE use** os componentes reutilizáveis em novas páginas
- **MIGRE gradualmente** páginas existentes para os novos componentes
- **MANTENHA** a consistência visual em todo o sistema
- **TESTE** sempre após integração para garantir funcionamento correto