import { logger } from '../../_shared/logger.ts'

export interface BusinessRulesValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  metrics?: {
    totalRecords: number
    periodsAnalyzed: number
    complianceScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  }
}

export class BusinessRulesValidator {
  validate(data: any[], uploadType: string): BusinessRulesValidationResult {
    const result: BusinessRulesValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    logger.info('Starting business rules validation', {
      totalRecords: data.length,
      uploadType
    }, 'business-rules-validator')

    if (!data || data.length === 0) {
      result.isValid = false
      result.errors.push('Nenhum dado encontrado para validação')
      return result
    }

    // Group data by period for analysis
    const periodGroups = this.groupByPeriod(data)
    
    // Apply validation rules based on upload type
    switch (uploadType) {
      case 'dre':
        this.validateDreBusinessRules(periodGroups, result)
        break
      case 'financial':
        this.validateFinancialBusinessRules(periodGroups, result)
        break
      default:
        this.validateGeneralBusinessRules(periodGroups, result)
    }

    // Cross-period analysis
    this.validateCrossPeriodRules(periodGroups, result)
    
    // Calculate compliance metrics
    result.metrics = this.calculateComplianceMetrics(data, result, periodGroups.size)

    logger.info('Business rules validation completed', {
      totalRecords: data.length,
      periodsAnalyzed: periodGroups.size,
      errors: result.errors.length,
      warnings: result.warnings.length,
      suggestions: result.suggestions.length,
      complianceScore: result.metrics.complianceScore,
      riskLevel: result.metrics.riskLevel
    }, 'business-rules-validator')

    return result
  }

  private groupByPeriod(data: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>()
    
    for (const record of data) {
      const periodKey = `${record.period_year}-${String(record.period_month).padStart(2, '0')}`
      if (!groups.has(periodKey)) {
        groups.set(periodKey, [])
      }
      groups.get(periodKey)!.push(record)
    }
    
    return groups
  }

  private validateDreBusinessRules(periodGroups: Map<string, any[]>, result: BusinessRulesValidationResult): void {
    for (const [period, records] of periodGroups) {
      this.validateDrePeriod(records, period, result)
    }
  }

  private validateDrePeriod(records: any[], period: string, result: BusinessRulesValidationResult): void {
    const totals = this.calculateDreTotals(records)
    
    // Rule 1: Revenue must be positive
    if (totals.receita <= 0) {
      result.errors.push(`${period}: Receita deve ser positiva (atual: ${totals.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`)
      result.isValid = false
    }
    
    // Rule 2: Check for essential DRE accounts
    const essentialAccounts = this.getEssentialDreAccounts()
    const presentAccounts = new Set(records.map(r => this.getAccountGroup(r.account_code)))
    
    for (const essential of essentialAccounts) {
      if (!presentAccounts.has(essential)) {
        result.warnings.push(`${period}: Conta essencial '${essential}' não encontrada na DRE`)
      }
    }
    
    // Rule 3: Profit margin analysis
    const lucroLiquido = totals.receita - totals.custo - totals.despesa
    const margemLiquida = totals.receita > 0 ? (lucroLiquido / totals.receita) * 100 : 0
    
    if (margemLiquida < -20) {
      result.errors.push(`${period}: Margem líquida muito baixa (${margemLiquida.toFixed(1)}%). Empresa pode estar em dificuldades financeiras.`)
      result.isValid = false
    } else if (margemLiquida < 5) {
      result.warnings.push(`${period}: Margem líquida baixa (${margemLiquida.toFixed(1)}%). Considere revisar custos e despesas.`)
    } else if (margemLiquida > 50) {
      result.warnings.push(`${period}: Margem líquida muito alta (${margemLiquida.toFixed(1)}%). Verifique se os dados estão corretos.`)
    }
    
    // Rule 4: Cost structure analysis
    if (totals.receita > 0) {
      const percentualCusto = (totals.custo / totals.receita) * 100
      const percentualDespesa = (totals.despesa / totals.receita) * 100
      
      if (percentualCusto > 70) {
        result.warnings.push(`${period}: Custos representam ${percentualCusto.toFixed(1)}% da receita. Considere otimização.`)
      }
      
      if (percentualDespesa > 30) {
        result.warnings.push(`${period}: Despesas representam ${percentualDespesa.toFixed(1)}% da receita. Revise gastos administrativos.`)
      }
    }
    
    // Rule 5: Account balance validation
    this.validateAccountBalances(records, period, result)
    
    // Suggestions for improvement
    if (margemLiquida > 0 && margemLiquida < 15) {
      result.suggestions.push(`${period}: Para melhorar a margem líquida, considere: reduzir custos operacionais, otimizar despesas administrativas, ou aumentar preços.`)
    }
  }

