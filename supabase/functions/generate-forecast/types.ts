export interface ForecastRequest {
  forecastType: 'revenue' | 'cost' | 'profit' | 'cashflow' | 'comprehensive'
  periods: number // Number of periods to forecast (1-24 months)
  algorithm: 'linear_regression' | 'moving_average' | 'exponential_smoothing' | 'arima' | 'seasonal_decomposition'
  startDate?: string // Start date for historical data analysis
  endDate?: string // End date for historical data analysis
  filters?: {
    accountCodes?: string[]
    departments?: string[]
    costCenters?: string[]
    natures?: string[]
    summaries?: string[]
  }
  algorithmParams?: {
    // Moving Average parameters
    windowSize?: number // 2-12 months
    
    // Exponential Smoothing parameters
    alpha?: number // 0-1
    beta?: number // 0-1 (for trend)
    gamma?: number // 0-1 (for seasonality)
    
    // ARIMA parameters
    p?: number // AR order
    d?: number // Differencing order
    q?: number // MA order
    
    // Linear Regression parameters
    polynomialDegree?: number // 1-3
    includeSeasonality?: boolean
    
    // Seasonal Decomposition parameters
    seasonalPeriod?: number // 12 for yearly seasonality
    trendMethod?: 'linear' | 'polynomial' | 'loess'
  }
  scenarioParams?: {
    growthRate?: number // Expected growth rate (-1 to 1)
    seasonalityFactor?: number // Seasonal adjustment factor
    volatility?: number // Market volatility factor (0-1)
    externalFactors?: {
      economicGrowth?: number
      inflation?: number
      marketConditions?: 'optimistic' | 'neutral' | 'pessimistic'
    }
  }
  options?: {
    includeConfidenceIntervals?: boolean
    confidenceLevel?: number // 0.8, 0.9, 0.95, 0.99
    includeScenarios?: boolean // Best, worst, most likely
    generateInsights?: boolean
    saveToDatabase?: boolean
  }
}

export interface ForecastData {
  forecastType: string
  algorithm: string
  periods: ForecastPeriod[]
  confidence: number
  historicalDataPoints: number
  scenarios?: {
    optimistic: ForecastPeriod[]
    pessimistic: ForecastPeriod[]
    mostLikely: ForecastPeriod[]
  }
  insights?: ForecastInsight[]
  metadata: {
    generatedAt: string
    dataRange: {
      startDate: string
      endDate: string
    }
    algorithmParams: Record<string, any>
    accuracy?: {
      mape: number // Mean Absolute Percentage Error
      rmse: number // Root Mean Square Error
      mae: number // Mean Absolute Error
    }
  }
}

export interface ForecastPeriod {
  period: string // YYYY-MM format
  date: string // ISO date
  value: number
  confidenceInterval?: {
    lower: number
    upper: number
  }
  components?: {
    trend?: number
    seasonal?: number
    residual?: number
  }
  factors?: {
    growthRate?: number
    seasonalMultiplier?: number
    externalAdjustment?: number
  }
}

export interface ForecastInsight {
  type: 'trend' | 'seasonality' | 'anomaly' | 'opportunity' | 'risk'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  period?: string
  value?: number
  recommendation?: string
}

export interface ForecastResponse {
  success: boolean
  message: string
  data: ForecastData
  metadata: {
    generatedAt: string
    generatedBy: string
    algorithm: string
    confidence: number
    dataPoints: number
  }
}

export interface HistoricalData {
  period: string
  date: string
  value: number
  accountCode?: string
  department?: string
  costCenter?: string
  nature?: string
  summary?: string
}

export interface ForecastModel {
  id: string
  name: string
  type: string
  algorithm: string
  parameters: Record<string, any>
  accuracy: {
    mape: number
    rmse: number
    mae: number
  }
  trainingData: {
    startDate: string
    endDate: string
    dataPoints: number
  }
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface ForecastValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  accuracy?: {
    backtestResults: {
      period: string
      actual: number
      predicted: number
      error: number
      percentageError: number
    }[]
    overallAccuracy: number
    trend: 'improving' | 'stable' | 'declining'
  }
}

export interface SeasonalPattern {
  month: number
  factor: number
  confidence: number
  historicalAverage: number
  variance: number
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable'
  strength: number // 0-1
  slope: number
  r_squared: number
  significance: number
  changePoints?: {
    date: string
    type: 'acceleration' | 'deceleration' | 'reversal'
    confidence: number
  }[]
}

export interface ForecastComparison {
  models: {
    modelId: string
    algorithm: string
    forecast: ForecastPeriod[]
    accuracy: number
    confidence: number
  }[]
  ensemble?: {
    forecast: ForecastPeriod[]
    weights: Record<string, number>
    confidence: number
  }
  recommendation: {
    bestModel: string
    reason: string
    confidence: number
  }
}

export interface ForecastAlert {
  id: string
  type: 'threshold' | 'trend' | 'anomaly' | 'accuracy'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  triggeredAt: string
  period?: string
  value?: number
  threshold?: number
  conditions: Record<string, any>
  actions?: {
    type: 'email' | 'notification' | 'webhook'
    target: string
    executed: boolean
    executedAt?: string
  }[]
}

export interface ForecastConfiguration {
  defaultAlgorithm: string
  defaultPeriods: number
  confidenceLevel: number
  enableAutoRetraining: boolean
  retrainingFrequency: 'monthly' | 'quarterly' | 'yearly'
  accuracyThreshold: number
  alertThresholds: {
    revenue: {
      decrease: number
      increase: number
    }
    cost: {
      increase: number
    }
    profit: {
      decrease: number
    }
  }
  seasonalityDetection: {
    enabled: boolean
    minPeriods: number
    significanceLevel: number
  }
  outlierDetection: {
    enabled: boolean
    method: 'iqr' | 'zscore' | 'isolation_forest'
    threshold: number
  }
}

export interface ForecastReport {
  id: string
  title: string
  type: 'summary' | 'detailed' | 'comparison' | 'accuracy'
  forecastData: ForecastData
  analysis: {
    keyFindings: string[]
    risks: string[]
    opportunities: string[]
    recommendations: string[]
  }
  charts: {
    type: 'line' | 'bar' | 'area' | 'scatter'
    title: string
    data: any
    config: any
  }[]
  generatedAt: string
  generatedBy: string
  format: 'json' | 'pdf' | 'excel'
  recipients?: string[]
}

export interface ForecastBenchmark {
  period: string
  actualValue: number
  forecastedValue: number
  error: number
  percentageError: number
  algorithm: string
  confidence: number
  notes?: string
}

export interface ForecastOptimization {
  currentAccuracy: number
  optimizedParams: Record<string, any>
  expectedAccuracy: number
  improvementPotential: number
  recommendations: {
    parameter: string
    currentValue: any
    suggestedValue: any
    impact: number
    reasoning: string
  }[]
}