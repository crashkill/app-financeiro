import { logger } from '../../_shared/logger.ts'
import { ValidationResult } from '../../_shared/types.ts'

export class DreParser {
  async validate(data: any[], options: {
    projectId: string
    uploadType: string
    userId: string
  }): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    let processedRows = 0
    const totalRows = data.length

    try {
      logger.info('Starting DRE data validation', {
        totalRows,
        projectId: options.projectId,
        userId: options.userId
      }, 'dre-parser')

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNumber = i + 1

        // Validate required fields
        if (!row.account_code) {
          errors.push(`Row ${rowNumber}: Missing account_code`)
          continue
        }

        if (!row.account_name) {
          errors.push(`Row ${rowNumber}: Missing account_name`)
          continue
        }

        if (row.amount === undefined || row.amount === null) {
          errors.push(`Row ${rowNumber}: Missing amount`)
          continue
        }

        if (!row.period_year) {
          errors.push(`Row ${rowNumber}: Missing period_year`)
          continue
        }

        if (!row.period_month) {
          errors.push(`Row ${rowNumber}: Missing period_month`)
          continue
        }

        // Validate data types
        if (isNaN(Number(row.amount))) {
          errors.push(`Row ${rowNumber}: Invalid amount - must be a number`)
          continue
        }

        if (isNaN(Number(row.period_year)) || Number(row.period_year) < 2000 || Number(row.period_year) > 2100) {
          errors.push(`Row ${rowNumber}: Invalid period_year - must be between 2000 and 2100`)
          continue
        }

        if (isNaN(Number(row.period_month)) || Number(row.period_month) < 1 || Number(row.period_month) > 12) {
          errors.push(`Row ${rowNumber}: Invalid period_month - must be between 1 and 12`)
          continue
        }

        // Validate optional fields
        if (row.account_situation && !['ATIVO', 'INATIVO', 'Ativo', 'Inativo'].includes(row.account_situation)) {
          warnings.push(`Row ${rowNumber}: Unknown account_situation value '${row.account_situation}', using 'Ativo' as default`)
          row.account_situation = 'Ativo'
        }

        processedRows++
      }

      logger.info('DRE data validation completed', {
        totalRows,
        processedRows,
        errorsCount: errors.length,
        warningsCount: warnings.length
      }, 'dre-parser')

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        processedRows,
        totalRows
      }

    } catch (error) {
      logger.error('Error during DRE validation', {
        error: error.message,
        stack: error.stack
      }, 'dre-parser')

      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings,
        processedRows,
        totalRows
      }
    }
  }

  async parse(data: any[], options: {
    projectId: string
    uploadType: string
    userId: string
  }): Promise<any[]> {
    try {
      logger.info('Starting DRE data parsing', {
        recordCount: data.length,
        projectId: options.projectId
      }, 'dre-parser')

      const parsedData = data.map((row, index) => {
        return {
          codigo_conta: String(row.account_code || '').trim(),
          nome_conta: String(row.account_name || '').trim(),
          valor: Number(row.amount || 0),
          ano: Number(row.period_year),
          mes: Number(row.period_month),
          situacao: row.account_situation || row.situacao || 'Ativo',
           agrupamento: row.account_grouping || row.agrupamento || null,
          usuario_id: options.userId,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        }
      })

      logger.info('DRE data parsing completed', {
        recordCount: parsedData.length
      }, 'dre-parser')

      return parsedData

    } catch (error) {
      logger.error('Error during DRE parsing', {
        error: error.message,
        stack: error.stack
      }, 'dre-parser')
      throw error
    }
  }
}