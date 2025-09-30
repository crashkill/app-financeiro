import { supabase } from '../lib/supabase'
import { db, Transacao } from '../db/database'

export interface DreHitssRecord {
  id: string
  projeto: string
  ano: number
  mes: number
  conta: string
  descricao: string | null
  natureza: 'RECEITA' | 'DESPESA'
  tipo: 'OPERACIONAL' | 'NAO_OPERACIONAL'
  valor: number
  observacoes: string | null
  data_criacao: string
  data_atualizacao: string
  usuario_criacao: string | null
  usuario_atualizacao: string | null
  ativo: boolean
  metadata: any
}

export class SyncService {
  /**
   * Sincroniza dados da tabela dre_hitss do Supabase para o IndexedDB
   * Mapeia os campos para o formato da interface Transacao
   */
  static async syncDreHitssToIndexedDB(): Promise<{
    success: boolean
    message: string
    recordsProcessed: number
    recordsImported: number
  }> {
    try {
      console.log('Iniciando sincronização de dados da automação HITSS...')
      
      // Buscar dados da tabela dre_hitss
      const { data: dreRecords, error } = await supabase
        .from('dre_hitss')
        .select('*')
        .eq('ativo', true)
        .order('data_criacao', { ascending: false })
      
      if (error) {
        throw new Error(`Erro ao buscar dados do Supabase: ${error.message}`)
      }
      
      if (!dreRecords || dreRecords.length === 0) {
        return {
          success: true,
          message: 'Nenhum registro encontrado na tabela dre_hitss',
          recordsProcessed: 0,
          recordsImported: 0
        }
      }
      
      console.log(`Encontrados ${dreRecords.length} registros na tabela dre_hitss`)
      
      // Mapear dados para o formato da interface Transacao
      const transacoes: Transacao[] = dreRecords.map((record: DreHitssRecord) => {
        // Normalizar natureza (DESPESA -> CUSTO)
        const natureza = record.natureza === 'RECEITA' ? 'RECEITA' : 'CUSTO'
        
        // Criar período no formato M/YYYY
        const periodo = `${record.mes}/${record.ano}`
        
        // Normalizar contaResumo baseado na conta
        let contaResumo = 'OUTROS'
        const contaUpper = record.conta.toUpperCase()
        
        if (contaUpper.includes('RECEITA') && contaUpper.includes('DEVENGADA')) {
          contaResumo = 'RECEITA DEVENGADA'
        } else if (contaUpper.includes('DESONERAÇÃO') || contaUpper.includes('DESONERACAO')) {
          contaResumo = 'DESONERAÇÃO DA FOLHA'
        } else if (contaUpper.includes('CLT')) {
          contaResumo = 'CLT'
        } else if (contaUpper.includes('SUBCONTRATADO') || contaUpper.includes('SUB-CONTRATADO')) {
          contaResumo = 'SUBCONTRATADOS'
        }
        
        // Criar data no formato ISO
        const data = new Date(record.ano, record.mes - 1, 1).toISOString().split('T')[0]
        
        const transacao: Transacao = {
          tipo: natureza === 'RECEITA' ? 'receita' : 'despesa',
          natureza,
          descricao: record.projeto,
          valor: record.valor,
          data,
          categoria: record.tipo === 'OPERACIONAL' ? 'Operacional' : 'Não Operacional',
          observacao: record.observacoes || undefined,
          lancamento: record.valor,
          projeto: record.projeto,
          periodo,
          denominacaoConta: record.conta,
          contaResumo
        }
        
        return transacao
      })
      
      console.log(`Mapeados ${transacoes.length} registros para o formato Transacao`)
      
      // Limpar IndexedDB antes de inserir novos dados
      console.log('Limpando dados existentes do IndexedDB...')
      await db.transacoes.clear()
      
      // Inserir dados no IndexedDB
      console.log('Inserindo dados no IndexedDB...')
      await db.transacoes.bulkAdd(transacoes)
      
      console.log('Sincronização concluída com sucesso!')
      
      return {
        success: true,
        message: `Sincronização concluída! ${transacoes.length} registros importados.`,
        recordsProcessed: dreRecords.length,
        recordsImported: transacoes.length
      }
      
    } catch (error) {
      console.error('Erro durante a sincronização:', error)
      return {
        success: false,
        message: `Erro durante a sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        recordsProcessed: 0,
        recordsImported: 0
      }
    }
  }
  
  /**
   * Verifica o status da sincronização
   */
  static async checkSyncStatus(): Promise<{
    indexedDbCount: number
    supabaseCount: number
    lastSync: string | null
  }> {
    try {
      // Contar registros no IndexedDB
      const indexedDbCount = await db.transacoes.count()
      
      // Contar registros no Supabase
      const { count: supabaseCount, error } = await supabase
        .from('dre_hitss')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)
      
      if (error) {
        throw new Error(`Erro ao contar registros do Supabase: ${error.message}`)
      }
      
      return {
        indexedDbCount,
        supabaseCount: supabaseCount || 0,
        lastSync: localStorage.getItem('lastSyncTime')
      }
      
    } catch (error) {
      console.error('Erro ao verificar status da sincronização:', error)
      return {
        indexedDbCount: 0,
        supabaseCount: 0,
        lastSync: null
      }
    }
  }
  
  /**
   * Limpa todos os dados do IndexedDB
   */
  static async clearIndexedDB(): Promise<{
    success: boolean
    message: string
  }> {
    try {
      console.log('Limpando IndexedDB...')
      await db.transacoes.clear()
      
      const count = await db.transacoes.count()
      
      return {
        success: true,
        message: `IndexedDB limpo com sucesso! ${count} registros restantes.`
      }
      
    } catch (error) {
      console.error('Erro ao limpar IndexedDB:', error)
      return {
        success: false,
        message: `Erro ao limpar IndexedDB: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }
}

export default SyncService