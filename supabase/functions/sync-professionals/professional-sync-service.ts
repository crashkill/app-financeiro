import { logger } from '../_shared/logger.ts'
import { DatabaseService } from '../_shared/database.ts'
import type {
  Professional,
  ProfessionalSyncRequest,
  SyncResult,
  SyncError,
  ExternalApiResponse,
  ProfessionalValidationResult,
  ProfessionalConflict,
  SyncConfiguration
} from './types.ts'

export class ProfessionalSyncService {
  private dbService: DatabaseService
  private config: SyncConfiguration

  constructor(dbService: DatabaseService) {
    this.dbService = dbService
    this.config = {
      batchSize: 50,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      enableValidation: true,
      enableAuditLog: true,
      conflictResolution: 'update',
      fieldMappings: {
        'full_name': 'name',
        'email_address': 'email',
        'job_title': 'role',
        'dept': 'department',
        'monthly_salary': 'salary',
        'hourly_wage': 'hourlyRate',
        'employment_status': 'status',
        'contract_type': 'contractType',
        'hire_date': 'startDate',
        'termination_date': 'endDate'
      }
    }
  }

  async syncProfessionals(request: ProfessionalSyncRequest, userId: string): Promise<SyncResult> {
    const startTime = Date.now()
    
    const result: SyncResult = {
      success: false,
      message: '',
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      processedIds: [],
      skippedIds: [],
      errorIds: [],
      executionTime: 0,
      lastSyncTimestamp: new Date().toISOString()
    }

    try {
      logger.info('Starting professional sync', {
        syncType: request.syncType,
        userId,
        professionalCount: request.professionals?.length || 0
      }, 'professional-sync-service')

      let professionals: Professional[] = []

      // Get professionals based on sync type
      switch (request.syncType) {
        case 'full':
        case 'incremental':
          professionals = request.professionals || []
          break
        case 'external_api':
          professionals = await this.fetchFromExternalApi(request.externalApiConfig!)
          break
        default:
          throw new Error(`Unsupported sync type: ${request.syncType}`)
      }

      // Apply filters if provided
      if (request.filters) {
        professionals = this.applyFilters(professionals, request.filters)
      }

      result.totalProcessed = professionals.length

      if (professionals.length === 0) {
        result.success = true
        result.message = 'No professionals to sync'
        result.executionTime = Date.now() - startTime
        return result
      }

      // Process in batches
      const batches = this.createBatches(professionals, this.config.batchSize)
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        logger.debug(`Processing batch ${i + 1}/${batches.length}`, {
          batchSize: batch.length
        }, 'professional-sync-service')

        await this.processBatch(batch, request, result, userId)
      }

      // Handle deletions for full sync
      if (request.syncType === 'full' && request.options?.deleteNotFound) {
        await this.handleDeletions(professionals, result, userId)
      }

      result.success = result.errors.length === 0
      result.message = result.success 
        ? `Successfully synced ${result.created + result.updated} professionals`
        : `Sync completed with ${result.errors.length} errors`
      
      result.executionTime = Date.now() - startTime

      logger.info('Professional sync completed', {
        success: result.success,
        totalProcessed: result.totalProcessed,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors.length,
        executionTime: result.executionTime
      }, 'professional-sync-service')

      return result

    } catch (error) {
      result.success = false
      result.message = `Sync failed: ${error.message}`
      result.executionTime = Date.now() - startTime
      result.errors.push({
        error: error.message,
        code: 'SYNC_FAILED'
      })

      logger.error('Professional sync failed', {
        error: error.message,
        stack: error.stack,
        userId,
        syncType: request.syncType
      }, 'professional-sync-service')

      return result
    }
  }

  private async fetchFromExternalApi(config: NonNullable<ProfessionalSyncRequest['externalApiConfig']>): Promise<Professional[]> {
    logger.info('Fetching professionals from external API', {
      endpoint: config.endpoint
    }, 'professional-sync-service')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers
    }

    if (config.apiKey) {
      headers['X-API-Key'] = config.apiKey
    }

    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.config.timeout)

    try {
      const response = await fetch(config.endpoint, {
        method: 'GET',
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`External API request failed: ${response.status} ${response.statusText}`)
      }

      const apiResponse: ExternalApiResponse = await response.json()
      
      if (!apiResponse.success) {
        throw new Error(`External API returned error: ${apiResponse.errors?.join(', ')}`)
      }

      const professionals = apiResponse.data.map(prof => this.mapExternalData(prof))
      
      logger.info('Successfully fetched professionals from external API', {
        count: professionals.length
      }, 'professional-sync-service')

      return professionals

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('External API request timed out')
      }
      
      throw new Error(`Failed to fetch from external API: ${error.message}`)
    }
  }

  private mapContractType(contractType: string): string {
    const mapping: Record<string, string> = {
      'clt': 'CLT',
      'pj': 'PJ',
      'freelancer': 'Terceirizado',
      'intern': 'Estagiário'
    }
    return mapping[contractType] || 'CLT'
  }

  private mapExternalData(externalData: any): Professional {
    const mapped: Professional = {
      name: '',
      email: '',
      role: '',
      status: 'active',
      contractType: 'clt'
    }

    // Apply field mappings
    for (const [externalField, internalField] of Object.entries(this.config.fieldMappings || {})) {
      if (externalData[externalField] !== undefined) {
        (mapped as any)[internalField] = externalData[externalField]
      }
    }

    // Direct mappings for fields that match
    const directFields = ['name', 'email', 'role', 'department', 'salary', 'hourlyRate', 'workload', 'status', 'contractType', 'startDate', 'endDate', 'skills', 'certifications', 'manager', 'costCenter', 'location', 'phone']
    
    for (const field of directFields) {
      if (externalData[field] !== undefined) {
        (mapped as any)[field] = externalData[field]
      }
    }

    // Set external ID for tracking
    if (externalData.id) {
      mapped.externalId = externalData.id.toString()
    }

    return mapped
  }

  private applyFilters(professionals: Professional[], filters: NonNullable<ProfessionalSyncRequest['filters']>): Professional[] {
    let filtered = professionals

    if (filters.departments && filters.departments.length > 0) {
      filtered = filtered.filter(p => p.department && filters.departments!.includes(p.department))
    }

    if (filters.roles && filters.roles.length > 0) {
      filtered = filtered.filter(p => filters.roles!.includes(p.role))
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status)
    }

    if (filters.lastSyncAfter) {
      const afterDate = new Date(filters.lastSyncAfter)
      filtered = filtered.filter(p => {
        if (!p.syncedAt) return true
        return new Date(p.syncedAt) > afterDate
      })
    }

    logger.debug('Applied filters to professionals', {
      originalCount: professionals.length,
      filteredCount: filtered.length,
      filters
    }, 'professional-sync-service')

    return filtered
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  private async processBatch(
    professionals: Professional[], 
    request: ProfessionalSyncRequest, 
    result: SyncResult, 
    userId: string
  ): Promise<void> {
    for (const professional of professionals) {
      try {
        await this.processProfessional(professional, request, result, userId)
      } catch (error) {
        const syncError: SyncError = {
          professionalId: professional.id,
          externalId: professional.externalId,
          email: professional.email,
          error: error.message,
          code: 'PROCESSING_ERROR'
        }
        
        result.errors.push(syncError)
        result.errorIds.push(professional.email)
        
        logger.error('Error processing professional', {
          professional: {
            id: professional.id,
            email: professional.email,
            name: professional.name
          },
          error: error.message
        }, 'professional-sync-service')
      }
    }
  }

  private async processProfessional(
    professional: Professional, 
    request: ProfessionalSyncRequest, 
    result: SyncResult, 
    userId: string
  ): Promise<void> {
    // Validate professional data
    if (this.config.enableValidation && !request.options?.skipValidation) {
      const validation = this.validateProfessional(professional)
      if (!validation.isValid) {
        const syncError: SyncError = {
          professionalId: professional.id,
          externalId: professional.externalId,
          email: professional.email,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          code: 'VALIDATION_ERROR'
        }
        result.errors.push(syncError)
        result.errorIds.push(professional.email)
        return
      }
      
      if (validation.warnings.length > 0) {
        result.warnings.push(...validation.warnings.map(w => `${professional.email}: ${w}`))
      }
      
      // Use normalized data
      professional = validation.normalizedData || professional
    }

    // Check if professional exists
    const existing = await this.findExistingProfessional(professional)
    
    if (existing) {
      // Handle update
      if (request.options?.updateExisting !== false) {
        const conflict = this.detectConflicts(existing, professional)
        
        if (conflict.conflictFields.length > 0) {
          const resolution = await this.resolveConflict(conflict, request)
          
          if (resolution.resolution === 'skip') {
            result.skipped++
            result.skippedIds.push(professional.email)
            return
          }
          
          professional = resolution.resolvedData || professional
        }
        
        await this.updateProfessional(existing.id!, professional, userId)
        result.updated++
        result.processedIds.push(professional.email)
        
        logger.debug('Professional updated', {
          id: existing.id,
          email: professional.email
        }, 'professional-sync-service')
      } else {
        result.skipped++
        result.skippedIds.push(professional.email)
      }
    } else {
      // Handle creation
      const newId = await this.createProfessional(professional, userId)
      result.created++
      result.processedIds.push(professional.email)
      
      logger.debug('Professional created', {
        id: newId,
        email: professional.email
      }, 'professional-sync-service')
    }
  }

  private validateProfessional(professional: Professional): ProfessionalValidationResult {
    const result: ProfessionalValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      normalizedData: { ...professional }
    }

    // Required field validation
    if (!professional.name || professional.name.trim().length === 0) {
      result.errors.push('Name is required')
      result.isValid = false
    }

    if (!professional.email || professional.email.trim().length === 0) {
      result.errors.push('Email is required')
      result.isValid = false
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(professional.email)) {
        result.errors.push('Invalid email format')
        result.isValid = false
      }
    }

    if (!professional.role || professional.role.trim().length === 0) {
      result.errors.push('Role is required')
      result.isValid = false
    }

    // Normalize data
    if (result.normalizedData) {
      result.normalizedData.name = professional.name?.trim()
      result.normalizedData.email = professional.email?.toLowerCase().trim()
      result.normalizedData.role = professional.role?.trim()
      
      // Set defaults
      if (!result.normalizedData.status) {
        result.normalizedData.status = 'active'
      }
      
      if (!result.normalizedData.contractType) {
        result.normalizedData.contractType = 'clt'
      }
      
      // Validate numeric fields
      if (result.normalizedData.salary && result.normalizedData.salary < 0) {
        result.warnings.push('Salary cannot be negative')
        result.normalizedData.salary = 0
      }
      
      if (result.normalizedData.hourlyRate && result.normalizedData.hourlyRate < 0) {
        result.warnings.push('Hourly rate cannot be negative')
        result.normalizedData.hourlyRate = 0
      }
      
      if (result.normalizedData.workload && (result.normalizedData.workload < 0 || result.normalizedData.workload > 100)) {
        result.warnings.push('Workload must be between 0 and 100')
        result.normalizedData.workload = Math.max(0, Math.min(100, result.normalizedData.workload))
      }
    }

    return result
  }

  private async findExistingProfessional(professional: Professional): Promise<Professional | null> {
    const supabase = this.dbService.getClient()
    
    // Try to find by email first (most reliable)
    let query = supabase
      .from('profissionais')
      .select('*')
      .eq('email', professional.email.toLowerCase())
      .single()
    
    const { data, error } = await query
    
    if (data) {
      return data
    }
    
    // If not found by email and we have an external ID, try that
    if (professional.externalId) {
      const { data: externalData } = await supabase
        .from('professionals')
        .select('*')
        .eq('external_id', professional.externalId)
        .single()
      
      if (externalData) {
        return externalData
      }
    }
    
    return null
  }

  private detectConflicts(existing: Professional, incoming: Professional): ProfessionalConflict {
    const conflictFields: string[] = []
    
    const fieldsToCheck = ['name', 'role', 'department', 'salary', 'hourlyRate', 'workload', 'status', 'contractType', 'manager', 'costCenter']
    
    for (const field of fieldsToCheck) {
      const existingValue = (existing as any)[field]
      const incomingValue = (incoming as any)[field]
      
      if (existingValue !== incomingValue && incomingValue !== undefined && incomingValue !== null) {
        conflictFields.push(field)
      }
    }
    
    return {
      existingProfessional: existing,
      newProfessional: incoming,
      conflictFields,
      resolution: 'update' // Default resolution
    }
  }

  private async resolveConflict(conflict: ProfessionalConflict, request: ProfessionalSyncRequest): Promise<ProfessionalConflict> {
    const resolution = this.config.conflictResolution
    
    switch (resolution) {
      case 'skip':
        conflict.resolution = 'skip'
        break
      case 'update':
        conflict.resolution = 'update'
        conflict.resolvedData = {
          ...conflict.existingProfessional,
          ...conflict.newProfessional,
          id: conflict.existingProfessional.id,
          updatedAt: new Date().toISOString()
        }
        break
      case 'error':
        throw new Error(`Conflict detected for professional ${conflict.newProfessional.email}: ${conflict.conflictFields.join(', ')}`)
      default:
        conflict.resolution = 'update'
        conflict.resolvedData = conflict.newProfessional
    }
    
    return conflict
  }

  private async createProfessional(professional: Professional, userId: string): Promise<string> {
    const supabase = this.dbService.getClient()
    
    const professionalData = {
      nome: professional.name,
      email: professional.email.toLowerCase(),
      telefone: professional.phone || null,
      departamento: professional.department || null,
      cargo: professional.role || null,
      salario: professional.salary || null,
      data_admissao: professional.startDate || null,
      status: professional.status === 'active' ? 'Ativo' : 'Inativo',
      tipo_contrato: this.mapContractType(professional.contractType),
      id_externo: professional.externalId || null,
      dados_externos: professional.documents ? JSON.stringify(professional.documents) : null,
      usuario_id: null, // Will be set by RLS
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      sincronizado_em: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('profissionais')
      .insert(professionalData)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create professional: ${error.message}`)
    }
    
    return data.id
  }

  private async updateProfessional(id: string, professional: Professional, userId: string): Promise<void> {
    const supabase = this.dbService.getClient()
    
    const updateData = {
      nome: professional.name,
      email: professional.email.toLowerCase(),
      telefone: professional.phone || null,
      departamento: professional.department || null,
      cargo: professional.role || null,
      salario: professional.salary || null,
      data_admissao: professional.startDate || null,
      status: professional.status === 'active' ? 'Ativo' : 'Inativo',
      tipo_contrato: this.mapContractType(professional.contractType),
      id_externo: professional.externalId || null,
      dados_externos: professional.documents ? JSON.stringify(professional.documents) : null,
      atualizado_em: new Date().toISOString(),
      sincronizado_em: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('profissionais')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      throw new Error(`Failed to update professional: ${error.message}`)
    }
  }

  private async handleDeletions(syncedProfessionals: Professional[], result: SyncResult, userId: string): Promise<void> {
    const supabase = this.dbService.getClient()
    
    // Get all existing professionals
    const { data: existingProfessionals, error } = await supabase
      .from('profissionais')
      .select('id, email')
      .eq('status', 'active')
    
    if (error) {
      logger.error('Failed to fetch existing professionals for deletion check', {
        error: error.message
      }, 'professional-sync-service')
      return
    }
    
    const syncedEmails = new Set(syncedProfessionals.map(p => p.email.toLowerCase()))
    const toDelete = existingProfessionals.filter(p => !syncedEmails.has(p.email.toLowerCase()))
    
    for (const professional of toDelete) {
      try {
        await supabase
          .from('professionals')
          .update({
            status: 'inactive',
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', professional.id)
        
        result.deleted = (result.deleted || 0) + 1
        
        logger.debug('Professional marked as inactive', {
          id: professional.id,
          email: professional.email
        }, 'professional-sync-service')
        
      } catch (error) {
        result.warnings.push(`Failed to deactivate professional ${professional.email}: ${error.message}`)
      }
    }
  }
}