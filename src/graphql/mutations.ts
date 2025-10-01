import { gql } from '@apollo/client';

// Mutations para Transações Financeiras
export const CREATE_TRANSACAO_FINANCEIRA = gql`
  mutation CreateTransacaoFinanceira($input: transacoes_financeiras_insert_input!) {
    insert_transacoes_financeiras_one(object: $input) {
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
    }
  }
`;

export const UPDATE_TRANSACAO_FINANCEIRA = gql`
  mutation UpdateTransacaoFinanceira($id: uuid!, $input: transacoes_financeiras_set_input!) {
    update_transacoes_financeiras_by_pk(pk_columns: { id: $id }, _set: $input) {
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
      updated_at
    }
  }
`;

export const DELETE_TRANSACAO_FINANCEIRA = gql`
  mutation DeleteTransacaoFinanceira($id: uuid!) {
    delete_transacoes_financeiras_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_TRANSACOES_FINANCEIRAS = gql`
  mutation DeleteTransacoesFinanceiras($ids: [uuid!]!) {
    delete_transacoes_financeiras(where: { id: { _in: $ids } }) {
      affected_rows
    }
  }
`;

// Mutations para Dados DRE
export const CREATE_DADOS_DRE = gql`
  mutation CreateDadosDRE($input: dados_dre_insert_input!) {
    insert_dados_dre_one(object: $input) {
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

export const UPDATE_DADOS_DRE = gql`
  mutation UpdateDadosDRE($id: uuid!, $input: dados_dre_set_input!) {
    update_dados_dre_by_pk(pk_columns: { id: $id }, _set: $input) {
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
      updated_at
    }
  }
`;

export const DELETE_DADOS_DRE = gql`
  mutation DeleteDadosDRE($id: uuid!) {
    delete_dados_dre_by_pk(id: $id) {
      id
    }
  }
`;

// Mutations para Profissionais
export const CREATE_PROFISSIONAL = gql`
  mutation CreateProfissional($input: profissionais_insert_input!) {
    insert_profissionais_one(object: $input) {
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

export const UPDATE_PROFISSIONAL = gql`
  mutation UpdateProfissional($id: uuid!, $input: profissionais_set_input!) {
    update_profissionais_by_pk(pk_columns: { id: $id }, _set: $input) {
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
      updated_at
    }
  }
`;

export const DELETE_PROFISSIONAL = gql`
  mutation DeleteProfissional($id: uuid!) {
    delete_profissionais_by_pk(id: $id) {
      id
    }
  }
`;

// Mutations para Previsões Financeiras
export const CREATE_PREVISAO_FINANCEIRA = gql`
  mutation CreatePrevisaoFinanceira($input: previsoes_financeiras_insert_input!) {
    insert_previsoes_financeiras_one(object: $input) {
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

export const UPDATE_PREVISAO_FINANCEIRA = gql`
  mutation UpdatePrevisaoFinanceira($id: uuid!, $input: previsoes_financeiras_set_input!) {
    update_previsoes_financeiras_by_pk(pk_columns: { id: $id }, _set: $input) {
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
      updated_at
    }
  }
`;

export const DELETE_PREVISAO_FINANCEIRA = gql`
  mutation DeletePrevisaoFinanceira($id: uuid!) {
    delete_previsoes_financeiras_by_pk(id: $id) {
      id
    }
  }
`;

// Mutations para Colaboradores
export const CREATE_COLABORADOR = gql`
  mutation CreateColaborador($input: colaboradores_insert_input!) {
    insert_colaboradores_one(object: $input) {
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

export const UPDATE_COLABORADOR = gql`
  mutation UpdateColaborador($id: uuid!, $input: colaboradores_set_input!) {
    update_colaboradores_by_pk(pk_columns: { id: $id }, _set: $input) {
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
      updated_at
    }
  }
`;

export const DELETE_COLABORADOR = gql`
  mutation DeleteColaborador($id: uuid!) {
    delete_colaboradores_by_pk(id: $id) {
      id
    }
  }
`;

// Mutations para Configurações do Sistema
export const UPDATE_CONFIGURACAO_SISTEMA = gql`
  mutation UpdateConfiguracaoSistema($chave: String!, $valor: String!) {
    update_configuracoes_sistema(
      where: { chave: { _eq: $chave } }
      _set: { valor: $valor, updated_at: "now()" }
    ) {
      affected_rows
      returning {
        id
        chave
        valor
        updated_at
      }
    }
  }
`;

// Mutation para criar log de auditoria
export const CREATE_LOG_AUDITORIA = gql`
  mutation CreateLogAuditoria($input: logs_auditoria_insert_input!) {
    insert_logs_auditoria_one(object: $input) {
      id
      acao
      tabela
      registro_id
      dados_anteriores
      dados_novos
      usuario_id
      created_at
    }
  }
`;