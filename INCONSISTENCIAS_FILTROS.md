# 📋 Inconsistências de Fonte de Dados - FilterPanel

## 🔍 Problema Identificado

As páginas que utilizam o componente `FilterPanel` estão usando fontes de dados diferentes, causando inconsistência na aplicação.

## 📊 Análise por Página

### ✅ GestaoProfissionais.tsx (ATUALIZADA)
- **Fonte:** Supabase (projeto: `vvlmbougufgrecyyjxzb`)
- **Tabela:** `colaboradores`
- **Projetos:** Campo `local_alocacao` 
- **Anos:** Extraído de `created_at`
- **Serviço:** `profissionaisFilterService.ts`
- **Status:** ✅ Conforme regras do projeto (dados do backend)

### ❌ PlanilhasFinanceiras.tsx (INCONSISTENTE)
- **Fonte:** IndexedDB local
- **Tabela:** `transacoes`
- **Projetos:** Campos `projeto` ou `descricao`
- **Anos:** Extraído de `periodo` (formato: "MM/YYYY")
- **Carregamento:** `db.transacoes.toArray()`
- **Status:** ❌ Dados locais (contra regras do projeto)

### ❌ Forecast.tsx (INCONSISTENTE)
- **Fonte:** IndexedDB local
- **Tabela:** `transacoes`
- **Projetos:** Campos `projeto` ou `descricao`
- **Anos:** Extraído de `periodo` (formato: "MM/YYYY")
- **Carregamento:** `db.transacoes.toArray()`
- **Status:** ❌ Dados locais (contra regras do projeto)

### ❌ Dashboard.tsx (INCONSISTENTE)
- **Fonte:** IndexedDB local
- **Tabela:** `transacoes`
- **Projetos:** Campo `descricao`
- **Anos:** Extraído de `periodo` (formato: "MM/YYYY")
- **Carregamento:** `db.transacoes.toArray()`
- **Status:** ❌ Dados locais (contra regras do projeto)

## 🎯 Impactos da Inconsistência

1. **Dados Diferentes:** Cada página mostra projetos e anos diferentes
2. **Experiência Inconsistente:** Usuário vê filtros diferentes em cada tela
3. **Manutenção Complexa:** Múltiplas fontes de dados para manter
4. **Violação das Regras:** Páginas usando dados locais em vez do backend

## 🚀 Estratégias de Resolução

### Opção 1: Migrar Todas para Supabase (RECOMENDADA)
**Vantagens:**
- ✅ Alinhado com regras do projeto
- ✅ Dados centralizados no backend
- ✅ Consistência entre páginas
- ✅ Facilita manutenção

**Ações Necessárias:**
1. Criar Edge Functions para transações financeiras
2. Migrar dados de IndexedDB para Supabase
3. Atualizar serviços das páginas
4. Manter layout/funcionalidades inalteradas

### Opção 2: Reverter GestaoProfissionais para IndexedDB
**Vantagens:**
- ✅ Rápida implementação
- ✅ Mantém consistência atual

**Desvantagens:**
- ❌ Viola regras do projeto
- ❌ Dados descentralizados
- ❌ Dificulta evolução futura

## 📋 Dados Atuais Disponíveis

### Supabase - Colaboradores (122 registros)
```
Locais de Alocação:
- Brasília (1 CLT)
- Cliente (19 CLT, 30 PJ)
- Hitss (26 CLT, 35 PJ)
- Remoto (4 CLT)
- Rio de Janeiro (1 PJ)
- São Paulo (1 CLT)

Anos: 2025 (118 registros), null (4 registros)
```

### IndexedDB - Transações
```
Projetos: Variados (baseados em uploads de planilhas)
Anos: Baseados em períodos das transações
Quantidade: Depende dos uploads realizados
```

## 🎯 Recomendação Final

**Seguir Opção 1** - Migrar todas as páginas para usar Supabase via Edge Functions, mantendo GestaoProfissionais como referência de implementação correta.

---
*Documento gerado em: ${new Date().toLocaleString('pt-BR')}*