import { logger } from '../../_shared/logger.ts'
import { ValidationResult } from '../../_shared/types.ts'

export interface DataValidationOptions {
  projectId: string
  uploadType: string
  userId: string
  allowEmptyValues?: boolean
  strictMode?: boolean
}

export class DataValidator {
  async validate(data: any[], options: DataValidationOptions): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    let processedRows = 0
    const totalRows = data.length

    try {
      logger.info('Starting data validation', {
        totalRows,
        uploadType: options.uploadType,
        projectId: options.projectId,
        userId: options.userId
      }, 'data-validator')

      if (!data || data.length === 0) {
        errors.push('No data provided for validation')
        return {
          isValid: false,
          errors,
          warnings,
          processedRows: 0,
          totalRows: 0
        }
      }

      // Validate each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNumber = i + 1

        // Check if row is empty
        if (this.isEmptyRow(row)) {
          if (!options.allowEmptyValues) {
            warnings.push(`Row ${rowNumber}: Empty row detected`)
          }
          continue
        }

        // Validate based on upload type
        const rowValidation = this.validateRow(row, rowNumber, options)
        errors.push(...rowValidation.errors)
        warnings.push(...rowValidation.warnings)

        if (rowValidation.errors.length === 0) {
          processedRows++
        }
      }

      // Additional validations
      this.validateDataConsistency(data, options, errors, warnings)

      logger.info('Data validation completed', {
        totalRows,
        processedRows,
        errorsCount: errors.length,
        warningsCount: warnings.length
      }, 'data-validator')

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        processedRows,
        totalRows
      }

    } catch (error) {
      logger.error('Error during data validation', {
        error: error.message,
        stack: error.stack
      }, 'data-validator')

      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings,
        processedRows,
        totalRows
      }
    }
  }

  private isEmptyRow(row: any): boolean {
    if (!row || typeof row !== 'object') {
      return true
    }

    const values = Object.values(row)
    return values.every(value => 
      value === null || 
      value === undefined || 
      value === '' || 
      (typeof value === 'string' && value.trim() === '')
    )
  }

  private validateRow(row: any, rowNumber: number, options: DataValidationOptions): {
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    switch (options.uploadType) {
      case 'dre':
        this.validateDreRow(row, rowNumber, errors, warnings, options)
        break
      case 'financial':
        this.validateFinancialRow(row, rowNumber, errors, warnings, options)
        break
      default:
        this.validateGenericRow(row, rowNumber, errors, warnings, options)
    }

    return { errors, warnings }
  }

  private validateDreRow(row: any, rowNumber: number, errors: string[], warnings: string[], options: DataValidationOptions): void {
    // Required fields for DRE
    const requiredFields = ['codigo_conta', 'nome_conta', 'valor', 'ano', 'mes']
    
    for (const field of requiredFields) {
      if (!row[field] && row[field] !== 0) {
        errors.push(`Row ${rowNumber}: Missing required field '${field}'`)
      }
    }

    // Validate data types
    if (row.valor !== undefined && isNaN(Number(row.valor))) {
      errors.push(`Row ${rowNumber}: Field 'valor' must be a valid number`)
    }

    if (row.ano !== undefined && (isNaN(Number(row.ano)) || Number(row.ano) < 2000 || Number(row.ano) > 2100)) {
      errors.push(`Row ${rowNumber}: Field 'ano' must be a valid year between 2000 and 2100`)
    }

    if (row.mes !== undefined && (isNaN(Number(row.mes)) || Number(row.mes) < 1 || Number(row.mes) > 12)) {
      errors.push(`Row ${rowNumber}: Field 'mes' must be a valid month between 1 and 12`)
    }

    // Validate optional fields
    if (row.situacao && !['Ativo', 'Inativo'].includes(row.situacao)) {
      warnings.push(`Row ${rowNumber}: Unknown 'situacao' value '${row.situacao}', will use 'Ativo' as default`)
    }
  }

  private validateFinancialRow(row: any, rowNumber: number, errors: string[], warnings: string[], options: DataValidationOptions): void {
    // Required fields for financial data
    const requiredFields = ['codigo_conta', 'data_transacao', 'valor']
    
    for (const field of requiredFields) {
      if (!row[field] && row[field] !== 0) {
        errors.push(`Row ${rowNumber}: Missing required field '${field}'`)
      }
    }

    // Validate data types
    if (row.valor !== undefined && isNaN(Number(row.valor))) {
      errors.push(`Row ${rowNumber}: Field 'valor' must be a valid number`)
    }

    // Validate date format
    if (row.data_transacao && !this.isValidDate(row.data_transacao)) {
      errors.push(`Row ${rowNumber}: Field 'data_transacao' must be a valid date`)
    }

    // Validate natureza
    if (row.natureza && !['Débito', 'Crédito'].includes(row.natureza)) {
      warnings.push(`Row ${rowNumber}: Unknown 'natureza' value '${row.natureza}', will use 'Débito' as default`)
    }
  }

  private validateGenericRow(row: any, rowNumber: number, errors: string[], warnings: string[], options: DataValidationOptions): void {
    // Basic validation for generic data
    const keys = Object.keys(row)
    
    if (keys.length === 0) {
      warnings.push(`Row ${rowNumber}: Row appears to be empty`)
    }

    // Check for suspicious data patterns
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string' && value.length > 1000) {
        warnings.push(`Row ${rowNumber}: Field '${key}' contains very long text (${value.length} characters)`)
      }
    }
  }

  private validateDataConsistency(data: any[], options: DataValidationOptions, errors: string[], warnings: string[]): void {
    if (data.length === 0) return

    // Check for duplicate entries
    const seen = new Set()
    const duplicates = new Set()

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const key = this.generateRowKey(row, options.uploadType)
      
      if (seen.has(key)) {
        duplicates.add(key)
        warnings.push(`Row ${i + 1}: Potential duplicate entry detected`)
      } else {
        seen.add(key)
      }
    }

    // Check for data consistency across periods
    if (options.uploadType === 'dre') {
      this.validateDreConsistency(data, errors, warnings)
    }
  }

  private generateRowKey(row: any, uploadType: string): string {
    switch (uploadType) {
      case 'dre':
        return `${row.codigo_conta}-${row.ano}-${row.mes}`
      case 'financial':
        return `${row.codigo_conta}-${row.data_transacao}-${row.valor}`
      default:
        return JSON.stringify(row)
    }
  }

  private validateDreConsistency(data: any[], errors: string[], warnings: string[]): void {
    // Group by period
    const periods = new Map<string, any[]>()
    
    for (const row of data) {
      if (row.ano && row.mes) {
        const periodKey = `${row.ano}-${String(row.mes).padStart(2, '0')}`
        if (!periods.has(periodKey)) {
          periods.set(periodKey, [])
        }
        periods.get(periodKey)!.push(row)
      }
    }

    // Check each period for basic DRE structure
    for (const [period, periodData] of periods) {
      const accounts = new Set(periodData.map(row => row.codigo_conta))
      
      // Check for essential account groups
      const hasRevenue = periodData.some(row => 
        row.codigo_conta && row.codigo_conta.toString().startsWith('3')
      )
      
      if (!hasRevenue) {
        warnings.push(`Period ${period}: No revenue accounts found (accounts starting with 3)`)
      }
    }
  }

  private isValidDate(dateString: string): boolean {
    if (!dateString) return false
    
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }
}