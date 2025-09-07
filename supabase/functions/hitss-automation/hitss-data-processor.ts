import { ProcessedData, XLSXRow, ValidationError } from './types.ts'
import { logger } from '../_shared/logger.ts'

/**
 * Processador de dados XLSX da HITSS
 * Responsável por ler, validar e transformar dados do arquivo Excel
 */
export class HITSSDataProcessor {
  private readonly REQUIRED_COLUMNS = [
    'data',
    'descricao', 
    'valor',
    'categoria',
    'tipo'
  ]

  /**
   * Processa arquivo XLSX e retorna dados estruturados
   */
  async processXLSX(filePath: string): Promise<ProcessedData> {
    logger.info('📊 Iniciando processamento do arquivo XLSX', { filePath })

    try {
      // Ler arquivo XLSX usando biblioteca compatível com Deno
      const fileData = await Deno.readFile(filePath)
      const workbook = await this.parseXLSXFile(fileData)
      
      // Extrair dados da primeira planilha
      const worksheet = workbook.worksheets[0]
      if (!worksheet) {
        throw new Error('Arquivo XLSX não contém planilhas válidas')
      }

      // Processar linhas
      const rawData = this.extractRowsFromWorksheet(worksheet)
      const processedData = this.validateAndTransformData(rawData)

      const result: ProcessedData = {
        data: processedData.validRows,
        totalRows: rawData.length,
        validRows: processedData.validRows.length,
        invalidRows: processedData.invalidRows.length,
        errors: processedData.errors,
        metadata: {
          fileName: filePath.split('/').pop() || 'unknown',
          processedAt: new Date().toISOString(),
          columns: this.REQUIRED_COLUMNS
        }
      }

      logger.info('✅ Processamento concluído', {
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        errorCount: result.errors.length
      })

      return result

    } catch (error) {
      logger.error('❌ Erro no processamento do arquivo XLSX:', error)
      throw new Error(`Falha no processamento do arquivo: ${error.message}`)
    }
  }

  /**
   * Faz parse do arquivo XLSX usando biblioteca compatível com Deno
   */
  private async parseXLSXFile(fileData: Uint8Array): Promise<any> {
    // Implementação simplificada - em produção usar biblioteca como 'xlsx' ou 'sheetjs'
    // Para este exemplo, vamos simular a estrutura de dados
    
    // Nota: Esta é uma implementação simplificada
    // Em produção, usar: https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs
    
    try {
      // Simular parsing do XLSX (substituir por biblioteca real)
      const mockWorkbook = {
        worksheets: [{
          name: 'Dados',
          rows: this.parseMockXLSXData(fileData)
        }]
      }
      
      return mockWorkbook
    } catch (error) {
      throw new Error(`Erro ao fazer parse do arquivo XLSX: ${error.message}`)
    }
  }

  /**
   * Implementação mock para parsing - substituir por biblioteca real
   */
  private parseMockXLSXData(fileData: Uint8Array): any[] {
    // Esta é uma implementação mock
    // Em produção, usar biblioteca XLSX adequada
    
    return [
      // Header row
      ['Data', 'Descrição', 'Valor', 'Categoria', 'Tipo'],
      // Data rows (exemplo)
      ['2024-01-15', 'Pagamento fornecedor', '1500.00', 'Despesas', 'Débito'],
      ['2024-01-16', 'Recebimento cliente', '2300.50', 'Receitas', 'Crédito'],
      ['2024-01-17', 'Compra material', '850.75', 'Despesas', 'Débito']
    ]
  }

  /**
   * Extrai linhas de dados da planilha
   */
  private extractRowsFromWorksheet(worksheet: any): XLSXRow[] {
    const rows: XLSXRow[] = []
    
    // Assumir que a primeira linha contém os cabeçalhos
    const headers = worksheet.rows[0] || []
    
    // Processar linhas de dados (pular cabeçalho)
    for (let i = 1; i < worksheet.rows.length; i++) {
      const rowData = worksheet.rows[i]
      
      if (this.isEmptyRow(rowData)) {
        continue
      }
      
      const row: XLSXRow = {
        rowNumber: i + 1,
        data: {},
        raw: rowData
      }
      
      // Mapear dados das colunas
      headers.forEach((header: string, index: number) => {
        const normalizedHeader = this.normalizeColumnName(header)
        row.data[normalizedHeader] = rowData[index] || ''
      })
      
      rows.push(row)
    }
    
    return rows
  }

