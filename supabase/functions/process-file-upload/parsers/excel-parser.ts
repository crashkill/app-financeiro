import { logger } from '../../_shared/logger.ts'

export class ExcelParser {
  async parse(fileBuffer: Uint8Array, options: {
    uploadType: string
    fileName: string
  }): Promise<any[]> {
    try {
      // For Deno environment, we'll use a simplified approach
      // In production, you might want to use a proper Excel parsing library
      
      logger.info('Parsing Excel file', {
        fileName: options.fileName,
        uploadType: options.uploadType,
        fileSize: fileBuffer.length
      }, 'excel-parser')

      // Convert buffer to text for CSV-like parsing
      // This is a simplified implementation
      const text = new TextDecoder().decode(fileBuffer)
      
      // For now, we'll assume the Excel file has been saved as CSV
      // In production, use a proper Excel parsing library like xlsx
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        throw new Error('File appears to be empty')
      }

      // Parse header row
      const headers = this.parseRow(lines[0])
      const normalizedHeaders = this.normalizeHeaders(headers, options.uploadType)
      
      logger.debug('Parsed headers', { headers, normalizedHeaders }, 'excel-parser')

      // Parse data rows
      const data = []
      for (let i = 1; i < lines.length; i++) {
        const row = this.parseRow(lines[i])
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue // Skip empty rows
        }

        const rowData = this.mapRowToObject(row, normalizedHeaders, options.uploadType)
        if (rowData) {
          data.push(rowData)
        }
      }

      logger.info('Excel file parsed successfully', {
        fileName: options.fileName,
        totalRows: data.length,
        headers: normalizedHeaders
      }, 'excel-parser')

