# 📋 Project Rule: Manter Layout, Estilo e Funcionalidades Inalterados

**Objetivo:**  
Garantir que alterações na forma de consumo de dados **não alterem** o layout, estilo ou funcionalidades já implementadas no sistema, evitando retrabalho.

---

## ✅ Deve

- Manter layout, estilo, cores, tipografia e posicionamento dos elementos **exatamente como estão**.  
- Preservar todas as funcionalidades existentes:  
  - Gráficos interativos (tooltip, zoom, tipo de gráfico)  
  - Listagens de dados (com paginação ou scroll infinito)  
  - Filtros, ordenação e pesquisa  
  - Uploads, exportações, autenticação, etc.  
- Garantir que a renderização final das páginas permaneça **idêntica ou visualmente equivalente**.  
- Isolar mudanças somente na camada de consumo/transformação de dados (services, repositories, APIs).  
- Documentar todas as alterações de dados (endpoints, contratos, tipagem, estrutura de resposta).  

---

## 📊 Dados e Backend

- **Projeto Supabase:** `app-financeiro`  
- **Integração obrigatória via MCP:** `MCP-Supabase-HITSS`  
- **Todos os dados devem ser obtidos exclusivamente via Edge Functions**, retornando **JSON** do backend.  
- **Nenhum cálculo ou agregação deve ser feito no frontend.**  
  - Exemplo: somas, médias, totais, agrupamentos, validações ou filtros **devem vir prontos do backend**.  
- O frontend deve atuar **apenas como camada de exibição** dos dados recebidos.  
- Se o backend mudar o formato dos dados, deve ser criada uma adaptação **compatível com os componentes atuais**, sem alterar layout ou funcionalidades visuais.  
- Em caso de necessidade de transformação, isso deve ser feito **no backend**, nunca no frontend.  

---

## ❌ Não Deve

- Alterar layout, mover componentes, mudar estilo ou introduzir novos fluxos de navegação.  
- Criar novas telas ou componentes visuais sem aprovação explícita.  
- Remover ou modificar funcionalidades já existentes (gráficos, filtros, listagens, etc).  
- Alterar contratos de dados usados pela UI sem retrocompatibilidade.  
- Introduzir novas bibliotecas de UI ou frameworks CSS sem aprovação.  
- Realizar cálculos, filtros ou manipulações de dados no frontend que deveriam estar no backend.  

---

## 🔎 Revisão Obrigatória

- Toda modificação deve passar por **revisão visual manual** ou snapshot test para garantir que não houve impacto no layout.  
- Comparar telas antes e depois da alteração usando o mesmo conjunto de dados.  
- Garantir que chamadas às **Edge Functions** do **Supabase (app-financeiro)** estão entregando os dados já processados e prontos para exibição.  

---

## 📐 Diretriz Técnica

- A camada de dados (fetch, transformações, chamadas a APIs) deve ser **separada da camada de apresentação**.  
- Componentes de UI não devem conter lógica de negócio ou cálculos.  
- Qualquer ajuste em contratos de dados deve manter fallback para não quebrar páginas atuais.  
- Edge Functions devem centralizar as regras de negócio, garantindo consistência nos dados entregues ao frontend.  
- Toda integração com Supabase deve ser feita via **MCP-Supabase-HITSS**, sem conexões diretas ou não padronizadas.  

---
