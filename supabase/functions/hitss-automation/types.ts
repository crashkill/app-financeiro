/**
 * Tipos e interfaces para a automação HITSS
 */

export interface HITSSConfig {
  username: string
  password: string
  baseUrl: string
  downloadPath: string
  timeout?: number
  retries?: number
}

export interface AutomationResult {
  success: boolean
  timestamp: string
  fileDownloaded: boolean
  fileName?: string
  fileSize?: number
  recordsProcessed?: number
  recordsImported?: number
  errors?: string[]
  executionTime: number
}

export interface HITSSLoginCredentials {
  username: string
  password: string
}

export interface DownloadedFile {
  path: string
  name: string
  size: number
  mimeType: string
}

export interface ProcessedData {
  totalRows: number
  validRows: number
  invalidRows: number
  data: Record<string, any>[]
  errors: ValidationError[]
}

export interface ValidationError {
  row: number
  field: string
  value: any
  message: string
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: number
  details: ImportDetail[]
}

export interface ImportDetail {
  row: number
  status: 'imported' | 'skipped' | 'error'
  message?: string
  data?: Record<string, any>
}

export interface AutomationLog {
  id?: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  context?: Record<string, any>
  executionId: string
}

export interface BrowserConfig {
  headless: boolean
  timeout: number
  viewport: {
    width: number
    height: number
  }
  userAgent?: string
}

export interface NavigationStep {
  action: 'goto' | 'click' | 'type' | 'wait' | 'download'
  selector?: string
  value?: string
  timeout?: number
  description: string
}

export interface HITSSNavigationFlow {
  loginSteps: NavigationStep[]
  downloadSteps: NavigationStep[]
  logoutSteps?: NavigationStep[]
}