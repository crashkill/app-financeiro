import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from './logger.ts'

export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export class DatabaseService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createSupabaseClient()
  }

  getClient(): SupabaseClient {
    return this.supabase
  }

  async getFinancialTransactions(filters: {
    projectId?: string
    startDate?: string
    endDate?: string
    nature?: string
    accountSummary?: string
  }) {
    try {
      let query = this.supabase
        .from('transacoes_financeiras')
        .select('*')

      if (filters.projectId) {
        query = query.eq('codigo_conta', filters.projectId)
      }

      if (filters.startDate) {
        query = query.gte('data_transacao', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('data_transacao', filters.endDate)
      }

      if (filters.nature) {
        query = query.eq('natureza', filters.nature)
      }

      if (filters.accountSummary) {
        query = query.eq('resumo_conta', filters.accountSummary)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Error fetching financial transactions', { error, filters })
        throw error
      }

      return data || []
    } catch (error) {
      logger.error('Database error in getFinancialTransactions', { error, filters })
      throw error
    }
  }

  async getDreData(filters: {
    projectId?: string
    startDate?: string
    endDate?: string
    status?: string
  }) {
    try {
      let query = this.supabase
        .from('dados_dre')
        .select('*')

      if (filters.projectId) {
        query = query.eq('codigo_conta', filters.projectId)
      }

      if (filters.startDate) {
        query = query.gte('criado_em', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('criado_em', filters.endDate)
      }

      if (filters.status) {
        query = query.eq('situacao', filters.status)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Error fetching DRE data', { error, filters })
        throw error
      }

      return data || []
    } catch (error) {
      logger.error('Database error in getDreData', { error, filters })
      throw error
    }
  }

  async insertFinancialData(records: any[]) {
    try {
      const { data, error } = await this.supabase
        .from('financial_data')
        .insert(records)
        .select()

      if (error) {
        logger.error('Error inserting financial data', { error, recordCount: records.length })
        throw error
      }

      logger.info('Financial data inserted successfully', { recordCount: records.length })
      return data
    } catch (error) {
      logger.error('Database error in insertFinancialData', { error, recordCount: records.length })
      throw error
    }
  }

  async insertDreData(records: any[]) {
    try {
      logger.debug('Attempting to insert DRE data', { 
        recordCount: records.length, 
        sampleRecord: records[0] 
      })

      // Test connection first
      const { data: testData, error: testError } = await this.supabase
        .from('dados_dre')
        .select('id')
        .limit(1)

      if (testError) {
        logger.error('Connection test failed', { testError: JSON.stringify(testError) })
        throw new Error(`Connection failed: ${testError.message || 'Unknown connection error'}`)
      }

      logger.debug('Connection test successful')

      const { data, error } = await this.supabase
        .from('dados_dre')
        .insert(records)
        .select()

      if (error) {
        const errorDetails = {
          message: error.message || 'Unknown error',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          fullError: JSON.stringify(error),
          errorType: typeof error,
          errorKeys: Object.keys(error || {})
        }
        logger.error('Error inserting DRE data', { 
          error: errorDetails, 
          recordCount: records.length,
          sampleRecord: records[0]
        })
        throw new Error(`Database insertion failed: ${errorDetails.message} (${errorDetails.code})`)
      }

      logger.info('DRE data inserted successfully', { recordCount: records.length })
      return data
    } catch (error) {
      const errorInfo = {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown error type',
        toString: error?.toString() || 'Cannot convert to string',
        constructor: error?.constructor?.name || 'Unknown constructor'
      }
      logger.error('Database error in insertDreData', { 
        error: errorInfo, 
        recordCount: records.length 
      })
      throw error
    }
  }

  async updateRecordStatus(table: string, id: string, status: string) {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()

      if (error) {
        logger.error('Error updating record status', { error, table, id, status })
        throw error
      }

      return data
    } catch (error) {
      logger.error('Database error in updateRecordStatus', { error, table, id, status })
      throw error
    }
  }

  async logAuditEvent(event: {
    userId: string
    action: string
    resource: string
    resourceId: string
    changes?: any
    ipAddress?: string
    userAgent?: string
  }) {
    try {
      const auditRecord = {
        evento: event.action,
        tabela_afetada: event.resource,
        registro_id: event.resourceId,
        dados_novos: event.changes ? JSON.stringify(event.changes) : null,
        usuario_id: event.userId,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        timestamp: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('logs_auditoria')
        .insert(auditRecord)

      if (error) {
        logger.error('Error logging audit event', { error, event })
        throw error
      }

      logger.debug('Audit event logged', { event })
    } catch (error) {
      logger.error('Database error in logAuditEvent', { error, event })
      // Don't throw here to avoid breaking the main operation
    }
  }
}

export const db = new DatabaseService()