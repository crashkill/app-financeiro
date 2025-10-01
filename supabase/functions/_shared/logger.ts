/**
 * Logger utilitário para Edge Functions
 * Fornece logging estruturado com diferentes níveis
 */

export interface LogContext {
  [key: string]: any
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  executionId?: string
}

class Logger {
  private executionId?: string

  /**
   * Define ID de execução para rastreamento
   */
  setExecutionId(id: string): void {
    this.executionId = id
  }

  /**
   * Log de debug
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * Log de informação
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    }
    
    this.log('error', message, errorContext)
  }

  /**
   * Método principal de logging
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      executionId: this.executionId
    }

    // Formatação para console
    const formattedMessage = this.formatMessage(logEntry)
    
    // Output baseado no nível
    switch (level) {
      case 'debug':
        console.debug(formattedMessage)
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'error':
        console.error(formattedMessage)
        break
    }
  }

  /**
   * Formata mensagem para output
   */
  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const level = entry.level.toUpperCase().padEnd(5)
    const executionId = entry.executionId ? `[${entry.executionId.substring(0, 8)}]` : ''
    
    let message = `${timestamp} ${level} ${executionId} ${entry.message}`
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += ` | Context: ${JSON.stringify(entry.context, null, 2)}`
    }
    
    return message
  }

  /**
   * Cria logger com contexto específico
   */
  withContext(context: LogContext): Logger {
    const contextLogger = new Logger()
    contextLogger.executionId = this.executionId
    
    // Override dos métodos para incluir contexto
    const originalLog = contextLogger.log.bind(contextLogger)
    contextLogger.log = (level: LogLevel, message: string, additionalContext?: LogContext) => {
      const mergedContext = { ...context, ...additionalContext }
      originalLog(level, message, mergedContext)
    }
    
    return contextLogger
  }

  /**
   * Mede tempo de execução de uma função
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    this.info(`⏱️ Iniciando: ${label}`)
    
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      this.info(`✅ Concluído: ${label}`, { duration: `${duration.toFixed(2)}ms` })
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.error(`❌ Falhou: ${label}`, error, { duration: `${duration.toFixed(2)}ms` })
      throw error
    }
  }

  /**
   * Log de performance
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`⚡ Performance: ${operation}`, {
      ...context,
      duration: `${duration.toFixed(2)}ms`,
      performance: true
    })
  }

  /**
   * Log de auditoria
   */
  audit(action: string, context?: LogContext): void {
    this.info(`📋 Audit: ${action}`, {
      ...context,
      audit: true
    })
  }
}

// Instância singleton do logger
export const logger = new Logger()

// Utilitários de logging
export const createLogger = (executionId?: string): Logger => {
  const newLogger = new Logger()
  if (executionId) {
    newLogger.setExecutionId(executionId)
  }
  return newLogger
}

export const withExecutionId = (executionId: string): Logger => {
  return createLogger(executionId)
}