      return data
    } catch (error) {
      logger.error('Error parsing Excel file', {
        error: error.message,
        fileName: options.fileName
      }, 'excel-parser')
      throw new Error(`Failed to parse Excel file: ${error.message}`)
    }
  }

  private parseRow(line: string): string[] {
    // Simple CSV parsing - in production, use a proper CSV parser
    const cells = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    cells.push(current.trim())
    return cells
  }

  private normalizeHeaders(headers: string[], uploadType: string): Record<string, string> {
    const normalized: Record<string, string> = {}
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim()
      const normalizedKey = this.getNormalizedKey(header, uploadType)
      if (normalizedKey) {
        normalized[i] = normalizedKey
      }
    }
    
    return normalized
  }

  private getNormalizedKey(header: string, uploadType: string): string | null {
    // Common mappings
    const commonMappings: Record<string, string> = {
      'código': 'account_code',
      'codigo': 'account_code',
      'code': 'account_code',
      'conta': 'account_code',
      'nome': 'account_name',
      'name': 'account_name',
      'descrição': 'account_name',
      'descricao': 'account_name',
      'description': 'account_name',
      'valor': 'amount',
      'amount': 'amount',
      'montante': 'amount',
      'saldo': 'amount',
      'ano': 'period_year',
      'year': 'period_year',
      'mês': 'period_month',
      'mes': 'period_month',
      'month': 'period_month',
      'período': 'period',
      'periodo': 'period',
      'period': 'period'
    }

    // Upload type specific mappings
    if (uploadType === 'dre') {
      const dreMappings: Record<string, string> = {
        'situação': 'account_situation',
        'situacao': 'account_situation',
        'situation': 'account_situation',
        'agrupamento': 'account_grouping',
        'grouping': 'account_grouping',
        'grupo': 'account_grouping',
        'group': 'account_grouping'
      }
      Object.assign(commonMappings, dreMappings)
    }

    if (uploadType === 'financial') {
      const financialMappings: Record<string, string> = {
        'natureza': 'nature',
        'nature': 'nature',
        'tipo': 'nature',
        'type': 'nature',
        'resumo': 'account_summary',
        'summary': 'account_summary',
        'categoria': 'account_summary',
        'category': 'account_summary'
      }
      Object.assign(commonMappings, financialMappings)
    }

    // Find best match
    for (const [key, value] of Object.entries(commonMappings)) {
      if (header.includes(key)) {
        return value
      }
    }

    return null
  }

  private mapRowToObject(row: string[], headerMap: Record<string, string>, uploadType: string): any | null {
    const obj: any = {}
    let hasRequiredFields = false

    for (let i = 0; i < row.length; i++) {
      const fieldName = headerMap[i]
      if (fieldName) {
        const value = row[i]?.trim()
        if (value) {
          obj[fieldName] = this.parseValue(value, fieldName)
          hasRequiredFields = true
        }
      }
    }

    // Validate required fields based on upload type
    const requiredFields = this.getRequiredFields(uploadType)
    const hasAllRequired = requiredFields.every(field => obj[field] !== undefined)

    if (!hasRequiredFields || !hasAllRequired) {
      logger.warn('Row missing required fields', {
        row,
        requiredFields,
        presentFields: Object.keys(obj)
      }, 'excel-parser')
      return null
    }

    // Add default values
    this.addDefaultValues(obj, uploadType)

    return obj
  }

  private parseValue(value: string, fieldName: string): any {
    // Parse numeric values
    if (fieldName === 'amount' || fieldName === 'period_year' || fieldName === 'period_month') {
      const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''))
      return isNaN(numericValue) ? 0 : numericValue
    }

    // Parse dates
    if (fieldName.includes('date') || fieldName.includes('_at')) {
      const date = new Date(value)
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
    }

    // Return as string for other fields
    return value
  }

  private getRequiredFields(uploadType: string): string[] {
    switch (uploadType) {
      case 'dre':
        return ['account_code', 'account_name', 'amount']
      case 'financial':
        return ['account_code', 'account_name', 'amount']
      default:
        return ['account_code', 'amount']
    }
  }

  private addDefaultValues(obj: any, uploadType: string): void {
    const now = new Date()
    
    // Add current year/month if not present
    if (!obj.period_year) {
      obj.period_year = now.getFullYear()
    }
    
    if (!obj.period_month) {
      obj.period_month = now.getMonth() + 1
    }

    // Add upload type specific defaults
    if (uploadType === 'dre') {
      if (!obj.account_situation) {
        obj.account_situation = obj.amount >= 0 ? 'ATIVO' : 'PASSIVO'
      }
      
      if (!obj.account_grouping) {
        obj.account_grouping = this.inferAccountGrouping(obj.account_code)
      }
    }

    if (uploadType === 'financial') {
      if (!obj.nature) {
        obj.nature = this.inferTransactionNature(obj.account_code, obj.amount)
      }
      
      if (!obj.account_summary) {
        obj.account_summary = this.inferAccountSummary(obj.account_name)
      }
    }
  }

  private inferAccountGrouping(accountCode: string): string {
    if (!accountCode) return 'OUTROS'
    
    const code = accountCode.toString()
    if (code.startsWith('1')) return 'ATIVO'
    if (code.startsWith('2')) return 'PASSIVO'
    if (code.startsWith('3')) return 'PATRIMÔNIO LÍQUIDO'
    if (code.startsWith('4')) return 'RECEITA'
    if (code.startsWith('5')) return 'CUSTO'
    if (code.startsWith('6')) return 'DESPESA'
    
    return 'OUTROS'
  }

  private inferTransactionNature(accountCode: string, amount: number): string {
    if (!accountCode) {
      return amount >= 0 ? 'RECEITA' : 'CUSTO'
    }
    
    const code = accountCode.toString()
    if (code.startsWith('4')) return 'RECEITA'
    if (code.startsWith('5')) return 'CUSTO'
    if (code.startsWith('6')) return 'DESPESA'
    
    return amount >= 0 ? 'RECEITA' : 'CUSTO'
  }

  private inferAccountSummary(accountName: string): string {
    if (!accountName) return 'OUTROS'
    
    const name = accountName.toUpperCase()
    
    if (name.includes('SALÁRIO') || name.includes('CLT')) return 'SALÁRIOS CLT'
    if (name.includes('TERCEIRO') || name.includes('SUBCONTRAT')) return 'TERCEIROS'
    if (name.includes('DESONERA')) return 'DESONERAÇÃO DA FOLHA'
    if (name.includes('RECEITA')) return 'RECEITA OPERACIONAL'
    if (name.includes('CUSTO')) return 'CUSTO OPERACIONAL'
    if (name.includes('DESPESA')) return 'DESPESA OPERACIONAL'
    
    return 'OUTROS'
  }
}