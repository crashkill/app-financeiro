import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors, createCorsResponse, createErrorResponse } from '../_shared/cors.ts'
import { authenticateUser, validateRequest } from '../_shared/auth.ts'
import { logger } from '../_shared/logger.ts'
import { db } from '../_shared/database.ts'
import { ExcelParser } from './parsers/excel-parser.ts'
import { CsvParser } from './parsers/csv-parser.ts'
import { DreParser } from './parsers/dre-parser.ts'
import { DataValidator } from './validators/data-validator.ts'
import { BusinessRulesValidator } from './validators/business-rules-validator.ts'
import { FileUploadRequest, ValidationResult } from '../_shared/types.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  try {
    // const user = await authenticateUser(req)
    // if (!user) {
    //   return createErrorResponse('Unauthorized', 'AUTH_ERROR', 401)
    // }
    const user = { id: '550e8400-e29b-41d4-a716-446655440000' } // Mock user for testing

    const formData = await req.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const uploadType = formData.get('uploadType') as string

    if (!file || !projectId || !uploadType) {
      return createErrorResponse('Missing required fields', 'VALIDATION_ERROR', 400)
    }

    logger.info('Processing file upload', {
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      uploadType,
      projectId
    }, 'process-file-upload')

    // Validate file
    const fileValidation = await validateFile(file, uploadType)
    if (!fileValidation.isValid) {
      return createErrorResponse(
        `File validation failed: ${fileValidation.errors.join(', ')}`,
        'FILE_VALIDATION_ERROR',
        400
      )
    }

    // Parse file based on type
    let parser
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    switch (fileExtension) {
      case 'xlsx':
      case 'xls':
        parser = new ExcelParser()
        break
      case 'csv':
        parser = new CsvParser()
        break
      default:
        return createErrorResponse('Unsupported file format', 'UNSUPPORTED_FORMAT', 400)
    }

    // Parse file content
    const fileBuffer = await file.arrayBuffer()
    const parsedData = await parser.parse(new Uint8Array(fileBuffer), {
      uploadType,
      fileName: file.name
    })

    // Validate data based on upload type
    let validator
    switch (uploadType) {
      case 'dre':
        validator = new DreParser()
        break
      case 'financial':
        validator = new DataValidator()
        break
      default:
        validator = new DataValidator()
    }

    const validationResult = await validator.validate(parsedData, {
      projectId,
      uploadType,
      userId: user.id
    })

    // Apply business rules validation
    const businessValidator = new BusinessRulesValidator()
    const businessValidation = await businessValidator.validate(parsedData, {
      projectId,
      uploadType
    })

    // Combine validation results
    const combinedValidation: ValidationResult = {
      isValid: validationResult.isValid && businessValidation.isValid,
      errors: [...validationResult.errors, ...businessValidation.errors],
      warnings: [...validationResult.warnings, ...businessValidation.warnings],
      processedRows: validationResult.processedRows,
      totalRows: validationResult.totalRows
    }

    if (!combinedValidation.isValid) {
      logger.warn('Data validation failed', {
        userId: user.id,
        fileName: file.name,
        errors: combinedValidation.errors,
        warnings: combinedValidation.warnings
      }, 'process-file-upload')

      return createCorsResponse({
        success: false,
        validation: combinedValidation,
        message: 'Data validation failed. Please review errors and try again.'
      }, 400)
    }

    // Process and save data
    const batchId = crypto.randomUUID()
    const processedRecords = await processData(parsedData, {
      projectId,
      uploadType,
      userId: user.id,
      fileName: file.name,
      batchId
    })

    // Save to database
    let savedRecords
    switch (uploadType) {
      case 'dre':
        savedRecords = await db.insertDreData(processedRecords)
        break
      case 'financial':
        savedRecords = await db.insertFinancialData(processedRecords)
        break
      default:
        throw new Error(`Unsupported upload type: ${uploadType}`)
    }

    // Log audit event
    await db.logAuditEvent({
      userId: user.id,
      action: 'FILE_UPLOAD',
      resource: uploadType,
      resourceId: projectId,
      changes: {
        fileName: file.name,
        recordsProcessed: processedRecords.length,
        batchId
      },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    })

    logger.info('File processed successfully', {
      userId: user.id,
      fileName: file.name,
      recordsProcessed: processedRecords.length,
      batchId
    }, 'process-file-upload')

    return createCorsResponse({
      success: true,
      data: {
        batchId,
        recordsProcessed: processedRecords.length,
        validation: combinedValidation
      },
      message: 'File processed successfully'
    })

  } catch (error) {
    logger.error('Error processing file upload', {
      error: error.message,
      stack: error.stack
    }, 'process-file-upload')

    return createErrorResponse(
      error.message || 'Internal server error',
      'PROCESSING_ERROR'
    )
  }
})

