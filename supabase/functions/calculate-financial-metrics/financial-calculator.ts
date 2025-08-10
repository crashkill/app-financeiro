import { db } from '../_shared/database.ts'
import { logger } from '../_shared/logger.ts'
import {
  MetricsRequest,
  RevenueMetrics,
  CostMetrics,
  MarginMetrics,
  ForecastMetrics,
  CalculationContext,
  MonthlyRevenueData,
  MonthlyCostData,
  MonthlyMarginData
} from './types.ts'
import { FinancialMetrics, ProjectSummary } from '../_shared/types.ts'

export class FinancialCalculator {
  async calculateMetrics(request: MetricsRequest): Promise<FinancialMetrics> {
    const context = await this.buildCalculationContext(request)
    const results: FinancialMetrics = {}

    // Calculate each requested metric
    for (const metric of request.metrics) {
      switch (metric) {
        case 'revenue':
          results.revenue = await this.calculateRevenue(context)
          break
        case 'costs':
          results.costs = await this.calculateCosts(context)
          break
        case 'margin':
          results.margin = await this.calculateMargin(context)
          break
        case 'forecast':
          results.forecast = await this.calculateForecast(context)
          break
        case 'summary':
          results.summary = await this.calculateSummary(context)
          break
        default:
          logger.warn(`Unknown metric requested: ${metric}`, { metric })
      }
    }

    return results
  }

  private async buildCalculationContext(request: MetricsRequest): Promise<CalculationContext> {
    // Fetch financial transactions
    const transactions = await db.getFinancialTransactions({
      projectId: request.projectId,
      startDate: request.startDate,
      endDate: request.endDate
    })

    // Fetch DRE data
    const dreData = await db.getDreData({
      projectId: request.projectId,
      startDate: request.startDate,
      endDate: request.endDate,
      status: 'processed'
    })

    return {
      projectId: request.projectId,
      period: {
        start: new Date(request.startDate),
        end: new Date(request.endDate)
      },
      filters: request.filters,
      historicalData: {
        transactions,
        dreData
      },
      benchmarks: {
        industry: {
          marginPercentage: 0.15,
          revenueGrowth: 0.08,
          costEfficiency: 0.85
        },
        company: {
          marginPercentage: 0.18,
          revenueGrowth: 0.12,
          costEfficiency: 0.88
        }
      }
    }
  }

