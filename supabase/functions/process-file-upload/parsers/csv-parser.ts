import { logger } from '../../_shared/logger.ts'

export class CsvParser {
  async parse(fileBuffer: Uint8Array, options: {
    uploadType: string
    fileName: string
  }): Promise<any[]> {
    try {
      logger.info('Parsing CSV file', {
        fileName: options.fileName,
        uploadType: options.uploadType,
        fileSize: fileBuffer.length
      }, 'csv-parser')

      // Convert buffer to text
      const text = new TextDecoder('utf-8').decode(fileBuffer)
      
      // Split into lines and filter empty ones
      const lines = text.split(/\r?\n/).filter(line => line.trim())
      
      if (lines.length === 0) {
        throw new Error('CSV file appears to be empty')
      }

      // Parse CSV with proper handling of quoted fields
      const rows = lines.map(line => this.parseCsvLine(line))
      
      // Extract headers
      const headers = rows[0]
      const normalizedHeaders = this.normalizeHeaders(headers, options.uploadType)
      
      logger.debug('Parsed CSV headers', { headers, normalizedHeaders }, 'csv-parser')

      // Parse data rows
      const data = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue // Skip empty rows
        }

        const rowData = this.mapRowToObject(row, normalizedHeaders, options.uploadType)
        if (rowData) {
          data.push(rowData)
        }
      }

      logger.info('CSV file parsed successfully', {
        fileName: options.fileName,
        totalRows: data.length,
        headers: Object.values(normalizedHeaders)
      }, 'csv-parser')