async function validateFile(file: File, uploadType: string): Promise<{ isValid: boolean, errors: string[] }> {
  const errors: string[] = []
  
  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    errors.push('File size exceeds 50MB limit')
  }
  
  // Check file extension (more reliable than MIME type)
  const allowedExtensions = ['xlsx', 'xls', 'csv']
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !allowedExtensions.includes(extension)) {
    errors.push('Invalid file extension. Only .xlsx, .xls, and .csv files are allowed')
  }
  
  // Optional: Check file type for additional validation
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'application/vnd.ms-excel', 
    'text/csv', 
    'text/plain',
    'application/octet-stream' // Common fallback type
  ]
  // Only warn if type is not recognized, don't fail validation
  if (!allowedTypes.includes(file.type)) {
    console.warn(`Unexpected file type '${file.type}' for file '${file.name}', but proceeding based on extension`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

async function processData(data: any[], options: {
  projectId: string
  uploadType: string
  userId: string
  fileName: string
  batchId: string
}): Promise<any[]> {
  const processedRecords = []
  const timestamp = new Date().toISOString()
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    
    let processedRecord: any = {}
    
    // Add specific processing based on upload type
    switch (options.uploadType) {
      case 'dre':
        processedRecord = {
          codigo_conta: String(row.account_code || '').trim(),
          nome_conta: String(row.account_name || '').trim(),
          valor: Number(row.amount || 0),
          ano: Number(row.period_year),
          mes: Number(row.period_month),
          situacao: row.account_situation || determineAccountSituation(row),
          agrupamento: row.account_grouping || determineAccountGrouping(row)
          // usuario_id: options.userId // Removido temporariamente para teste
        }
        break
      case 'financial':
        processedRecord = {
          ...row,
          project_reference: options.projectId,
          upload_batch_id: options.batchId,
          source_file_name: options.fileName,
          uploaded_by: options.userId,
          uploaded_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp,
          status: 'processed',
          nature: determineTransactionNature(row),
          account_summary: determineAccountSummary(row)
        }
        break
    }
    
    processedRecords.push(processedRecord)
  }
  
  return processedRecords
}

function determineAccountSituation(row: any): string {
  // Business logic to determine account situation
  const amount = parseFloat(row.amount || 0)
  return amount >= 0 ? 'ATIVO' : 'PASSIVO'
}

function determineAccountGrouping(row: any): string {
  // Business logic to determine account grouping
  const accountCode = row.account_code || ''
  
  if (accountCode.startsWith('1')) return 'ATIVO'
  if (accountCode.startsWith('2')) return 'PASSIVO'
  if (accountCode.startsWith('3')) return 'PATRIMÔNIO LÍQUIDO'
  if (accountCode.startsWith('4')) return 'RECEITA'
  if (accountCode.startsWith('5')) return 'CUSTO'
  if (accountCode.startsWith('6')) return 'DESPESA'
  
  return 'OUTROS'
}

function determineTransactionNature(row: any): string {
  // Business logic to determine transaction nature
  const accountCode = row.account_code || ''
  const amount = parseFloat(row.amount || 0)
  
  if (accountCode.startsWith('4') || amount > 0) return 'RECEITA'
  if (accountCode.startsWith('5')) return 'CUSTO'
  if (accountCode.startsWith('6')) return 'DESPESA'
  
  return 'OUTROS'
}

function determineAccountSummary(row: any): string {
  // Business logic to determine account summary
  const accountName = (row.account_name || '').toUpperCase()
  
  if (accountName.includes('SALÁRIO') || accountName.includes('CLT')) return 'SALÁRIOS CLT'
  if (accountName.includes('TERCEIRO') || accountName.includes('SUBCONTRAT')) return 'TERCEIROS'
  if (accountName.includes('DESONERA')) return 'DESONERAÇÃO DA FOLHA'
  if (accountName.includes('RECEITA')) return 'RECEITA OPERACIONAL'
  
  return 'OUTROS'
}