  private validateFinancialBusinessRules(periodGroups: Map<string, any[]>, result: BusinessRulesValidationResult): void {
    for (const [period, records] of periodGroups) {
      this.validateFinancialPeriod(records, period, result)
    }
  }

  private validateFinancialPeriod(records: any[], period: string, result: BusinessRulesValidationResult): void {
    const totals = this.calculateFinancialTotals(records)
    
    // Rule 1: Revenue consistency
    if (totals.receita <= 0) {
      result.warnings.push(`${period}: Nenhuma receita registrada no período`)
    }
    
    // Rule 2: Salary vs Third-party ratio (compliance with labor laws)
    const salariosClt = totals.summaries.get('SALÁRIOS CLT') || 0
    const terceiros = totals.summaries.get('TERCEIROS') || 0
    const totalPessoal = salariosClt + terceiros
    
    if (totalPessoal > 0) {
      const percentualTerceiros = (terceiros / totalPessoal) * 100
      
      if (percentualTerceiros > 80) {
        result.errors.push(`${period}: Percentual de terceiros muito alto (${percentualTerceiros.toFixed(1)}%). Risco de caracterização de vínculo empregatício.`)
        result.isValid = false
      } else if (percentualTerceiros > 60) {
        result.warnings.push(`${period}: Alto percentual de terceiros (${percentualTerceiros.toFixed(1)}%). Monitore para evitar riscos trabalhistas.`)
      }
    }
    
    // Rule 3: Payroll tax compliance (Desoneração da Folha)
    const desoneracaoFolha = totals.summaries.get('DESONERAÇÃO DA FOLHA') || 0
    
    if (salariosClt > 0 && desoneracaoFolha === 0) {
      result.warnings.push(`${period}: Desoneração da folha não encontrada. Verifique se os benefícios fiscais estão sendo aplicados.`)
    } else if (salariosClt > 0) {
      const percentualDesoneracao = (desoneracaoFolha / salariosClt) * 100
      
      if (percentualDesoneracao < 15) {
        result.warnings.push(`${period}: Desoneração da folha baixa (${percentualDesoneracao.toFixed(1)}%). Verifique oportunidades de benefícios fiscais.`)
      } else if (percentualDesoneracao > 35) {
        result.warnings.push(`${period}: Desoneração da folha alta (${percentualDesoneracao.toFixed(1)}%). Verifique se os cálculos estão corretos.`)
      }
    }
    
    // Rule 4: Operational efficiency
    if (totals.receita > 0) {
      const eficienciaOperacional = ((totals.receita - totals.custo - totals.despesa) / totals.receita) * 100
      
      if (eficienciaOperacional < 10) {
        result.warnings.push(`${period}: Baixa eficiência operacional (${eficienciaOperacional.toFixed(1)}%). Revise processos e custos.`)
      }
    }
    
    // Rule 5: Cost center distribution
    this.validateCostCenterDistribution(records, period, result)
    
    // Suggestions
    if (percentualTerceiros > 40 && percentualTerceiros <= 60) {
      result.suggestions.push(`${period}: Considere equilibrar melhor a proporção entre CLT e terceiros para otimizar custos e reduzir riscos.`)
    }
  }

  private validateGeneralBusinessRules(periodGroups: Map<string, any[]>, result: BusinessRulesValidationResult): void {
    for (const [period, records] of periodGroups) {
      // Basic validations for unknown upload types
      const totals = this.calculateGeneralTotals(records)
      
      if (totals.total === 0) {
        result.warnings.push(`${period}: Nenhuma movimentação financeira encontrada`)
      }
      
      // Check for data consistency
      const uniqueAccounts = new Set(records.map(r => r.account_code)).size
      if (uniqueAccounts < records.length * 0.1) {
        result.warnings.push(`${period}: Poucos códigos de conta únicos. Verifique se os dados estão corretos.`)
      }
    }
  }

