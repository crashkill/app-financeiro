// Tipos compartilhados para Edge Functions

export interface User {
  id: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  permissions: string[]
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: string
    userId?: string
    requestId?: string
  }
}

export interface FinancialTransaction {
  id: string
  project_id: string
  period_year: number
  period_month: number
  account_code: string
  account_name: string
  account_summary: string
  amount: number
  nature: 'RECEITA' | 'CUSTO' | 'DESPESA'
  created_at: string
  updated_at: string
}

export interface ProjectSummary {
  projectId: string
  totalRevenue: number
  totalCosts: number
  netMargin: number
  marginPercentage: number
  period: {
    start: string
    end: string
  }
}

export interface FinancialMetrics {
  revenue?: {
    total: number
    taxRelief: number
    netRevenue: number
    monthlyBreakdown: MonthlyData[]
    averageMonthly: number
  }
  costs?: {
    total: number
    cltCosts: number
    subcontractorCosts: number
    monthlyBreakdown: MonthlyData[]
    averageMonthly: number
  }
  margin?: {
    gross: number
    net: number
    percentage: number
    monthlyBreakdown: MonthlyData[]
  }
  forecast?: {
    nextMonth: ForecastData
    nextQuarter: ForecastData
    nextYear: ForecastData
  }
  summary?: ProjectSummary
}

export interface MonthlyData {
  month: string
  total: number
  breakdown: Record<string, number>
}

export interface ForecastData {
  revenue: number
  costs: number
  margin: number
  confidence: number
  methodology: string
}

export interface FileUploadRequest {
  fileName: string
  fileType: string
  fileSize: number
  projectId: string
  uploadType: 'dre' | 'financial' | 'professionals'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  processedRows: number
  totalRows: number
}

export interface ValidationError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  row: number
  column: string
  message: string
  suggestion?: string
}

export interface Professional {
  id: string
  name: string
  email: string
  role: string
  department: string
  costCenter: string
  salary: number
  benefits: number
  totalCost: number
  startDate: string
  endDate?: string
  status: 'active' | 'inactive' | 'terminated'
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string
  changes: Record<string, any>
  timestamp: string
  ipAddress: string
  userAgent: string
}

export interface ExportRequest {
  type: 'pdf' | 'excel' | 'csv'
  template: string
  data: any
  options: {
    includeCharts?: boolean
    dateRange?: {
      start: string
      end: string
    }
    filters?: Record<string, any>
  }
}