      return data
    } catch (error) {
      logger.error('Error parsing CSV file', {
        error: error.message,
        fileName: options.fileName
      }, 'csv-parser')
      throw new Error(`Failed to parse CSV file: ${error.message}`)
    }
  }

  private parseCsvLine(line: string): string[] {
    const result = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i += 2
          continue
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim())
        current = ''
        i++
        continue
      } else {
        current += char
      }
      
      i++
    }

    // Add the last field
    result.push(current.trim())
    
    return result
  }

  private normalizeHeaders(headers: string[], uploadType: string): Record<string, string> {
    const normalized: Record<string, string> = {}
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim().replace(/["']/g, '')
      const normalizedKey = this.getNormalizedKey(header, uploadType)
      if (normalizedKey) {
        normalized[i] = normalizedKey
      }
    }
    
    return normalized
  }

  private getNormalizedKey(header: string, uploadType: string): string | null {
    // Remove special characters and normalize
    const cleanHeader = header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .trim()

    // Common field mappings
    const commonMappings: Record<string, string> = {
      // Account code variations
      'codigo': 'account_code',
      'codigo_conta': 'account_code',
      'codigo da conta': 'account_code',
      'code': 'account_code',
      'account code': 'account_code',
      'cod conta': 'account_code',
      'cod': 'account_code',
      
      // Account name variations
      'nome': 'account_name',
      'nome_conta': 'account_name',
      'nome da conta': 'account_name',
      'name': 'account_name',
      'account name': 'account_name',
      'descricao': 'account_name',
      'descricao da conta': 'account_name',
      'description': 'account_name',
      'denominacao': 'account_name',
      'conta': 'account_name',
      
      // Amount variations
      'valor': 'amount',
      'amount': 'amount',
      'montante': 'amount',
      'saldo': 'amount',
      'balance': 'amount',
      'vlr': 'amount',
      'vl': 'amount',
      
      // Period variations
      'ano': 'period_year',
      'year': 'period_year',
      'exercicio': 'period_year',
      'mes': 'period_month',
      'month': 'period_month',
      'periodo': 'period',
      'period': 'period',
      'data': 'period',
      'date': 'period'
    }

    // Upload type specific mappings
    if (uploadType === 'dre') {
      const dreMappings: Record<string, string> = {
        'situacao': 'account_situation',
        'situacao da conta': 'account_situation',
        'situation': 'account_situation',
        'agrupamento': 'account_grouping',
        'grouping': 'account_grouping',
        'grupo': 'account_grouping',
        'group': 'account_grouping',
        'classificacao': 'account_grouping',
        'classification': 'account_grouping'
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
        'category': 'account_summary',
        'centro de custo': 'cost_center',
        'cost center': 'cost_center',
        'cc': 'cost_center'
      }
      Object.assign(commonMappings, financialMappings)
    }

    // Direct match first
    if (commonMappings[cleanHeader]) {
      return commonMappings[cleanHeader]
    }

    // Special handling for ambiguous cases
    if (cleanHeader === 'conta') {
      // If we already have account_code mapped, this should be account_name
      return 'account_name'
    }

    // Partial match
    for (const [key, value] of Object.entries(commonMappings)) {
      if (cleanHeader.includes(key) || key.includes(cleanHeader)) {
        return value
      }
    }

    return null
  }

  private mapRowToObject(row: string[], headerMap: Record<string, string>, uploadType: string): any | null {
    const obj: any = {}
    let hasRequiredFields = false

    // Map fields based on header mapping
    for (let i = 0; i < row.length; i++) {
      const fieldName = headerMap[i]
      if (fieldName) {
        const value = row[i]?.trim().replace(/["']/g, '')
        if (value && value !== '') {
          obj[fieldName] = this.parseValue(value, fieldName)
          hasRequiredFields = true
        }
      }
    }

    // Validate required fields
    const requiredFields = this.getRequiredFields(uploadType)
    const missingFields = requiredFields.filter(field => !obj[field])
    
    if (missingFields.length > 0) {
      logger.debug('Row missing required fields', {
        missingFields,
        presentFields: Object.keys(obj),
        row: row.slice(0, 5) // Log first 5 columns for debugging
      }, 'csv-parser')
      return null
    }

    // Add computed and default values
    this.addComputedValues(obj, uploadType)
    this.addDefaultValues(obj, uploadType)

    return obj
  }

  private parseValue(value: string, fieldName: string): any {
    if (!value || value.trim() === '') {
      return null
    }

    const trimmedValue = value.trim()

    // Parse numeric values
    if (fieldName === 'amount' || fieldName === 'period_year' || fieldName === 'period_month') {
      // Handle Brazilian number format (1.234,56)
      let numericString = trimmedValue
        .replace(/[^\d.,-]/g, '') // Remove non-numeric chars except . , -
        .replace(/\./g, '') // Remove thousands separator
        .replace(',', '.') // Replace decimal comma with dot
      
      const numericValue = parseFloat(numericString)
      return isNaN(numericValue) ? 0 : numericValue
    }

    // Parse dates
    if (fieldName.includes('date') || fieldName === 'period') {
      // Try to parse various date formats
      const dateFormats = [
        /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
        /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
        /^(\d{4})\/(\d{2})$/, // YYYY/MM
        /^(\d{2})\/(\d{4})$/ // MM/YYYY
      ]
      
      for (const format of dateFormats) {
        const match = trimmedValue.match(format)
        if (match) {
          try {
            const date = new Date(trimmedValue)
            if (!isNaN(date.getTime())) {
              return date.toISOString()
            }
          } catch {
            // Continue to next format
          }
        }
      }
      
      // If no format matches, return current date
      return new Date().toISOString()
    }

    // Return as uppercase string for categorical fields
    if (fieldName === 'nature' || fieldName === 'account_situation' || fieldName === 'account_grouping') {
      return trimmedValue.toUpperCase()
    }

    // Return as string for other fields
    return trimmedValue
  }

  private getRequiredFields(uploadType: string): string[] {
    const baseFields = ['account_code', 'amount']
    
    switch (uploadType) {
      case 'dre':
        return [...baseFields, 'account_name']
      case 'financial':
        return [...baseFields, 'account_name']
      case 'professionals':
        return ['name', 'role', 'salary']
      default:
        return baseFields
    }
  }

  private addComputedValues(obj: any, uploadType: string): void {
    // Add computed values based on business rules
    if (uploadType === 'dre' || uploadType === 'financial') {
      // Infer nature from account code if not present
      if (!obj.nature && obj.account_code) {
        obj.nature = this.inferNatureFromAccountCode(obj.account_code)
      }
      
      // Infer account summary from account name if not present
      if (!obj.account_summary && obj.account_name) {
        obj.account_summary = this.inferAccountSummary(obj.account_name)
      }
    }
    
    if (uploadType === 'dre') {
      // Infer account situation and grouping
      if (!obj.account_situation) {
        obj.account_situation = obj.amount >= 0 ? 'ATIVO' : 'PASSIVO'
      }
      
      if (!obj.account_grouping && obj.account_code) {
        obj.account_grouping = this.inferAccountGrouping(obj.account_code)
      }
    }
  }

  private addDefaultValues(obj: any, uploadType: string): void {
    const now = new Date()
    
    // Add current period if not present
    if (!obj.period_year) {
      obj.period_year = now.getFullYear()
    }
    
    if (!obj.period_month) {
      obj.period_month = now.getMonth() + 1
    }
    
    // Add status
    obj.status = 'pending_validation'
  }

  private inferNatureFromAccountCode(accountCode: string): string {
    if (!accountCode) return 'OUTROS'
    
    const code = accountCode.toString().charAt(0)
    switch (code) {
      case '4': return 'RECEITA'
      case '5': return 'CUSTO'
      case '6': return 'DESPESA'
      default: return 'OUTROS'
    }
  }

  private inferAccountSummary(accountName: string): string {
    if (!accountName) return 'OUTROS'
    
    const name = accountName.toUpperCase()
    
    // Revenue patterns
    if (name.includes('RECEITA') || name.includes('FATURAMENTO') || name.includes('VENDAS')) {
      return 'RECEITA OPERACIONAL'
    }
    
    // Cost patterns
    if (name.includes('SALÁRIO') || name.includes('CLT') || name.includes('FOLHA')) {
      return 'SALÁRIOS CLT'
    }
    
    if (name.includes('TERCEIRO') || name.includes('SUBCONTRAT') || name.includes('PRESTADOR')) {
      return 'TERCEIROS'
    }
    
    if (name.includes('DESONERA') || name.includes('BENEFÍCIO') || name.includes('INSS')) {
      return 'DESONERAÇÃO DA FOLHA'
    }
    
    // Expense patterns
    if (name.includes('DESPESA') || name.includes('GASTO') || name.includes('CUSTO')) {
      return 'DESPESA OPERACIONAL'
    }
    
    return 'OUTROS'
  }

  private inferAccountGrouping(accountCode: string): string {
    if (!accountCode) return 'OUTROS'
    
    const code = accountCode.toString().charAt(0)
    switch (code) {
      case '1': return 'ATIVO'
      case '2': return 'PASSIVO'
      case '3': return 'PATRIMÔNIO LÍQUIDO'
      case '4': return 'RECEITA'
      case '5': return 'CUSTO'
      case '6': return 'DESPESA'
      default: return 'OUTROS'
    }
  }
}