  private validateCrossPeriodRules(periodGroups: Map<string, any[]>, result: BusinessRulesValidationResult): void {
    if (periodGroups.size < 2) {
      return
    }

    const periods = Array.from(periodGroups.keys()).sort()
    const periodTotals = new Map<string, any>()
    
    // Calculate totals for each period
    for (const [period, records] of periodGroups) {
      periodTotals.set(period, this.calculateFinancialTotals(records))
    }
    
    // Analyze trends
    for (let i = 1; i < periods.length; i++) {
      const currentPeriod = periods[i]
      const previousPeriod = periods[i - 1]
      
      const current = periodTotals.get(currentPeriod)
      const previous = periodTotals.get(previousPeriod)
      
      this.validatePeriodTrends(previous, current, previousPeriod, currentPeriod, result)
    }
    
    // Seasonal analysis
    this.validateSeasonalPatterns(periodTotals, result)
  }

  private validatePeriodTrends(previous: any, current: any, previousPeriod: string, currentPeriod: string, result: BusinessRulesValidationResult): void {
    // Revenue trend analysis
    if (previous.receita > 0) {
      const receitaGrowth = ((current.receita - previous.receita) / previous.receita) * 100
      
      if (receitaGrowth < -30) {
        result.warnings.push(`Queda significativa na receita de ${previousPeriod} para ${currentPeriod}: ${receitaGrowth.toFixed(1)}%`)
      } else if (receitaGrowth > 100) {
        result.warnings.push(`Crescimento muito alto na receita de ${previousPeriod} para ${currentPeriod}: ${receitaGrowth.toFixed(1)}%. Verifique os dados.`)
      }
    }
    
    // Cost trend analysis
    if (previous.custo > 0) {
      const custoGrowth = ((current.custo - previous.custo) / previous.custo) * 100
      
      if (custoGrowth > 50) {
        result.warnings.push(`Aumento significativo nos custos de ${previousPeriod} para ${currentPeriod}: ${custoGrowth.toFixed(1)}%`)
      }
    }
    
    // Margin trend analysis
    const previousMargin = previous.receita > 0 ? ((previous.receita - previous.custo - previous.despesa) / previous.receita) * 100 : 0
    const currentMargin = current.receita > 0 ? ((current.receita - current.custo - current.despesa) / current.receita) * 100 : 0
    
    const marginChange = currentMargin - previousMargin
    
    if (marginChange < -10) {
      result.warnings.push(`Deterioração da margem líquida de ${previousPeriod} para ${currentPeriod}: ${marginChange.toFixed(1)} pontos percentuais`)
    }
  }

  private validateSeasonalPatterns(periodTotals: Map<string, any>, result: BusinessRulesValidationResult): void {
    // Group by month to identify seasonal patterns
    const monthlyData = new Map<number, number[]>()
    
    for (const [period, totals] of periodTotals) {
      const [year, month] = period.split('-').map(Number)
      if (!monthlyData.has(month)) {
        monthlyData.set(month, [])
      }
      monthlyData.get(month)!.push(totals.receita)
    }
    
    // Check for unusual seasonal variations
    if (monthlyData.size >= 6) { // Need at least 6 months of data
      const monthlyAverages = new Map<number, number>()
      
      for (const [month, revenues] of monthlyData) {
        const average = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length
        monthlyAverages.set(month, average)
      }
      
      const overallAverage = Array.from(monthlyAverages.values()).reduce((sum, avg) => sum + avg, 0) / monthlyAverages.size
      
      for (const [month, average] of monthlyAverages) {
        const deviation = ((average - overallAverage) / overallAverage) * 100
        
        if (Math.abs(deviation) > 40) {
          const monthName = new Date(2024, month - 1).toLocaleString('pt-BR', { month: 'long' })
          result.suggestions.push(`Padrão sazonal identificado: ${monthName} apresenta ${deviation > 0 ? 'alta' : 'baixa'} de ${Math.abs(deviation).toFixed(1)}% na receita média.`)
        }
      }
    }
  }

