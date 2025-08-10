import { logger } from '../../_shared/logger.ts'

export interface DreValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  data?: any
}

export class DreValidator {
  validate(data: any[]): DreValidationResult {
    const result: DreValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      data: []
    }

    logger.info('Starting DRE validation', {
      totalRecords: data.length
    }, 'dre-validator')

    if (!data || data.length === 0) {
      result.isValid = false
      result.errors.push('Nenhum dado encontrado para validação')
      return result
    }

    const validatedData = []
    const accountCodes = new Set<string>()
    const duplicateAccounts = new Set<string>()

    for (let i = 0; i < data.length; i++) {
      const record = data[i]
      const recordResult = this.validateRecord(record, i + 1)
      
      if (recordResult.isValid) {
        // Check for duplicate account codes
        const accountKey = `${record.account_code}_${record.period_year}_${record.period_month}`
        if (accountCodes.has(accountKey)) {
          duplicateAccounts.add(record.account_code)
          result.warnings.push(`Conta duplicada encontrada: ${record.account_code} no período ${record.period_month}/${record.period_year}`)
        } else {
          accountCodes.add(accountKey)
        }
        
        validatedData.push(recordResult.data)
      } else {
        result.isValid = false
        result.errors.push(...recordResult.errors.map(error => `Linha ${i + 1}: ${error}`))
      }
      
      result.warnings.push(...recordResult.warnings.map(warning => `Linha ${i + 1}: ${warning}`))
    }

    // Business rule validations
    const businessValidation = this.validateBusinessRules(validatedData)
    result.errors.push(...businessValidation.errors)
    result.warnings.push(...businessValidation.warnings)
    
    if (businessValidation.errors.length > 0) {
      result.isValid = false
    }

    result.data = validatedData

    logger.info('DRE validation completed', {
      totalRecords: data.length,
      validRecords: validatedData.length,
      errors: result.errors.length,
      warnings: result.warnings.length,
      duplicateAccounts: duplicateAccounts.size
    }, 'dre-validator')