  private async calculateRevenue(context: CalculationContext): Promise<RevenueMetrics> {
    const transactions = context.historicalData.transactions
      .filter(t => t.nature === 'RECEITA')

    // Apply filters
    const filteredTransactions = this.applyFilters(transactions, context.filters)

    // Group by month
    const monthlyData = new Map<string, MonthlyRevenueData>()
    let totalRevenue = 0
    let totalTaxRelief = 0
    const accountBreakdown = new Map<string, number>()

    for (const transaction of filteredTransactions) {
      const monthKey = `${transaction.year}-${String(transaction.month).padStart(2, '0')}`
      const amount = Math.abs(transaction.revenue || transaction.amount || 0)
      const accountSummary = transaction.account_summary || 'OUTROS'

      totalRevenue += amount
      
      if (accountSummary === 'DESONERAÇÃO DA FOLHA') {
        totalTaxRelief += amount
      }

      // Update account breakdown
      accountBreakdown.set(accountSummary, (accountBreakdown.get(accountSummary) || 0) + amount)

      // Update monthly data
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          total: 0,
          taxRelief: 0,
          netRevenue: 0,
          breakdown: {},
          growth: 0
        })
      }

      const monthData = monthlyData.get(monthKey)!
      monthData.total += amount
      monthData.breakdown[accountSummary] = (monthData.breakdown[accountSummary] || 0) + amount
      
      if (accountSummary === 'DESONERAÇÃO DA FOLHA') {
        monthData.taxRelief += amount
      }
      
      monthData.netRevenue = monthData.total - monthData.taxRelief
    }

    // Calculate growth rates
    const sortedMonths = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))

    for (let i = 1; i < sortedMonths.length; i++) {
      const current = sortedMonths[i][1]
      const previous = sortedMonths[i - 1][1]
      
      if (previous.total > 0) {
        current.growth = ((current.total - previous.total) / previous.total) * 100
      }
    }

    const monthlyBreakdown = sortedMonths.map(([, data]) => data)
    const averageMonthly = totalRevenue / Math.max(monthlyBreakdown.length, 1)

    // Calculate growth metrics
    const monthOverMonth = monthlyBreakdown.length >= 2 
      ? monthlyBreakdown[monthlyBreakdown.length - 1].growth
      : 0

    const yearOverYear = this.calculateYearOverYearGrowth(monthlyBreakdown)

    return {
      total: totalRevenue,
      taxRelief: totalTaxRelief,
      netRevenue: totalRevenue - totalTaxRelief,
      monthlyBreakdown,
      averageMonthly,
      growth: {
        monthOverMonth,
        yearOverYear
      },
      breakdown: {
        byAccountSummary: Object.fromEntries(accountBreakdown),
        byMonth: Object.fromEntries(monthlyData.entries())
      }
    }
  }

  private async calculateCosts(context: CalculationContext): Promise<CostMetrics> {
    const transactions = context.historicalData.transactions
      .filter(t => t.nature === 'CUSTO')

    const filteredTransactions = this.applyFilters(transactions, context.filters)

    const monthlyData = new Map<string, MonthlyCostData>()
    let totalCosts = 0
    let cltCosts = 0
    let subcontractorCosts = 0
    let otherCosts = 0
    const accountBreakdown = new Map<string, number>()
    const typeBreakdown = { personnel: 0, operational: 0, administrative: 0 }

    for (const transaction of filteredTransactions) {
      const monthKey = `${transaction.year}-${String(transaction.month).padStart(2, '0')}`
      const amount = Math.abs(transaction.cost || transaction.amount || 0)
      const accountSummary = transaction.account_summary || 'OUTROS'

      totalCosts += amount
      
      // Categorize costs
      if (accountSummary.includes('CLT') || accountSummary.includes('SALÁRIO')) {
        cltCosts += amount
        typeBreakdown.personnel += amount
      } else if (accountSummary.includes('TERCEIRO') || accountSummary.includes('SUBCONTRAT')) {
        subcontractorCosts += amount
        typeBreakdown.operational += amount
      } else {
        otherCosts += amount
        typeBreakdown.administrative += amount
      }

      accountBreakdown.set(accountSummary, (accountBreakdown.get(accountSummary) || 0) + amount)

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          total: 0,
          cltCosts: 0,
          subcontractorCosts: 0,
          otherCosts: 0,
          breakdown: {},
          efficiency: 0
        })
      }

      const monthData = monthlyData.get(monthKey)!
      monthData.total += amount
      monthData.breakdown[accountSummary] = (monthData.breakdown[accountSummary] || 0) + amount
      
      if (accountSummary.includes('CLT')) {
        monthData.cltCosts += amount
      } else if (accountSummary.includes('TERCEIRO')) {
        monthData.subcontractorCosts += amount
      } else {
        monthData.otherCosts += amount
      }
    }

    // Calculate efficiency metrics
    for (const [, monthData] of monthlyData) {
      monthData.efficiency = monthData.total > 0 
        ? (monthData.cltCosts / monthData.total) * 100
        : 0
    }

    const monthlyBreakdown = Array.from(monthlyData.values())
      .sort((a, b) => a.month.localeCompare(b.month))
    
    const averageMonthly = totalCosts / Math.max(monthlyBreakdown.length, 1)

    return {
      total: totalCosts,
      cltCosts,
      subcontractorCosts,
      otherCosts,
      monthlyBreakdown,
      averageMonthly,
      breakdown: {
        byAccountSummary: Object.fromEntries(accountBreakdown),
        byMonth: Object.fromEntries(monthlyData.entries()),
        byType: typeBreakdown
      }
    }
  }

  private async calculateMargin(context: CalculationContext): Promise<MarginMetrics> {
    const revenue = await this.calculateRevenue(context)
    const costs = await this.calculateCosts(context)

    const gross = revenue.total - costs.total
    const net = revenue.netRevenue - costs.total
    const percentage = revenue.total > 0 ? (gross / revenue.total) * 100 : 0

    // Calculate monthly margins
    const monthlyBreakdown: MonthlyMarginData[] = []
    const revenueByMonth = new Map(revenue.monthlyBreakdown.map(m => [m.month, m]))
    const costsByMonth = new Map(costs.monthlyBreakdown.map(m => [m.month, m]))

    const allMonths = new Set([...revenueByMonth.keys(), ...costsByMonth.keys()])
    
    for (const month of Array.from(allMonths).sort()) {
      const monthRevenue = revenueByMonth.get(month)?.total || 0
      const monthCosts = costsByMonth.get(month)?.total || 0
      const monthGross = monthRevenue - monthCosts
      const monthPercentage = monthRevenue > 0 ? (monthGross / monthRevenue) * 100 : 0

      monthlyBreakdown.push({
        month,
        gross: monthGross,
        net: (revenueByMonth.get(month)?.netRevenue || 0) - monthCosts,
        percentage: monthPercentage,
        revenue: monthRevenue,
        costs: monthCosts
      })
    }

    // Calculate trend
    const trend = this.calculateMarginTrend(monthlyBreakdown)

    return {
      gross,
      net,
      percentage,
      monthlyBreakdown,
      trend,
      benchmarks: {
        industry: context.benchmarks.industry.marginPercentage * 100,
        company: context.benchmarks.company.marginPercentage * 100,
        target: 20 // 20% target margin
      }
    }
  }

  private async calculateForecast(context: CalculationContext): Promise<ForecastMetrics> {
    // Simplified forecast calculation
    // In production, this would use more sophisticated algorithms
    
    const revenue = await this.calculateRevenue(context)
    const costs = await this.calculateCosts(context)
    
    const avgMonthlyRevenue = revenue.averageMonthly
    const avgMonthlyCosts = costs.averageMonthly
    const growthRate = revenue.growth.monthOverMonth / 100
    
    const nextMonth = {
      revenue: {
        predicted: avgMonthlyRevenue * (1 + growthRate),
        confidence: 0.75,
        range: {
          min: avgMonthlyRevenue * 0.9,
          max: avgMonthlyRevenue * 1.2
        }
      },
      costs: {
        predicted: avgMonthlyCosts * (1 + growthRate * 0.8),
        confidence: 0.8,
        range: {
          min: avgMonthlyCosts * 0.95,
          max: avgMonthlyCosts * 1.1
        }
      },
      margin: {
        predicted: 0,
        percentage: 0,
        confidence: 0.7
      },
      factors: {
        seasonal: 0.1,
        trend: growthRate,
        external: 0.05
      }
    }
    
    nextMonth.margin.predicted = nextMonth.revenue.predicted - nextMonth.costs.predicted
    nextMonth.margin.percentage = nextMonth.revenue.predicted > 0 
      ? (nextMonth.margin.predicted / nextMonth.revenue.predicted) * 100 
      : 0

    return {
      nextMonth,
      nextQuarter: {
        ...nextMonth,
        revenue: {
          ...nextMonth.revenue,
          predicted: nextMonth.revenue.predicted * 3
        },
        costs: {
          ...nextMonth.costs,
          predicted: nextMonth.costs.predicted * 3
        }
      },
      nextYear: {
        ...nextMonth,
        revenue: {
          ...nextMonth.revenue,
          predicted: nextMonth.revenue.predicted * 12
        },
        costs: {
          ...nextMonth.costs,
          predicted: nextMonth.costs.predicted * 12
        }
      },
      methodology: {
        algorithm: 'linear_trend',
        confidence: 0.75,
        factors: ['historical_trend', 'seasonal_adjustment', 'growth_rate']
      }
    }
  }

  private async calculateSummary(context: CalculationContext): Promise<ProjectSummary> {
    const revenue = await this.calculateRevenue(context)
    const costs = await this.calculateCosts(context)
    
    const netMargin = revenue.total - costs.total
    const marginPercentage = revenue.total > 0 ? (netMargin / revenue.total) * 100 : 0

    return {
      projectId: context.projectId,
      totalRevenue: revenue.total,
      totalCosts: costs.total,
      netMargin,
      marginPercentage,
      period: {
        start: context.period.start.toISOString(),
        end: context.period.end.toISOString()
      }
    }
  }

  private applyFilters(transactions: any[], filters?: any) {
    if (!filters) return transactions

    return transactions.filter(transaction => {
      if (filters.accountSummary && !filters.accountSummary.includes(transaction.account_summary)) {
        return false
      }
      
      if (filters.nature && !filters.nature.includes(transaction.nature)) {
        return false
      }
      
      const amount = Math.abs(transaction.amount || 0)
      if (filters.minAmount && amount < filters.minAmount) {
        return false
      }
      
      if (filters.maxAmount && amount > filters.maxAmount) {
        return false
      }
      
      return true
    })
  }

  private calculateYearOverYearGrowth(monthlyData: MonthlyRevenueData[]): number {
    if (monthlyData.length < 12) return 0
    
    const currentYear = monthlyData.slice(-12).reduce((sum, m) => sum + m.total, 0)
    const previousYear = monthlyData.slice(-24, -12).reduce((sum, m) => sum + m.total, 0)
    
    return previousYear > 0 ? ((currentYear - previousYear) / previousYear) * 100 : 0
  }

  private calculateMarginTrend(monthlyData: MonthlyMarginData[]): { direction: 'up' | 'down' | 'stable', percentage: number } {
    if (monthlyData.length < 2) {
      return { direction: 'stable', percentage: 0 }
    }
    
    const recent = monthlyData.slice(-3).map(m => m.percentage)
    const older = monthlyData.slice(-6, -3).map(m => m.percentage)
    
    const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length
    const olderAvg = older.reduce((sum, p) => sum + p, 0) / older.length
    
    const change = recentAvg - olderAvg
    
    if (Math.abs(change) < 1) {
      return { direction: 'stable', percentage: change }
    }
    
    return {
      direction: change > 0 ? 'up' : 'down',
      percentage: Math.abs(change)
    }
  }
}