  private validateAccountBalances(records: any[], period: string, result: BusinessRulesValidationResult): void {
    // Check for accounts with unusual balances
    const accountTotals = new Map<string, number>()
    
    for (const record of records) {
      const key = record.account_code
      accountTotals.set(key, (accountTotals.get(key) || 0) + record.amount)
    }
    
    for (const [accountCode, total] of accountTotals) {
      const accountType = this.getAccountType(accountCode)
      
      // Revenue accounts should be positive
      if (accountType === 'RECEITA' && total < 0) {
        result.warnings.push(`${period}: Conta de receita ${accountCode} com saldo negativo: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
      }
      
      // Cost and expense accounts should be positive (representing outflows)
      if ((accountType === 'CUSTO' || accountType === 'DESPESA') && total < 0) {
        result.warnings.push(`${period}: Conta de ${accountType.toLowerCase()} ${accountCode} com saldo negativo: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
      }
    }
  }

  private validateCostCenterDistribution(records: any[], period: string, result: BusinessRulesValidationResult): void {
    const costCenterTotals = new Map<string, number>()
    let totalAmount = 0
    
    for (const record of records) {
      const cc = record.cost_center || 'GERAL'
      const amount = Math.abs(record.amount)
      costCenterTotals.set(cc, (costCenterTotals.get(cc) || 0) + amount)
      totalAmount += amount
    }
    
    if (costCenterTotals.size === 1 && costCenterTotals.has('GERAL') && totalAmount > 0) {
      result.suggestions.push(`${period}: Todos os valores estão no centro de custo 'GERAL'. Considere implementar centros de custo específicos para melhor controle.`)
    }
    
    // Check for cost center concentration
    for (const [cc, amount] of costCenterTotals) {
      const percentage = (amount / totalAmount) * 100
      if (percentage > 80 && costCenterTotals.size > 1) {
        result.warnings.push(`${period}: Centro de custo '${cc}' concentra ${percentage.toFixed(1)}% dos valores. Verifique a distribuição.`)
      }
    }
  }

  private calculateDreTotals(records: any[]): { receita: number, custo: number, despesa: number } {
    const totals = { receita: 0, custo: 0, despesa: 0 }
    
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
    
    return totals
  }

  private calculateFinancialTotals(records: any[]): { receita: number, custo: number, despesa: number, summaries: Map<string, number> } {
    const totals = { receita: 0, custo: 0, despesa: 0, summaries: new Map<string, number>() }
    
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
      }
      
      totals.summaries.set(summary, (totals.summaries.get(summary) || 0) + amount)
    }
    
    return totals
  }

  private calculateGeneralTotals(records: any[]): { total: number } {
    const total = records.reduce((sum, record) => sum + Math.abs(Number(record.amount)), 0)
    return { total }
  }

  private getEssentialDreAccounts(): string[] {
    return ['RECEITA', 'CUSTO', 'DESPESA']
  }

  private getAccountGroup(accountCode: string): string {
    const firstDigit = accountCode.toString().charAt(0)
    switch (firstDigit) {
      case '4': return 'RECEITA'
      case '5': return 'CUSTO'
      case '6': return 'DESPESA'
      default: return 'OUTROS'
    }
  }

  private getAccountType(accountCode: string): string {
    return this.getAccountGroup(accountCode)
  }

  private calculateComplianceMetrics(data: any[], result: BusinessRulesValidationResult, periodsCount: number): {
    totalRecords: number
    periodsAnalyzed: number
    complianceScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  } {
    const totalIssues = result.errors.length + result.warnings.length
    const maxPossibleIssues = data.length * 0.1 // Assume 10% as baseline for issues
    
    const complianceScore = Math.max(0, Math.min(100, 100 - (totalIssues / Math.max(maxPossibleIssues, 1)) * 100))
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    if (result.errors.length > 0 || complianceScore < 60) {
      riskLevel = 'HIGH'
    } else if (result.warnings.length > data.length * 0.05 || complianceScore < 80) {
      riskLevel = 'MEDIUM'
    } else {
      riskLevel = 'LOW'
    }
    
    return {
      totalRecords: data.length,
      periodsAnalyzed: periodsCount,
      complianceScore: Math.round(complianceScore),
      riskLevel
    }
  }
}