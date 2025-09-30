export interface Professional {
  id?: string
  externalId?: string
  name: string
  email: string
  role: string
  department?: string
  salary?: number
  hourlyRate?: number
  workload?: number // Percentage (0-100)
  status: 'active' | 'inactive' | 'on_leave'
  contractType: 'clt' | 'pj' | 'freelancer' | 'intern'
  startDate?: string
  endDate?: string
  skills?: string[]
  certifications?: string[]
  manager?: string
  costCenter?: string
  location?: string
  phone?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  bankInfo?: {
    bank: string
    agency: string
    account: string
    accountType: 'checking' | 'savings'
  }
  documents?: {
    cpf?: string
    rg?: string
    passport?: string
    workPermit?: string
  }
  benefits?: {
    healthInsurance?: boolean
    dentalInsurance?: boolean
    lifeInsurance?: boolean
    mealVoucher?: number
    transportVoucher?: number
    gymMembership?: boolean
  }
  performance?: {
    lastReviewDate?: string
    nextReviewDate?: string
    rating?: number // 1-5
    goals?: string[]
  }
  createdAt?: string
  updatedAt?: string
  syncedAt?: string
}

export interface ProfessionalSyncRequest {
  syncType: 'full' | 'incremental' | 'external_api'
  professionals?: Professional[]
  externalApiConfig?: {
    endpoint: string
    apiKey?: string
    authToken?: string
    headers?: Record<string, string>
    timeout?: number
  }
  filters?: {
    departments?: string[]
    roles?: string[]
    status?: 'active' | 'inactive' | 'all'
    lastSyncAfter?: string
  }
  options?: {
    dryRun?: boolean
    skipValidation?: boolean
    updateExisting?: boolean
    deleteNotFound?: boolean
    batchSize?: number
  }
}

export interface SyncResult {
  success: boolean
  message: string
  totalProcessed: number
  created: number
  updated: number
  skipped: number
  deleted?: number
  errors: SyncError[]
  warnings: string[]
  processedIds: string[]
  skippedIds: string[]
  errorIds: string[]
  executionTime: number
  lastSyncTimestamp: string
}

export interface SyncError {
  professionalId?: string
  externalId?: string
  email?: string
  error: string
  field?: string
  code?: string
}

export interface ProfessionalSyncResponse {
  success: boolean
  message: string
  data: {
    syncResult: SyncResult
    summary: {
      totalProcessed: number
      created: number
      updated: number
      skipped: number
      errors: number
    }
  }
  errors: SyncError[]
  warnings: string[]
}

export interface ExternalApiResponse {
  success: boolean
  data: Professional[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    hasMore: boolean
  }
  errors?: string[]
}

export interface ProfessionalValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  normalizedData?: Professional
}

export interface SyncConfiguration {
  batchSize: number
  maxRetries: number
  retryDelay: number
  timeout: number
  enableValidation: boolean
  enableAuditLog: boolean
  conflictResolution: 'skip' | 'update' | 'error'
  fieldMappings?: Record<string, string>
}

export interface ProfessionalConflict {
  existingProfessional: Professional
  newProfessional: Professional
  conflictFields: string[]
  resolution: 'skip' | 'update' | 'manual'
  resolvedData?: Professional
}

export interface SyncStatistics {
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  lastSyncDate: string
  averageExecutionTime: number
  totalProfessionalsManaged: number
  activeProfessionals: number
  inactiveProfessionals: number
  departmentDistribution: Record<string, number>
  roleDistribution: Record<string, number>
  contractTypeDistribution: Record<string, number>
}

export interface ProfessionalSearchFilters {
  name?: string
  email?: string
  department?: string
  role?: string
  status?: 'active' | 'inactive' | 'on_leave' | 'all'
  contractType?: 'clt' | 'pj' | 'freelancer' | 'intern'
  skills?: string[]
  manager?: string
  costCenter?: string
  location?: string
  salaryRange?: {
    min?: number
    max?: number
  }
  workloadRange?: {
    min?: number
    max?: number
  }
  startDateRange?: {
    from?: string
    to?: string
  }
  lastSyncAfter?: string
}

export interface ProfessionalBulkOperation {
  operation: 'create' | 'update' | 'delete' | 'activate' | 'deactivate'
  professionals: Professional[]
  options?: {
    skipValidation?: boolean
    dryRun?: boolean
    continueOnError?: boolean
  }
}

export interface ProfessionalBulkResult {
  success: boolean
  totalProcessed: number
  successful: number
  failed: number
  results: {
    professionalId: string
    success: boolean
    error?: string
    data?: Professional
  }[]
  errors: string[]
  warnings: string[]
}

export interface ProfessionalAuditLog {
  id: string
  professionalId: string
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated' | 'synced'
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  performedBy: string
  performedAt: string
  source: 'manual' | 'sync' | 'api' | 'import'
  details?: Record<string, any>
}

export interface ProfessionalReport {
  type: 'summary' | 'detailed' | 'payroll' | 'performance' | 'compliance'
  filters: ProfessionalSearchFilters
  data: any
  generatedAt: string
  generatedBy: string
  format: 'json' | 'csv' | 'excel' | 'pdf'
}

export interface PayrollData {
  professionalId: string
  period: string
  baseSalary: number
  overtime: number
  bonuses: number
  deductions: number
  benefits: number
  grossPay: number
  taxes: number
  netPay: number
  workingDays: number
  workedDays: number
  absences: number
  vacationDays: number
}

export interface PerformanceData {
  professionalId: string
  reviewPeriod: string
  reviewer: string
  overallRating: number
  competencyRatings: {
    competency: string
    rating: number
    comments?: string
  }[]
  goals: {
    goal: string
    status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
    progress: number
    dueDate?: string
  }[]
  feedback: string
  developmentPlan: string[]
  nextReviewDate: string
}

export interface ComplianceCheck {
  professionalId: string
  checkType: 'documents' | 'certifications' | 'training' | 'background'
  status: 'compliant' | 'non_compliant' | 'pending' | 'expired'
  details: string
  dueDate?: string
  completedDate?: string
  notes?: string
}