  /**
   * Valida e transforma dados extraídos
   */
  private validateAndTransformData(rows: XLSXRow[]): {
    validRows: any[],
    invalidRows: number,
    errors: ValidationError[]
  } {
    const validRows: any[] = []
    const errors: ValidationError[] = []
    let invalidRows = 0

    for (const row of rows) {
      try {
        const validatedRow = this.validateRow(row)
        const transformedRow = this.transformRow(validatedRow)
        validRows.push(transformedRow)
      } catch (error) {
        invalidRows++
        errors.push({
          row: row.rowNumber,
          column: error.column || 'unknown',
          message: error.message,
          value: error.value
        })
      }
    }

    return { validRows, invalidRows, errors }
  }

  /**
   * Valida uma linha de dados
   */
  private validateRow(row: XLSXRow): XLSXRow {
    // Verificar colunas obrigatórias
    for (const column of this.REQUIRED_COLUMNS) {
      if (!row.data[column] || row.data[column].toString().trim() === '') {
        throw {
          column,
          message: `Coluna obrigatória '${column}' está vazia`,
          value: row.data[column]
        }
      }
    }

    // Validar formato da data
    if (!this.isValidDate(row.data.data)) {
      throw {
        column: 'data',
        message: 'Formato de data inválido',
        value: row.data.data
      }
    }

    // Validar valor numérico
    if (!this.isValidNumber(row.data.valor)) {
      throw {
        column: 'valor',
        message: 'Valor deve ser um número válido',
        value: row.data.valor
      }
    }

    // Validar tipo (Débito/Crédito)
    if (!['Débito', 'Crédito', 'débito', 'crédito'].includes(row.data.tipo)) {
      throw {
        column: 'tipo',
        message: 'Tipo deve ser "Débito" ou "Crédito"',
        value: row.data.tipo
      }
    }

    return row
  }

  /**
   * Transforma dados validados para formato final
   */
  private transformRow(row: XLSXRow): any {
    return {
      data: this.parseDate(row.data.data),
      descricao: row.data.descricao.toString().trim(),
      valor: this.parseNumber(row.data.valor),
      categoria: row.data.categoria.toString().trim(),
      tipo: row.data.tipo.toString().toLowerCase(),
      row_number: row.rowNumber,
      processed_at: new Date().toISOString()
    }
  }

  /**
   * Normaliza nome da coluna
   */
  private normalizeColumnName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íì]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úù]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  /**
   * Verifica se linha está vazia
   */
  private isEmptyRow(rowData: any[]): boolean {
    return !rowData || rowData.every(cell => 
      cell === null || cell === undefined || cell.toString().trim() === ''
    )
  }

  /**
   * Valida formato de data
   */
  private isValidDate(dateStr: string): boolean {
    if (!dateStr) return false
    
    // Aceitar formatos: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const dateRegex = /^(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})|(\d{4}-\d{1,2}-\d{1,2})$/
    
    if (!dateRegex.test(dateStr.toString())) {
      return false
    }
    
    const date = this.parseDate(dateStr)
    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * Converte string para Date
   */
  private parseDate(dateStr: string): Date {
    const str = dateStr.toString().trim()
    
    // Formato DD/MM/YYYY ou DD-MM-YYYY
    if (str.match(/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/)) {
      const [day, month, year] = str.split(/[\/-]/).map(Number)
      return new Date(year, month - 1, day)
    }
    
    // Formato YYYY-MM-DD
    if (str.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
      return new Date(str)
    }
    
    throw new Error(`Formato de data não suportado: ${dateStr}`)
  }

  /**
   * Valida se valor é numérico
   */
  private isValidNumber(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false
    }
    
    const numStr = value.toString().replace(/[.,]/g, '.')
    const num = parseFloat(numStr)
    
    return !isNaN(num) && isFinite(num)
  }

  /**
   * Converte valor para número
   */
  private parseNumber(value: any): number {
    const numStr = value.toString().replace(/[.,]/g, '.')
    return parseFloat(numStr)
  }
}