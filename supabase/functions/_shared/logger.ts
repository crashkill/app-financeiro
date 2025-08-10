interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
  timestamp: string
  function?: string
}

class Logger {
  private logLevel: string

  constructor() {
    this.logLevel = Deno.env.get('LOG_LEVEL') || 'info'
  }

  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    const currentLevel = levels[this.logLevel as keyof typeof levels] || 1
    const messageLevel = levels[level as keyof typeof levels] || 1
    return messageLevel >= currentLevel
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, data, function: fn } = entry
    const prefix = `[${timestamp}] ${level.toUpperCase()}`
    const functionInfo = fn ? ` [${fn}]` : ''
    const dataInfo = data ? ` ${JSON.stringify(data)}` : ''
    return `${prefix}${functionInfo}: ${message}${dataInfo}`
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any, functionName?: string) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      function: functionName
    }

    const formattedLog = this.formatLog(entry)

    switch (level) {
      case 'error':
        console.error(formattedLog)
        break
      case 'warn':
        console.warn(formattedLog)
        break
      case 'debug':
        console.debug(formattedLog)
        break
      default:
        console.log(formattedLog)
    }

    // Send to external logging service if configured
    if (Deno.env.get('SENTRY_DSN')) {
      this.sendToSentry(entry)
    }
  }

  private async sendToSentry(entry: LogEntry) {
    try {
      // Simplified Sentry integration
      // In production, use proper Sentry SDK
      const sentryDsn = Deno.env.get('SENTRY_DSN')
      if (!sentryDsn) return

      // Basic Sentry payload
      const payload = {
        message: entry.message,
        level: entry.level,
        timestamp: entry.timestamp,
        extra: entry.data,
        tags: {
          function: entry.function || 'unknown'
        }
      }

      // Send to Sentry (simplified)
      await fetch(sentryDsn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Failed to send log to Sentry:', error)
    }
  }

  info(message: string, data?: any, functionName?: string) {
    this.log('info', message, data, functionName)
  }

  warn(message: string, data?: any, functionName?: string) {
    this.log('warn', message, data, functionName)
  }

  error(message: string, data?: any, functionName?: string) {
    this.log('error', message, data, functionName)
  }

  debug(message: string, data?: any, functionName?: string) {
    this.log('debug', message, data, functionName)
  }
}

export const logger = new Logger()