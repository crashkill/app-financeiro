import { ApiResponse, FinancialMetrics } from '../_shared/types.ts'

export interface MetricsRequest {
  projectId: string
  startDate: string
  endDate: string
  metrics: MetricType[]
  filters?: {
    accountSummary?: string[]
    nature?: string[]
    minAmount?: number
    maxAmount?: number
  }
}

export type MetricType = 'revenue' | 'costs' | 'margin' | 'forecast' | 'summary'

export interface MetricsResponse extends ApiResponse<FinancialMetrics> {
  metadata: {
    calculatedAt: string
    userId: string
    projectId: string
    period: {
      start: string
      end: string
    }
  }
}

export interface RevenueMetrics {
  total: number
  taxRelief: number
  netRevenue: number
  monthlyBreakdown: MonthlyRevenueData[]
  averageMonthly: number
  growth: {
    monthOverMonth: number
    yearOverYear: number
  }
  breakdown: {
    byAccountSummary: Record<string, number>
    byMonth: Record<string, number>
  }
}

export interface CostMetrics {
  total: number
  cltCosts: number
  subcontractorCosts: number
  otherCosts: number
  monthlyBreakdown: MonthlyCostData[]
  averageMonthly: number
  breakdown: {
    byAccountSummary: Record<string, number>
    byMonth: Record<string, number>
    byType: {
      personnel: number
      operational: number
      administrative: number
    }
  }
}

export interface MarginMetrics {
  gross: number
  net: number
  percentage: number
  monthlyBreakdown: MonthlyMarginData[]
  trend: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }
  benchmarks: {
    industry: number
    company: number
    target: number
  }
}

export interface MonthlyRevenueData {
  month: string
  total: number
  taxRelief: number
  netRevenue: number
  breakdown: Record<string, number>
  growth: number
}

export interface MonthlyCostData {
  month: string
  total: number
  cltCosts: number
  subcontractorCosts: number
  otherCosts: number
  breakdown: Record<string, number>
  efficiency: number
}

export interface MonthlyMarginData {
  month: string
  gross: number
  net: number
  percentage: number
  revenue: number
  costs: number
}

export interface ForecastMetrics {
  nextMonth: ForecastPeriod
  nextQuarter: ForecastPeriod
  nextYear: ForecastPeriod
  methodology: {
    algorithm: string
    confidence: number
    factors: string[]
  }
}

export interface ForecastPeriod {
  revenue: {
    predicted: number
    confidence: number
    range: {
      min: number
      max: number
    }
  }
  costs: {
    predicted: number
    confidence: number
    range: {
      min: number
      max: number
    }
  }
  margin: {
    predicted: number
    percentage: number
    confidence: number
  }
  factors: {
    seasonal: number
    trend: number
    external: number
  }
}

export interface CalculationContext {
  projectId: string
  period: {
    start: Date
    end: Date
  }
  filters: MetricsRequest['filters']
  historicalData: {
    transactions: any[]
    dreData: any[]
  }
  benchmarks: {
    industry: Record<string, number>
    company: Record<string, number>
  }
}