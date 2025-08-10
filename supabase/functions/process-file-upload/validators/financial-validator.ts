import { logger } from '../../_shared/logger.ts'

export interface FinancialValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  data?: any
}

export class FinancialValidator {
  validate(data: any[]): FinancialValidationResult {
    const result: FinancialValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      data: []
    }

    logger.info('Starting financial data validation', {
      totalRecords: data.length
    }, 'financial-validator')

    if (!data || data.length === 0) {
      result.isValid = false
      result.errors.push('Nenhum dado encontrado para validação')
      return result
    }

    const validatedData = []
    const transactionIds = new Set<string>()
    const duplicateTransactions = new Set<string>()

    for (let i = 0; i < data.length; i++) {
      const record = data[i]
      const recordResult = this.validateRecord(record, i + 1)
      
      if (recordResult.isValid) {
        // Check for duplicate transactions
        const transactionKey = `${record.account_code}_${record.amount}_${record.period_year}_${record.period_month}`
        if (transactionIds.has(transactionKey)) {
          duplicateTransactions.add(transactionKey)
          result.warnings.push(`Possível transação duplicada: ${record.account_code} - ${record.amount} no período ${record.period_month}/${record.period_year}`)
        } else {
          transactionIds.add(transactionKey)
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

    logger.info('Financial validation completed', {
      totalRecords: data.length,
      validRecords: validatedData.length,
      errors: result.errors.length,
      warnings: result.warnings.length,
      duplicateTransactions: duplicateTransactions.size
    }, 'financial-validator')

    return result
  }

  private validateRecord(record: any, lineNumber: number): FinancialValidationResult {
    const result: FinancialValidationResult = {
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

    // Nature validation
    const natureValidation = this.validateNature(record.nature)
    if (!natureValidation.isValid) {
      result.errors.push(...natureValidation.errors)
      result.isValid = false
    }
    result.warnings.push(...natureValidation.warnings)

    // Account summary validation
    const summaryValidation = this.validateAccountSummary(record.account_summary)
    result.warnings.push(...summaryValidation.warnings)

    // Cost center validation
    const costCenterValidation = this.validateCostCenter(record.cost_center)
    result.warnings.push(...costCenterValidation.warnings)

    // Normalize and enrich data
    if (result.isValid) {
      result.data = this.normalizeRecord(record)
    }

    return result
  }

  private validateAccountCode(accountCode: any): FinancialValidationResult {
    const result: FinancialValidationResult = {
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

    return result
  }

  private validateAmount(amount: any): FinancialValidationResult {
    const result: FinancialValidationResult = {
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

    // Check for very small values
    if (Math.abs(numericAmount) < 0.01 && numericAmount !== 0) {
      result.warnings.push('Valor muito pequeno, verifique se está correto')
    }

    return result
  }

  private validatePeriod(year: any, month: any): FinancialValidationResult {
    const result: FinancialValidationResult = {
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
    if (numericYear < currentYear - 10) {
      result.warnings.push('Período é muito antigo (mais de 10 anos)')
    }

    return result
  }

  private validateNature(nature: any): FinancialValidationResult {
    const result: FinancialValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (!nature) {
      result.warnings.push('Natureza não informada, será inferida automaticamente')
      return result
    }

    if (typeof nature !== 'string') {
      result.errors.push('Natureza deve ser um texto')
      result.isValid = false
      return result
    }

    const validNatures = ['RECEITA', 'CUSTO', 'DESPESA', 'OUTROS']
    const normalizedNature = nature.toString().toUpperCase().trim()
    
    if (!validNatures.includes(normalizedNature)) {
      result.warnings.push(`Natureza '${nature}' não reconhecida. Valores válidos: ${validNatures.join(', ')}`)
    }

    return result
  }

  private validateAccountSummary(accountSummary: any): FinancialValidationResult {
    const result: FinancialValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (!accountSummary) {
      result.warnings.push('Resumo da conta não informado, será inferido automaticamente')
      return result
    }

    if (typeof accountSummary !== 'string') {
      result.warnings.push('Resumo da conta deve ser um texto')
      return result
    }

    const summary = accountSummary.toString().trim()
    
    if (summary.length === 0) {
      result.warnings.push('Resumo da conta está vazio')
    } else if (summary.length > 100) {
      result.warnings.push('Resumo da conta muito longo (máximo 100 caracteres)')
    }

    // Check for valid summary categories
    const validSummaries = [
      'RECEITA OPERACIONAL',
      'RECEITA NÃO OPERACIONAL',
      'SALÁRIOS CLT',
      'TERCEIROS',
      'DESONERAÇÃO DA FOLHA',
      'DESPESA OPERACIONAL',
      'DESPESA ADMINISTRATIVA',
      'DESPESA FINANCEIRA',
      'OUTROS'
    ]

    const normalizedSummary = summary.toUpperCase()
    const isValidSummary = validSummaries.some(valid => 
      normalizedSummary.includes(valid) || valid.includes(normalizedSummary)
    )

    if (!isValidSummary) {
      result.warnings.push(`Resumo da conta '${summary}' pode não estar categorizado corretamente`)
    }

    return result
  }

  private validateCostCenter(costCenter: any): FinancialValidationResult {
    const result: FinancialValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (!costCenter) {
      result.warnings.push('Centro de custo não informado')
      return result
    }

    if (typeof costCenter !== 'string' && typeof costCenter !== 'number') {
      result.warnings.push('Centro de custo deve ser um texto ou número')
      return result
    }

    const ccStr = costCenter.toString().trim()
    
    if (ccStr.length === 0) {
      result.warnings.push('Centro de custo está vazio')
    } else if (ccStr.length > 20) {
      result.warnings.push('Centro de custo muito longo (máximo 20 caracteres)')
    }

    return result
  }

  private validateBusinessRules(data: any[]): FinancialValidationResult {
    const result: FinancialValidationResult = {
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

    // Cross-period validations
    const crossPeriodValidation = this.validateCrossPeriodData(periodGroups)
    result.warnings.push(...crossPeriodValidation.warnings)

    return result
  }

  private validatePeriodData(records: any[], period: string): FinancialValidationResult {
    const result: FinancialValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Calculate totals by nature
    const totals = {
      receita: 0,
      custo: 0,
      despesa: 0,
      outros: 0
    }

    const summaryTotals = new Map<string, number>()

    for (const record of records) {
      const amount = Number(record.amount)
      const nature = record.nature?.toUpperCase() || 'OUTROS'
      const summary = record.account_summary?.toUpperCase() || 'OUTROS'
      
      switch (nature) {
        case 'RECEITA':
          totals.receita += amount
          break
        case 'CUSTO':
          totals.custo += amount
          break
        case 'DESPESA':
          totals.despesa += amount
          break
        default:
          totals.outros += amount
      }

      // Track summary totals
      summaryTotals.set(summary, (summaryTotals.get(summary) || 0) + amount)
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

    // Check for unusual patterns
    const totalMovimentacao = Math.abs(totals.receita) + Math.abs(totals.custo) + Math.abs(totals.despesa)
    
    if (totalMovimentacao === 0) {
      result.warnings.push(`Período ${period}: Nenhuma movimentação financeira encontrada`)
    }

    // Check salary vs third-party ratio
    const salariosClt = summaryTotals.get('SALÁRIOS CLT') || 0
    const terceiros = summaryTotals.get('TERCEIROS') || 0
    
    if (salariosClt > 0 && terceiros > 0) {
      const ratioTerceiros = terceiros / (salariosClt + terceiros)
      if (ratioTerceiros > 0.8) {
        result.warnings.push(`Período ${period}: Alto percentual de terceiros (${(ratioTerceiros * 100).toFixed(1)}%)`)
      }
    }

    // Check for missing essential categories
    const essentialSummaries = ['RECEITA OPERACIONAL', 'SALÁRIOS CLT']
    for (const essential of essentialSummaries) {
      if (!summaryTotals.has(essential) || summaryTotals.get(essential) === 0) {
        result.warnings.push(`Período ${period}: Categoria essencial '${essential}' não encontrada ou zerada`)
      }
    }

    return result
  }

  private validateCrossPeriodData(periodGroups: Map<string, any[]>): FinancialValidationResult {
    const result: FinancialValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (periodGroups.size < 2) {
      return result
    }

    const periodTotals = new Map<string, { receita: number, custo: number, despesa: number }>()
    
    // Calculate totals for each period
    for (const [period, records] of periodGroups) {
      const totals = { receita: 0, custo: 0, despesa: 0 }
      
      for (const record of records) {
        const amount = Number(record.amount)
        const nature = record.nature?.toUpperCase() || 'OUTROS'
        
        switch (nature) {
          case 'RECEITA':
            totals.receita += amount
            break
          case 'CUSTO':
            totals.custo += amount
            break
          case 'DESPESA':
            totals.despesa += amount
            break
        }
      }
      
      periodTotals.set(period, totals)
    }

    // Check for significant variations between periods
    const periods = Array.from(periodTotals.keys()).sort()
    
    for (let i = 1; i < periods.length; i++) {
      const currentPeriod = periods[i]
      const previousPeriod = periods[i - 1]
      
      const current = periodTotals.get(currentPeriod)!
      const previous = periodTotals.get(previousPeriod)!
      
      // Check revenue variation
      if (previous.receita > 0) {
        const receitaVariation = Math.abs((current.receita - previous.receita) / previous.receita)
        if (receitaVariation > 0.5) {
          result.warnings.push(`Variação significativa na receita entre ${previousPeriod} e ${currentPeriod}: ${(receitaVariation * 100).toFixed(1)}%`)
        }
      }
      
      // Check cost variation
      if (previous.custo > 0) {
        const custoVariation = Math.abs((current.custo - previous.custo) / previous.custo)
        if (custoVariation > 0.7) {
          result.warnings.push(`Variação significativa no custo entre ${previousPeriod} e ${currentPeriod}: ${(custoVariation * 100).toFixed(1)}%`)
        }
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
      nature: this.normalizeNature(record.nature, record.account_code),
      account_summary: this.normalizeAccountSummary(record.account_summary, record.account_name),
      cost_center: record.cost_center?.toString().trim() || 'GERAL',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  private normalizeNature(nature: any, accountCode: string): string {
    if (nature && typeof nature === 'string') {
      const normalized = nature.toUpperCase().trim()
      if (['RECEITA', 'CUSTO', 'DESPESA', 'OUTROS'].includes(normalized)) {
        return normalized
      }
    }
    
    // Infer from account code
    const code = accountCode.toString().charAt(0)
    switch (code) {
      case '4': return 'RECEITA'
      case '5': return 'CUSTO'
      case '6': return 'DESPESA'
      default: return 'OUTROS'
    }
  }

  private normalizeAccountSummary(accountSummary: any, accountName: string): string {
    if (accountSummary && typeof accountSummary === 'string') {
      return accountSummary.toUpperCase().trim()
    }
    
    // Infer from account name
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
}