import { supabase } from '../lib/supabase'

export interface AutomationExecution {
  id: string
  execution_id: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string
  completed_at?: string
  execution_time_ms?: number
  records_processed: number
  records_imported: number
  records_failed: number
  file_name?: string
  file_size?: number
  error_message?: string
  error_details?: any
  metadata?: any
  user_id?: string
  created_at: string
  updated_at: string
}

export interface ExecutionMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  runningExecutions: number
  totalRecordsProcessed: number
  averageExecutionTime: number
  lastExecutionDate?: Date
  successRate: number
}

class AutomationExecutionService {
  private static instance: AutomationExecutionService

  static getInstance(): AutomationExecutionService {
    if (!AutomationExecutionService.instance) {
      AutomationExecutionService.instance = new AutomationExecutionService()
    }
    return AutomationExecutionService.instance
  }

  /**
   * Busca a última execução da automação
   */
  async getLastExecution(): Promise<AutomationExecution | null> {
    try {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar última execução:', error)
        return null
      }

      return data as AutomationExecution
    } catch (error) {
      console.error('Erro ao buscar última execução:', error)
      return null
    }
  }

  /**
   * Busca todas as execuções com paginação
   */
  async getExecutions(limit: number = 10, offset: number = 0): Promise<AutomationExecution[]> {
    try {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Erro ao buscar execuções:', error)
        return []
      }

      return data as AutomationExecution[]
    } catch (error) {
      console.error('Erro ao buscar execuções:', error)
      return []
    }
  }

  /**
   * Cria uma nova execução
   */
  async createExecution(data: Partial<AutomationExecution>): Promise<AutomationExecution | null> {
    try {
      const { data: execution, error } = await supabase
        .from('automation_executions')
        .insert({
          status: 'running',
          started_at: new Date().toISOString(),
          records_processed: 0,
          records_imported: 0,
          records_failed: 0,
          ...data
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar execução:', error)
        return null
      }

      return execution as AutomationExecution
    } catch (error) {
      console.error('Erro ao criar execução:', error)
      return null
    }
  }

  /**
   * Atualiza uma execução existente
   */
  async updateExecution(id: string, updates: Partial<AutomationExecution>): Promise<AutomationExecution | null> {
    try {
      const { data, error } = await supabase
        .from('automation_executions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar execução:', error)
        return null
      }

      return data as AutomationExecution
    } catch (error) {
      console.error('Erro ao atualizar execução:', error)
      return null
    }
  }

  /**
   * Finaliza uma execução com sucesso
   */
  async completeExecution(
    id: string, 
    recordsProcessed: number, 
    recordsImported: number, 
    recordsFailedCount: number = 0,
    fileName?: string,
    fileSize?: number
  ): Promise<AutomationExecution | null> {
    const completedAt = new Date().toISOString()
    const execution = await this.getExecutionById(id)
    
    if (!execution) {
      console.error('Execução não encontrada para finalizar:', id)
      return null
    }

    const startedAt = new Date(execution.started_at)
    const executionTimeMs = new Date(completedAt).getTime() - startedAt.getTime()

    return this.updateExecution(id, {
      status: 'completed',
      completed_at: completedAt,
      execution_time_ms: executionTimeMs,
      records_processed: recordsProcessed,
      records_imported: recordsImported,
      records_failed: recordsFailedCount,
      file_name: fileName,
      file_size: fileSize
    })
  }

  /**
   * Marca uma execução como falhada
   */
  async failExecution(id: string, errorMessage: string, errorDetails?: any): Promise<AutomationExecution | null> {
    const completedAt = new Date().toISOString()
    const execution = await this.getExecutionById(id)
    
    if (!execution) {
      console.error('Execução não encontrada para marcar como falhada:', id)
      return null
    }

    const startedAt = new Date(execution.started_at)
    const executionTimeMs = new Date(completedAt).getTime() - startedAt.getTime()

    return this.updateExecution(id, {
      status: 'failed',
      completed_at: completedAt,
      execution_time_ms: executionTimeMs,
      error_message: errorMessage,
      error_details: errorDetails
    })
  }

  /**
   * Busca uma execução por ID
   */
  async getExecutionById(id: string): Promise<AutomationExecution | null> {
    try {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar execução por ID:', error)
        return null
      }

      return data as AutomationExecution
    } catch (error) {
      console.error('Erro ao buscar execução por ID:', error)
      return null
    }
  }

  /**
   * Busca uma execução por execution_id
   */
  async getExecutionByExecutionId(executionId: string): Promise<AutomationExecution | null> {
    try {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('execution_id', executionId)
        .single()

      if (error) {
        console.error('Erro ao buscar execução por execution_id:', error)
        return null
      }

      return data as AutomationExecution
    } catch (error) {
      console.error('Erro ao buscar execução por execution_id:', error)
      return null
    }
  }

  /**
   * Calcula métricas das execuções
   */
  async getExecutionMetrics(days: number = 30): Promise<ExecutionMetrics> {
    try {
      const dateLimit = new Date()
      dateLimit.setDate(dateLimit.getDate() - days)

      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .gte('started_at', dateLimit.toISOString())
        .order('started_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar métricas:', error)
        return this.getDefaultMetrics()
      }

      const executions = data as AutomationExecution[]
      const totalExecutions = executions.length
      const successfulExecutions = executions.filter(e => e.status === 'completed').length
      const failedExecutions = executions.filter(e => e.status === 'failed').length
      const runningExecutions = executions.filter(e => e.status === 'running').length
      
      const totalRecordsProcessed = executions.reduce((sum, e) => sum + (e.records_imported || 0), 0)
      
      const completedExecutions = executions.filter(e => e.execution_time_ms && e.execution_time_ms > 0)
      const averageExecutionTime = completedExecutions.length > 0 
        ? completedExecutions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / completedExecutions.length
        : 0
      
      const lastExecutionDate = executions.length > 0 ? new Date(executions[0].started_at) : undefined
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0

      return {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        runningExecutions,
        totalRecordsProcessed,
        averageExecutionTime,
        lastExecutionDate,
        successRate
      }
    } catch (error) {
      console.error('Erro ao calcular métricas:', error)
      return this.getDefaultMetrics()
    }
  }

  private getDefaultMetrics(): ExecutionMetrics {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      runningExecutions: 0,
      totalRecordsProcessed: 0,
      averageExecutionTime: 0,
      successRate: 0
    }
  }

  /**
   * Remove execuções antigas (limpeza)
   */
  async cleanupOldExecutions(daysToKeep: number = 90): Promise<number> {
    try {
      const dateLimit = new Date()
      dateLimit.setDate(dateLimit.getDate() - daysToKeep)

      const { data, error } = await supabase
        .from('automation_executions')
        .delete()
        .lt('started_at', dateLimit.toISOString())
        .select('id')

      if (error) {
        console.error('Erro ao limpar execuções antigas:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Erro ao limpar execuções antigas:', error)
      return 0
    }
  }
}

export default AutomationExecutionService