    return result
  }

  private validateRecord(record: any, lineNumber: number): DreValidationResult {
    const result: DreValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      data: { ...record }
    }

    // Required field validation
    const requiredFields = [
      { field: 'account_code', name: 'Código da conta' },
      { field: 'account_name', name: 'Nome da conta' },
      { field: 'amount', name: 'Valor' },
      { field: 'period_year', name: 'Ano' },
      { field: 'period_month', name: 'Mês' }
    ]

    for (const { field, name } of requiredFields) {
      if (!record[field] && record[field] !== 0) {
        result.errors.push(`Campo obrigatório ausente: ${name}`)
        result.isValid = false
      }
    }

    if (!result.isValid) {
      return result
    }

    // Account code validation
    const accountCodeValidation = this.validateAccountCode(record.account_code)
    if (!accountCodeValidation.isValid) {
      result.errors.push(...accountCodeValidation.errors)
      result.isValid = false
    }
    result.warnings.push(...accountCodeValidation.warnings)

    // Amount validation
    const amountValidation = this.validateAmount(record.amount)
    if (!amountValidation.isValid) {
      result.errors.push(...amountValidation.errors)
      result.isValid = false
    }
    result.warnings.push(...amountValidation.warnings)

    // Period validation
    const periodValidation = this.validatePeriod(record.period_year, record.period_month)
    if (!periodValidation.isValid) {
      result.errors.push(...periodValidation.errors)
      result.isValid = false
    }
    result.warnings.push(...periodValidation.warnings)

    // Account name validation
    const nameValidation = this.validateAccountName(record.account_name)
    result.warnings.push(...nameValidation.warnings)

    // Normalize and enrich data
    if (result.isValid) {
      result.data = this.normalizeRecord(record)
    }

    return result
  }

  private validateAccountCode(accountCode: any): DreValidationResult {
    const result: DreValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (typeof accountCode !== 'string' && typeof accountCode !== 'number') {
      result.errors.push('Código da conta deve ser um texto ou número')
      result.isValid = false
      return result
    }

    const codeStr = accountCode.toString().trim()
    
    if (codeStr.length === 0) {
      result.errors.push('Código da conta não pode estar vazio')
      result.isValid = false
      return result
    }

    if (codeStr.length > 20) {
      result.errors.push('Código da conta não pode ter mais de 20 caracteres')
      result.isValid = false
    }

    // Check if follows standard chart of accounts pattern
    const standardPattern = /^[1-9]\d*(\.\d+)*$/
    if (!standardPattern.test(codeStr)) {
      result.warnings.push('Código da conta não segue o padrão do plano de contas (ex: 1.1.01)')
    }

    // Validate DRE account ranges
    const firstDigit = codeStr.charAt(0)
    if (!['3', '4', '5', '6', '7', '8'].includes(firstDigit)) {
      result.warnings.push('Código da conta pode não ser adequado para DRE (esperado: 3-8)')
    }

    return result
  }

  private validateAmount(amount: any): DreValidationResult {
    const result: DreValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (amount === null || amount === undefined) {
      result.errors.push('Valor é obrigatório')
      result.isValid = false
      return result
    }

    const numericAmount = Number(amount)
    
    if (isNaN(numericAmount)) {
      result.errors.push('Valor deve ser um número válido')
      result.isValid = false
      return result
    }

    if (!isFinite(numericAmount)) {
      result.errors.push('Valor deve ser um número finito')
      result.isValid = false
      return result
    }

    // Check for extremely large values
    if (Math.abs(numericAmount) > 999999999999) {
      result.warnings.push('Valor muito alto, verifique se está correto')
    }

    // Check for zero values
    if (numericAmount === 0) {
      result.warnings.push('Valor zero encontrado')
    }

    return result
  }

  private validatePeriod(year: any, month: any): DreValidationResult {
    const result: DreValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Year validation
    const numericYear = Number(year)
    if (isNaN(numericYear) || numericYear < 2000 || numericYear > 2100) {
      result.errors.push('Ano deve estar entre 2000 e 2100')
      result.isValid = false
    }

    // Month validation
    const numericMonth = Number(month)
    if (isNaN(numericMonth) || numericMonth < 1 || numericMonth > 12) {
      result.errors.push('Mês deve estar entre 1 e 12')
      result.isValid = false
    }

    // Check if period is in the future
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    
    if (numericYear > currentYear || (numericYear === currentYear && numericMonth > currentMonth)) {
      result.warnings.push('Período está no futuro')
    }

    // Check if period is too old
    if (numericYear < currentYear - 5) {
      result.warnings.push('Período é muito antigo (mais de 5 anos)')
    }

    return result
  }

  private validateAccountName(accountName: any): DreValidationResult {
    const result: DreValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (typeof accountName !== 'string') {
      result.warnings.push('Nome da conta deve ser um texto')
      return result
    }

    const name = accountName.trim()
    
    if (name.length === 0) {
      result.warnings.push('Nome da conta está vazio')
    } else if (name.length < 3) {
      result.warnings.push('Nome da conta muito curto')
    } else if (name.length > 100) {
      result.warnings.push('Nome da conta muito longo (máximo 100 caracteres)')
    }

    // Check for suspicious patterns
    if (/^[A-Z\s]+$/.test(name)) {
      result.warnings.push('Nome da conta está todo em maiúsculas')
    }

    if (/\d{5,}/.test(name)) {
      result.warnings.push('Nome da conta contém muitos números consecutivos')
    }

    return result
  }

  private validateBusinessRules(data: any[]): DreValidationResult {
    const result: DreValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (data.length === 0) {
      return result
    }

    // Group by period
    const periodGroups = new Map<string, any[]>()
    for (const record of data) {
      const periodKey = `${record.period_year}-${record.period_month}`
      if (!periodGroups.has(periodKey)) {
        periodGroups.set(periodKey, [])
      }
      periodGroups.get(periodKey)!.push(record)
    }

    // Validate each period
    for (const [period, records] of periodGroups) {
      const periodValidation = this.validatePeriodData(records, period)
      result.errors.push(...periodValidation.errors)
      result.warnings.push(...periodValidation.warnings)
      
      if (periodValidation.errors.length > 0) {
        result.isValid = false
      }
    }

    return result
  }

  private validatePeriodData(records: any[], period: string): DreValidationResult {
    const result: DreValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Calculate totals by account type
    const totals = {
      receita: 0,
      custo: 0,
      despesa: 0
    }

    for (const record of records) {
      const accountCode = record.account_code.toString()
      const amount = Number(record.amount)
      
      if (accountCode.startsWith('4')) {
        totals.receita += amount
      } else if (accountCode.startsWith('5')) {
        totals.custo += amount
      } else if (accountCode.startsWith('6')) {
        totals.despesa += amount
      }
    }

    // Business rule validations
    if (totals.receita <= 0) {
      result.warnings.push(`Período ${period}: Receita total é zero ou negativa`)
    }

    if (totals.custo < 0) {
      result.warnings.push(`Período ${period}: Custo total é negativo`)
    }

    if (totals.despesa < 0) {
      result.warnings.push(`Período ${period}: Despesa total é negativa`)
    }

    // Check profit margin
    const lucroLiquido = totals.receita - totals.custo - totals.despesa
    const margemLiquida = totals.receita > 0 ? (lucroLiquida / totals.receita) * 100 : 0

    if (margemLiquida < -50) {
      result.warnings.push(`Período ${period}: Margem líquida muito baixa (${margemLiquida.toFixed(1)}%)`)
    }

    if (margemLiquida > 80) {
      result.warnings.push(`Período ${period}: Margem líquida muito alta (${margemLiquida.toFixed(1)}%), verifique os dados`)
    }

    // Check for missing essential accounts
    const essentialAccounts = ['4.1', '5.1', '6.1'] // Basic revenue, cost, expense
    const presentAccounts = new Set(records.map(r => r.account_code.toString().substring(0, 3)))
    
    for (const essential of essentialAccounts) {
      if (!presentAccounts.has(essential)) {
        result.warnings.push(`Período ${period}: Conta essencial ${essential} não encontrada`)
      }
    }

    return result
  }

  private normalizeRecord(record: any): any {
    return {
      ...record,
      account_code: record.account_code.toString().trim(),
      account_name: record.account_name.toString().trim(),
      amount: Number(record.amount),
      period_year: Number(record.period_year),
      period_month: Number(record.period_month),
      account_situation: record.account_situation || this.inferAccountSituation(record.account_code),
      account_grouping: record.account_grouping || this.inferAccountGrouping(record.account_code),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  private inferAccountSituation(accountCode: string): string {
    const firstDigit = accountCode.toString().charAt(0)
    switch (firstDigit) {
      case '1': return 'ATIVO'
      case '2': return 'PASSIVO'
      case '3': return 'PATRIMÔNIO LÍQUIDO'
      case '4': return 'RECEITA'
      case '5': return 'CUSTO'
      case '6': return 'DESPESA'
      case '7': return 'RESULTADO'
      case '8': return 'RESULTADO'
      default: return 'OUTROS'
    }
  }

  private inferAccountGrouping(accountCode: string): string {
    const code = accountCode.toString()
    
    if (code.startsWith('4.1')) return 'RECEITA OPERACIONAL'
    if (code.startsWith('4.2')) return 'RECEITA NÃO OPERACIONAL'
    if (code.startsWith('5.1')) return 'CUSTO DOS SERVIÇOS'
    if (code.startsWith('5.2')) return 'CUSTO DOS PRODUTOS'
    if (code.startsWith('6.1')) return 'DESPESA OPERACIONAL'
    if (code.startsWith('6.2')) return 'DESPESA ADMINISTRATIVA'
    if (code.startsWith('6.3')) return 'DESPESA FINANCEIRA'
    
    return this.inferAccountSituation(accountCode)
  }
}