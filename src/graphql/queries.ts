import { gql } from '@apollo/client';

// Queries para Transações Financeiras
export const GET_TRANSACOES_FINANCEIRAS = gql`
  query GetTransacoesFinanceiras(
    $filter: transacoes_financeiras_filter
    $orderBy: [transacoes_financeiras_order_by!]
    $limit: Int
    $offset: Int
  ) {
    transacoes_financeiras(
      where: $filter
      order_by: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      tipo
      categoria
      subcategoria
      descricao
      valor
      data_transacao
      status
      projeto_id
      colaborador_id
      observacoes
      tags
      created_at
      updated_at
      colaborador {
        id
        nome
        email
      }
    }
  }
`;

export const GET_TRANSACAO_BY_ID = gql`
  query GetTransacaoById($id: uuid!) {
    transacoes_financeiras_by_pk(id: $id) {
      id
      tipo
      categoria
      subcategoria
      descricao
      valor
      data_transacao
      status
      projeto_id
      colaborador_id
      observacoes
      tags
      created_at
      updated_at
      colaborador {
        id
        nome
        email
      }
    }
  }
`;

// Queries para Dados DRE
export const GET_DADOS_DRE = gql`
  query GetDadosDRE(
    $filter: dados_dre_filter
    $orderBy: [dados_dre_order_by!]
    $limit: Int
    $offset: Int
  ) {
    dados_dre(
      where: $filter
      order_by: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      periodo
      receita_bruta
      receita_liquida
      custo_pessoal_clt
      custo_pessoal_terceirizado
      outros_custos
      margem_bruta
      margem_liquida
      projeto_id
      observacoes
      created_at
      updated_at
    }
  }
`;

// Queries para Profissionais
export const GET_PROFISSIONAIS = gql`
  query GetProfissionais(
    $filter: profissionais_filter
    $orderBy: [profissionais_order_by!]
    $limit: Int
    $offset: Int
  ) {
    profissionais(
      where: $filter
      order_by: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      nome
      email
      cargo
      departamento
      salario
      data_admissao
      status
      projeto_id
      observacoes
      created_at
      updated_at
    }
  }
`;

export const GET_PROFISSIONAL_BY_ID = gql`
  query GetProfissionalById($id: uuid!) {
    profissionais_by_pk(id: $id) {
      id
      nome
      email
      cargo
      departamento
      salario
      data_admissao
      status
      projeto_id
      observacoes
      created_at
      updated_at
    }
  }
`;

// Queries para Previsões Financeiras
export const GET_PREVISOES_FINANCEIRAS = gql`
  query GetPrevisoesFinanceiras(
    $filter: previsoes_financeiras_filter
    $orderBy: [previsoes_financeiras_order_by!]
    $limit: Int
    $offset: Int
  ) {
    previsoes_financeiras(
      where: $filter
      order_by: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      periodo_inicio
      periodo_fim
      receita_prevista
      custo_previsto
      margem_prevista
      algoritmo_usado
      confianca
      projeto_id
      observacoes
      created_at
      updated_at
    }
  }
`;

// Queries para Colaboradores
export const GET_COLABORADORES = gql`
  query GetColaboradores(
    $filter: colaboradores_filter
    $orderBy: [colaboradores_order_by!]
    $limit: Int
    $offset: Int
  ) {
    colaboradores(
      where: $filter
      order_by: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      nome
      email
      telefone
      cargo
      departamento
      data_admissao
      salario
      status
      observacoes
      created_at
      updated_at
    }
  }
`;

// Queries para Configurações do Sistema
export const GET_CONFIGURACOES_SISTEMA = gql`
  query GetConfiguracoesSistema {
    configuracoes_sistema {
      id
      chave
      valor
      descricao
      tipo
      created_at
      updated_at
    }
  }
`;

// Query para métricas financeiras agregadas
export const GET_METRICAS_FINANCEIRAS = gql`
  query GetMetricasFinanceiras($projeto_id: String, $periodo_inicio: date, $periodo_fim: date) {
    transacoes_financeiras_aggregate(
      where: {
        projeto_id: { _eq: $projeto_id }
        data_transacao: { _gte: $periodo_inicio, _lte: $periodo_fim }
      }
    ) {
      aggregate {
        sum {
          valor
        }
        count
      }
      nodes {
        tipo
        categoria
        valor
        data_transacao
      }
    }
    
    dados_dre_aggregate(
      where: {
        projeto_id: { _eq: $projeto_id }
        periodo: { _gte: $periodo_inicio, _lte: $periodo_fim }
      }
    ) {
      aggregate {
        sum {
          receita_bruta
          receita_liquida
          custo_pessoal_clt
          custo_pessoal_terceirizado
          outros_custos
          margem_bruta
          margem_liquida
        }
      }
    }
  }
`;