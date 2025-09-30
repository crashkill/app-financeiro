import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors, createCorsResponse, createErrorResponse } from '../_shared/cors.ts'
import { authenticateUser, requirePermission } from '../_shared/auth.ts'
import { logger } from '../_shared/logger.ts'
import { DatabaseService } from '../_shared/database.ts'
import { ProfessionalSyncService } from './professional-sync-service.ts'
import type { 
  ProfessionalSyncRequest, 
  ProfessionalSyncResponse,
  Professional,
  SyncResult
} from './types.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  try {
    logger.info('Professional sync request received', {
      method: req.method,
      url: req.url
    }, 'sync-professionals')

    // Only allow POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405)
    }

    // Authenticate user
    const user = await authenticateUser(req)
    if (!user) {
      return createErrorResponse('Authentication required', 401)
    }

    // Check permissions
    const hasPermission = requirePermission(user, 'manage_professionals')
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403)
    }

    // Parse request body
    let requestData: ProfessionalSyncRequest
    try {
      requestData = await req.json()
    } catch (error) {
      logger.error('Invalid JSON in request body', { error: error.message }, 'sync-professionals')
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Validate request data
    const validationResult = validateSyncRequest(requestData)
    if (!validationResult.isValid) {
      logger.warn('Invalid sync request', {
        errors: validationResult.errors,
        userId: user.id
      }, 'sync-professionals')
      return createErrorResponse(`Validation failed: ${validationResult.errors.join(', ')}`, 400)
    }

    // Initialize services
    const dbService = new DatabaseService()
    const syncService = new ProfessionalSyncService(dbService)

    // Perform synchronization
    const syncResult = await syncService.syncProfessionals(requestData, user.id)

    // Log audit event
    await dbService.logAuditEvent({
      userId: user.id,
      action: 'sync_professionals',
      resource: 'professionals',
      resourceId: null,
      changes: {
        syncType: requestData.syncType,
        totalRecords: requestData.professionals?.length || 0,
        created: syncResult.created,
        updated: syncResult.updated,
        errors: syncResult.errors.length
      },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    })

    // Prepare response
    const response: ProfessionalSyncResponse = {
      success: syncResult.success,
      message: syncResult.message,
      data: {
        syncResult,
        summary: {
          totalProcessed: syncResult.totalProcessed,
          created: syncResult.created,
          updated: syncResult.updated,
          skipped: syncResult.skipped,
          errors: syncResult.errors.length
        }
      },
      errors: syncResult.errors,
      warnings: syncResult.warnings
    }

    logger.info('Professional sync completed', {
      userId: user.id,
      syncType: requestData.syncType || 'manual',
      totalProcessed: syncResult.totalProcessed,
      created: syncResult.created,
      updated: syncResult.updated,
      errors: syncResult.errors.length
    }, 'sync-professionals')

    return createCorsResponse(response, 200)

  } catch (error) {
    logger.error('Unexpected error in professional sync', {
      error: error.message,
      stack: error.stack
    }, 'sync-professionals')

    return createErrorResponse('Internal server error', 500)
  }
})

function validateSyncRequest(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Set default syncType if not provided
  if (!data.syncType) {
    data.syncType = 'manual'
  }

  // Validate syncType
  if (!['full', 'incremental', 'external_api', 'manual'].includes(data.syncType)) {
    errors.push('syncType must be one of: full, incremental, external_api, manual')
  }

  // Validate based on sync type
  if (data.syncType === 'full' || data.syncType === 'incremental' || data.syncType === 'manual') {
    if (!data.professionals || !Array.isArray(data.professionals)) {
      errors.push('professionals array is required')
    } else if (data.professionals.length === 0) {
      errors.push('professionals array cannot be empty')
    } else {
      // Validate each professional record
      for (let i = 0; i < data.professionals.length; i++) {
        const prof = data.professionals[i]
        const profErrors = validateProfessional(prof, i)
        errors.push(...profErrors)
      }
    }
  }

  if (data.syncType === 'external_api') {
    if (!data.externalApiConfig) {
      errors.push('externalApiConfig is required for external API sync')
    } else {
      if (!data.externalApiConfig.endpoint) {
        errors.push('externalApiConfig.endpoint is required')
      }
      if (!data.externalApiConfig.apiKey && !data.externalApiConfig.authToken) {
        errors.push('externalApiConfig.apiKey or authToken is required')
      }
    }
  }

  // Validate filters if provided
  if (data.filters) {
    if (data.filters.departments && !Array.isArray(data.filters.departments)) {
      errors.push('filters.departments must be an array')
    }
    if (data.filters.roles && !Array.isArray(data.filters.roles)) {
      errors.push('filters.roles must be an array')
    }
    if (data.filters.status && !['active', 'inactive', 'all'].includes(data.filters.status)) {
      errors.push('filters.status must be one of: active, inactive, all')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function validateProfessional(prof: any, index: number): string[] {
  const errors: string[] = []
  const prefix = `professionals[${index}]`

  // Required fields
  if (!prof.name || typeof prof.name !== 'string' || prof.name.trim().length === 0) {
    errors.push(`${prefix}.name is required and must be a non-empty string`)
  }

  if (!prof.email || typeof prof.email !== 'string') {
    errors.push(`${prefix}.email is required and must be a string`)
  } else {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(prof.email)) {
      errors.push(`${prefix}.email must be a valid email address`)
    }
  }

  if (!prof.role || typeof prof.role !== 'string') {
    errors.push(`${prefix}.role is required and must be a string`)
  }

  // Optional but validated fields
  if (prof.salary !== undefined && (typeof prof.salary !== 'number' || prof.salary < 0)) {
    errors.push(`${prefix}.salary must be a positive number`)
  }

  if (prof.hourlyRate !== undefined && (typeof prof.hourlyRate !== 'number' || prof.hourlyRate < 0)) {
    errors.push(`${prefix}.hourlyRate must be a positive number`)
  }

  if (prof.workload !== undefined && (typeof prof.workload !== 'number' || prof.workload < 0 || prof.workload > 100)) {
    errors.push(`${prefix}.workload must be a number between 0 and 100`)
  }

  if (prof.status && !['active', 'inactive', 'on_leave'].includes(prof.status)) {
    errors.push(`${prefix}.status must be one of: active, inactive, on_leave`)
  }

  if (prof.contractType && !['clt', 'pj', 'freelancer', 'intern'].includes(prof.contractType)) {
    errors.push(`${prefix}.contractType must be one of: clt, pj, freelancer, intern`)
  }

  if (prof.startDate) {
    const startDate = new Date(prof.startDate)
    if (isNaN(startDate.getTime())) {
      errors.push(`${prefix}.startDate must be a valid date`)
    }
  }

  if (prof.endDate) {
    const endDate = new Date(prof.endDate)
    if (isNaN(endDate.getTime())) {
      errors.push(`${prefix}.endDate must be a valid date`)
    }
    
    if (prof.startDate) {
      const startDate = new Date(prof.startDate)
      if (endDate <= startDate) {
        errors.push(`${prefix}.endDate must be after startDate`)
      }
    }
  }

  // Validate skills array if provided
  if (prof.skills && !Array.isArray(prof.skills)) {
    errors.push(`${prefix}.skills must be an array`)
  }

  // Validate certifications array if provided
  if (prof.certifications && !Array.isArray(prof.certifications)) {
    errors.push(`${prefix}.certifications must be an array`)
  }

  return errors
}