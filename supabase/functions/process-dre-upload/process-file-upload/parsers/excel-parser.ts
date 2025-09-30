import { logger } from '../../_shared/logger.ts'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

export class ExcelParser {
  async parse(fileBuffer: Uint8Array, options: {
    uploadType: string
    fileName: string
  }): Promise<any[]> {
    try {
      logger.info('Parsing Excel file', {
        fileName: options.fileName,
        uploadType: options.uploadType,
        fileSize: fileBuffer.length
      }, 'excel-parser')

      // Parse Excel file using xlsx library
      const workbook = XLSX.read(fileBuffer, { type: 'array' })
      
      // Get the first worksheet
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        throw new Error('No worksheets found in Excel file')
      }
      
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: false
      })
      
      if (jsonData.length === 0) {
        throw new Error('File appears to be empty')
      }

      // Parse header row
      const headers = jsonData[0] as string[]
      const normalizedHeaders = this.normalizeHeaders(headers, options.uploadType)
      
      logger.debug('Parsed headers', { headers, normalizedHeaders }, 'excel-parser')

      // Parse data rows
      const data = []
      console.log('Starting to parse', jsonData.length - 1, 'data rows')
      console.log('Normalized headers map:', normalizedHeaders)
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as string[]
        if (!row || row.length === 0 || row.every(cell => !cell || !cell.toString().trim())) {
          continue // Skip empty rows
        }

        if (i <= 3) { // Log first 3 rows for debugging
          console.log(`Row ${i} data:`, row)
        }

        const rowData = this.mapRowToObject(row, normalizedHeaders, options.uploadType)
        if (i <= 3) {
          console.log(`Row ${i} mapped result:`, rowData)
        }
        
        if (rowData) {
          data.push(rowData)
          if (i <= 3) {
            console.log(`Row ${i} mapped:`, JSON.stringify(rowData, null, 2))
            console.log('Added row to data, total count:', data.length)
          }
        } else {
          if (i <= 10) {
            console.log(`Row ${i} skipped. Raw row:`, row)
          }
          if (i <= 3) {
            console.log('Row was filtered out or invalid')
          }
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



  private normalizeHeaders(headers: string[], uploadType: string): Record<string, number> {
    const normalized: Record<string, number> = {}
    
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        const normalizedKey = this.getNormalizedKey(header, uploadType)
        if (normalizedKey) {
          normalized[normalizedKey] = index
        }
      }
    })
    
    return normalized
  }

  private getNormalizedKey(header: string, uploadType: string): string | null {
    // DRE HITSS specific mappings based on MAPEAMENTO.md
    if (uploadType === 'dre') {
      const dreMappings: Record<string, string> = {
        'relatorio': 'relatorio',
        'tipo': 'tipo',
        'cliente': 'cliente',
        'linhanegocio': 'linha_negocio',
        'responsavelarea': 'responsavel_area',
        'responsaveldelivery': 'responsavel_delivery',
        'responsaveldevengado': 'responsavel_devengado',
        'idhoms': 'id_homs',
        'codigoprojeto': 'codigo_projeto',
        'projeto': 'projeto',
        'filialfaturamento': 'filial_faturamento',
        'imposto': 'imposto',
        'contaresumo': 'conta_resumo',
        'denominacaoconta': 'denominacao_conta',
        'idrecurso': 'id_recurso',
        'recurso': 'recurso',
        'lancamento': 'lancamento',
        'periodo': 'periodo',
        'natureza': 'natureza'
      }
      
      // Normalize header to match Excel format (remove accents, spaces, convert to lowercase)
      const normalizedHeader = header.toLowerCase().trim()
        .replace(/[áàâãä]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i')
        .replace(/[óòôõö]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]/g, '')
      
      if (dreMappings[normalizedHeader]) {
        return dreMappings[normalizedHeader]
      }
    }

    // Common mappings for other upload types
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
      'period': 'period',
      'data': 'data',
      'date': 'data',
      'resumo': 'account_summary',
      'summary': 'account_summary',
      'situação': 'account_situation',
      'situacao': 'account_situation',
      'situation': 'account_situation',
      'lançamento': 'lancamento',
      'lancamento': 'lancamento',
      'launch': 'lancamento'
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

  private mapRowToObject(row: string[], headerMap: Record<string, number>, uploadType: string): any | null {
    const obj: any = {}
    let hasRequiredFields = false

    // Use the headerMap to map column indices to field names
    for (const [fieldName, columnIndex] of Object.entries(headerMap)) {
      if (columnIndex < row.length) {
        const value = row[columnIndex]?.trim()
        if (value) {
          obj[fieldName] = this.parseValue(value, fieldName)
          hasRequiredFields = true
        }
      }
    }

    // Special processing for DRE HITSS data
    if (uploadType === 'dre') {
      // Skip records where 'lancamento' is empty or null
      if (!obj.lancamento || obj.lancamento.toString().trim() === '') {
        logger.debug('Skipping record with empty lancamento', {
          lancamento: obj.lancamento
        }, 'excel-parser')
        return null
      }
      
      // Skip records where 'natureza' is empty or null
      if (!obj.natureza || obj.natureza.toString().trim() === '') {
        logger.debug('Skipping record with empty natureza', {
          natureza: obj.natureza
        }, 'excel-parser')
        return null
      }

      // The 'projeto' field already comes in the correct format from Excel
      // No need to modify it as it's already 'CodigoProjeto - Descrição'

      // Map to database structure
      const dreRecord = {
        projeto: obj.projeto,
        natureza: obj.natureza,
        tipo: obj.tipo,
        valor: this.parseValue(obj.lancamento),
        conta: obj.conta_resumo || obj.denominacao_conta,
        descricao: obj.denominacao_conta,
        ano: this.extractYear(obj.periodo),
        mes: this.extractMonth(obj.periodo),
        relatorio: obj.relatorio,
        cliente: obj.cliente,
        linha_negocio: obj.linha_negocio,
        responsavel_area: obj.responsavel_area,
        responsavel_delivery: obj.responsavel_delivery,
        responsavel_devengado: obj.responsavel_devengado,
        id_homs: obj.id_homs,
        codigo_projeto: obj.codigo_projeto,
        filial_faturamento: obj.filial_faturamento,
        imposto: obj.imposto,
        conta_resumo: obj.conta_resumo,
        denominacao_conta: obj.denominacao_conta,
        id_recurso: obj.id_recurso,
        recurso: obj.recurso,
        lancamento: this.parseValue(obj.lancamento),
        periodo: obj.periodo
      }

      console.log('DRE record created:', dreRecord)

      return dreRecord
    }

    // Validate required fields for other upload types
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

    // Validate tipo/natureza combination for DRE uploads
    if (uploadType === 'dre' && obj.tipo && obj.natureza) {
      if (!this.validateTipoNaturezaCombination(obj.tipo, obj.natureza)) {
        logger.warn('Invalid tipo/natureza combination', {
          tipo: obj.tipo,
          natureza: obj.natureza,
          row
        }, 'excel-parser')
        
        // Fix invalid combination
        obj.natureza = this.inferNatureza(obj.account_code, obj.amount, obj.tipo)
      }
    }

    return obj
  }

  private parseValue(value: any, fieldName?: string): any {
    // If no fieldName provided, treat as numeric value
    if (!fieldName) {
      if (value === null || value === undefined || value === '') {
        return 0
      }
      
      if (typeof value === 'number') {
        return value
      }
      
      if (typeof value === 'string') {
        // Remove currency symbols and spaces
        const cleanValue = value.replace(/[R$\s,]/g, '').replace(',', '.')
        const parsed = parseFloat(cleanValue)
        return isNaN(parsed) ? 0 : parsed
      }
      
      return 0
    }

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

  private extractYear(periodo: string): number {
    if (!periodo) return new Date().getFullYear()
    
    // Try to extract year from different formats
    // Examples: "2024-01", "01/2024", "Jan/2024", etc.
    const yearMatch = periodo.match(/\b(20\d{2})\b/)
    if (yearMatch) {
      return parseInt(yearMatch[1])
    }
    
    return new Date().getFullYear()
  }

  private extractMonth(periodo: string): number {
    if (!periodo) return new Date().getMonth() + 1
    
    // Try to extract month from different formats
    // Examples: "2024-01", "01/2024", "Jan/2024", etc.
    const monthMatch = periodo.match(/\b(0?[1-9]|1[0-2])\b/)
    if (monthMatch) {
      return parseInt(monthMatch[1])
    }
    
    // Try month names (Portuguese)
    const monthNames = {
      'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
      'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
    }
    
    const lowerPeriodo = periodo.toLowerCase()
    for (const [name, num] of Object.entries(monthNames)) {
      if (lowerPeriodo.includes(name)) {
        return num
      }
    }
    
    return new Date().getMonth() + 1
  }

  private getRequiredFields(uploadType: string): string[] {
    switch (uploadType) {
      case 'dre':
        return ['relatorio', 'tipo', 'cliente', 'projeto', 'lancamento', 'periodo', 'natureza']
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
      if (!obj.tipo) {
        obj.tipo = this.inferTipo(obj.account_code, obj.account_name)
      }
      
      if (!obj.natureza) {
        obj.natureza = this.inferNatureza(obj.account_code, obj.amount, obj.tipo)
      }
      
      if (!obj.data) {
        obj.data = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
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

  private inferTipo(accountCode: string, accountName: string): string {
    if (!accountCode && !accountName) return 'OPERACIONAL'
    
    const code = accountCode?.toString() || ''
    const name = accountName?.toUpperCase() || ''
    
    // Inferir baseado no código da conta
    if (code.startsWith('1') || code.startsWith('2') || code.startsWith('3')) {
      return 'PATRIMONIAL'
    }
    
    // Inferir baseado no nome da conta
    if (name.includes('PATRIMÔNIO') || name.includes('CAPITAL') || name.includes('RESERVA')) {
      return 'PATRIMONIAL'
    }
    
    return 'OPERACIONAL'
  }

  private inferNatureza(accountCode: string, amount: number, tipo: string): string {
    if (!accountCode) {
      return amount >= 0 ? 'RECEITA' : 'CUSTO'
    }
    
    const code = accountCode.toString()
    
    // Para contas patrimoniais
    if (tipo === 'PATRIMONIAL') {
      if (code.startsWith('1')) return 'ATIVO'
      if (code.startsWith('2')) return 'PASSIVO'
      if (code.startsWith('3')) return 'PATRIMONIO_LIQUIDO'
      return 'ATIVO'
    }
    
    // Para contas operacionais
    if (code.startsWith('4')) return 'RECEITA'
    if (code.startsWith('5')) return 'CUSTO'
    if (code.startsWith('6')) return 'DESPESA'
    
    return amount >= 0 ? 'RECEITA' : 'CUSTO'
  }

  private validateTipoNaturezaCombination(tipo: string, natureza: string): boolean {
    const validCombinations = [
      { tipo: 'OPERACIONAL', natureza: 'RECEITA' },
      { tipo: 'OPERACIONAL', natureza: 'CUSTO' },
      { tipo: 'OPERACIONAL', natureza: 'DESPESA' },
      { tipo: 'PATRIMONIAL', natureza: 'ATIVO' },
      { tipo: 'PATRIMONIAL', natureza: 'PASSIVO' },
      { tipo: 'PATRIMONIAL', natureza: 'PATRIMONIO_LIQUIDO' }
    ]
    
    return validCombinations.some(combo => 
      combo.tipo === tipo && combo.natureza === natureza
    )
  }

  private inferAccountSummary(accountName: string): string {
    if (!accountName) return 'OUTROS'
    
    const name = accountName.toUpperCase().trim()
    
    // Normalização específica EXATA como no upload manual
    if (name.includes('RECEITA') && name.includes('DEVENGADA')) {
      return 'RECEITA DEVENGADA'
    }
    if (name.includes('DESONERAÇÃO') || name.includes('DESONERACAO')) {
      return 'DESONERAÇÃO DA FOLHA'
    }
    
    // Mapear variações conhecidas para os tipos padrão (como no upload manual)
    if (name.includes('CLT')) {
      return 'CLT'
    }
    if (name.includes('SUBCONTRATADO') || name.includes('SUB-CONTRATADO')) {
      return 'SUBCONTRATADOS'
    }
    
    // Se não for nenhum dos casos específicos, retorna OUTROS
    return 'OUTROS'
  }
}
