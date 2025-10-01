import { DatabaseService } from '../_shared/database.ts'
import { Logger } from '../_shared/logger.ts'
import {
  ForecastRequest,
  ForecastData,
  ForecastPeriod,
  ForecastInsight,
  HistoricalData,
  ForecastValidation,
  SeasonalPattern,
  TrendAnalysis,
  ForecastConfiguration
} from './types.ts'

export class ForecastService {
  private db: DatabaseService
  private logger: Logger
  private config: ForecastConfiguration

  constructor(db: DatabaseService, logger: Logger, config?: Partial<ForecastConfiguration>) {
    this.db = db
    this.logger = logger
    this.config = {
      defaultAlgorithm: 'linear_regression',
      defaultPeriods: 12,
      confidenceLevel: 0.95,
      enableAutoRetraining: true,
      retrainingFrequency: 'monthly',
      accuracyThreshold: 0.85,
      alertThresholds: {
        revenue: { decrease: -0.1, increase: 0.2 },
        cost: { increase: 0.15 },
        profit: { decrease: -0.15 }
      },
      seasonalityDetection: {
        enabled: true,
        minPeriods: 12,
        significanceLevel: 0.05
      },
      outlierDetection: {
        enabled: true,
        method: 'iqr',
        threshold: 1.5
      },
      ...config
    }
  }

  async generateForecast(request: ForecastRequest, userId: string): Promise<ForecastData> {
    this.logger.info('Iniciando geração de previsão', { 
      forecastType: request.forecastType,
      algorithm: request.algorithm,
      periods: request.periods,
      userId 
    })

    try {
      // Validar requisição
      const validation = this.validateRequest(request)
      if (!validation.isValid) {
        throw new Error(`Requisição inválida: ${validation.errors.join(', ')}`)
      }

      // Buscar dados históricos
      const historicalData = await this.fetchHistoricalData(request)
      if (historicalData.length === 0) {
        throw new Error('Nenhum dado histórico encontrado para os filtros especificados')
      }

      // Detectar e remover outliers
      const cleanedData = this.config.outlierDetection.enabled 
        ? this.removeOutliers(historicalData)
        : historicalData

      // Analisar sazonalidade e tendência
      const seasonalPatterns = this.config.seasonalityDetection.enabled 
        ? this.detectSeasonality(cleanedData)
        : []
      const trendAnalysis = this.analyzeTrend(cleanedData)

      // Gerar previsão baseada no algoritmo selecionado
      const forecastPeriods = await this.generateForecastPeriods(
        request,
        cleanedData,
        seasonalPatterns,
        trendAnalysis
      )

      // Calcular intervalos de confiança
      const periodsWithConfidence = request.options?.includeConfidenceIntervals
        ? this.calculateConfidenceIntervals(forecastPeriods, cleanedData, request.options.confidenceLevel || this.config.confidenceLevel)
        : forecastPeriods

      // Gerar cenários (otimista, pessimista, mais provável)
      const scenarios = request.options?.includeScenarios
        ? this.generateScenarios(periodsWithConfidence, request.scenarioParams)
        : undefined

      // Gerar insights
      const insights = request.options?.generateInsights
        ? this.generateInsights(periodsWithConfidence, historicalData, trendAnalysis, seasonalPatterns)
        : []

      // Calcular métricas de precisão
      const accuracy = this.calculateAccuracy(cleanedData, request.algorithm)

      const forecastData: ForecastData = {
        forecastType: request.forecastType,
        algorithm: request.algorithm,
        periods: periodsWithConfidence,
        confidence: accuracy.mape > 0 ? Math.max(0, 1 - accuracy.mape) : 0.8,
        historicalDataPoints: cleanedData.length,
        scenarios,
        insights,
        metadata: {
          generatedAt: new Date().toISOString(),
          dataRange: {
            startDate: cleanedData[0]?.date || '',
            endDate: cleanedData[cleanedData.length - 1]?.date || ''
          },
          algorithmParams: request.algorithmParams || {},
          accuracy
        }
      }

      // Salvar no banco se solicitado
      if (request.options?.saveToDatabase) {
        await this.saveForecastToDatabase(forecastData, userId)
      }

      this.logger.info('Previsão gerada com sucesso', {
        periods: forecastData.periods.length,
        confidence: forecastData.confidence,
        dataPoints: forecastData.historicalDataPoints
      })

      return forecastData

    } catch (error) {
      this.logger.error('Erro ao gerar previsão', { error: error.message, request })
      throw error
    }
  }

  private validateRequest(request: ForecastRequest): ForecastValidation {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Validar tipo de previsão
    const validTypes = ['revenue', 'cost', 'profit', 'cashflow', 'comprehensive']
    if (!validTypes.includes(request.forecastType)) {
      errors.push(`Tipo de previsão inválido: ${request.forecastType}`)
    }

    // Validar algoritmo
    const validAlgorithms = ['linear_regression', 'moving_average', 'exponential_smoothing', 'arima', 'seasonal_decomposition']
    if (!validAlgorithms.includes(request.algorithm)) {
      errors.push(`Algoritmo inválido: ${request.algorithm}`)
    }

    // Validar períodos
    if (request.periods < 1 || request.periods > 24) {
      errors.push('Número de períodos deve estar entre 1 e 24')
    }

    // Validar parâmetros do algoritmo
    if (request.algorithmParams) {
      const params = request.algorithmParams
      
      if (request.algorithm === 'moving_average' && params.windowSize) {
        if (params.windowSize < 2 || params.windowSize > 12) {
          errors.push('Tamanho da janela para média móvel deve estar entre 2 e 12')
        }
      }

      if (request.algorithm === 'exponential_smoothing') {
        if (params.alpha && (params.alpha < 0 || params.alpha > 1)) {
          errors.push('Parâmetro alpha deve estar entre 0 e 1')
        }
        if (params.beta && (params.beta < 0 || params.beta > 1)) {
          errors.push('Parâmetro beta deve estar entre 0 e 1')
        }
        if (params.gamma && (params.gamma < 0 || params.gamma > 1)) {
          errors.push('Parâmetro gamma deve estar entre 0 e 1')
        }
      }

      if (request.algorithm === 'linear_regression' && params.polynomialDegree) {
        if (params.polynomialDegree < 1 || params.polynomialDegree > 3) {
          errors.push('Grau do polinômio deve estar entre 1 e 3')
        }
      }
    }

    // Validar nível de confiança
    if (request.options?.confidenceLevel) {
      const validLevels = [0.8, 0.9, 0.95, 0.99]
      if (!validLevels.includes(request.options.confidenceLevel)) {
        warnings.push('Nível de confiança recomendado: 0.8, 0.9, 0.95 ou 0.99')
      }
    }

    // Sugestões baseadas no tipo de previsão
    if (request.forecastType === 'revenue' && request.algorithm === 'moving_average') {
      suggestions.push('Para previsão de receita, considere usar regressão linear ou suavização exponencial')
    }

    if (request.periods > 12 && request.algorithm === 'moving_average') {
      suggestions.push('Para previsões de longo prazo, considere algoritmos mais sofisticados como ARIMA')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  private async fetchHistoricalData(request: ForecastRequest): Promise<HistoricalData[]> {
    const endDate = request.endDate || new Date().toISOString().slice(0, 7)
    const startDate = request.startDate || this.calculateStartDate(endDate, 24) // 24 meses por padrão

    let query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', data_transacao), 'YYYY-MM') as period,
        DATE_TRUNC('month', data_transacao) as date,
        SUM(valor) as value,
        codigo_conta as account_code,
        departamento as department,
        centro_custo as cost_center,
        natureza as nature,
        resumo_conta as summary
      FROM transacoes_financeiras
      WHERE data_transacao >= $1 AND data_transacao <= $2
    `

    const params: any[] = [startDate + '-01', endDate + '-31']
    let paramIndex = 3

    // Aplicar filtros
    if (request.filters?.accountCodes?.length) {
      query += ` AND codigo_conta = ANY($${paramIndex})`
      params.push(request.filters.accountCodes)
      paramIndex++
    }

    if (request.filters?.departments?.length) {
      query += ` AND departamento = ANY($${paramIndex})`
      params.push(request.filters.departments)
      paramIndex++
    }

    if (request.filters?.costCenters?.length) {
      query += ` AND centro_custo = ANY($${paramIndex})`
      params.push(request.filters.costCenters)
      paramIndex++
    }

    if (request.filters?.natures?.length) {
      query += ` AND natureza = ANY($${paramIndex})`
      params.push(request.filters.natures)
      paramIndex++
    }

    if (request.filters?.summaries?.length) {
      query += ` AND resumo_conta = ANY($${paramIndex})`
      params.push(request.filters.summaries)
      paramIndex++
    }

    // Filtrar por tipo de previsão
    switch (request.forecastType) {
      case 'revenue':
        query += ` AND natureza = 'Receita'`
        break
      case 'cost':
        query += ` AND natureza IN ('Custo', 'Despesa')`
        break
      case 'profit':
        // Calcular lucro (receita - custo - despesa)
        query = `
          SELECT 
            period,
            date,
            SUM(CASE WHEN natureza = 'Receita' THEN value ELSE -value END) as value
          FROM (
            ${query}
          ) subquery
        `
        break
    }

    query += `
      GROUP BY period, date, codigo_conta, departamento, centro_custo, natureza, resumo_conta
      ORDER BY date
    `

    const result = await this.db.query(query, params)
    
    return result.rows.map(row => ({
      period: row.period,
      date: row.date.toISOString(),
      value: parseFloat(row.value) || 0,
      accountCode: row.account_code,
      department: row.department,
      costCenter: row.cost_center,
      nature: row.nature,
      summary: row.summary
    }))
  }

  private removeOutliers(data: HistoricalData[]): HistoricalData[] {
    if (data.length < 4) return data

    const values = data.map(d => d.value).sort((a, b) => a - b)
    const q1 = values[Math.floor(values.length * 0.25)]
    const q3 = values[Math.floor(values.length * 0.75)]
    const iqr = q3 - q1
    const threshold = this.config.outlierDetection.threshold
    
    const lowerBound = q1 - threshold * iqr
    const upperBound = q3 + threshold * iqr

    const filteredData = data.filter(d => d.value >= lowerBound && d.value <= upperBound)
    
    if (filteredData.length < data.length) {
      this.logger.info('Outliers removidos', {
        original: data.length,
        filtered: filteredData.length,
        removed: data.length - filteredData.length
      })
    }

    return filteredData
  }

  private detectSeasonality(data: HistoricalData[]): SeasonalPattern[] {
    if (data.length < this.config.seasonalityDetection.minPeriods) {
      return []
    }

    const monthlyData: { [month: number]: number[] } = {}
    
    data.forEach(d => {
      const month = new Date(d.date).getMonth() + 1
      if (!monthlyData[month]) monthlyData[month] = []
      monthlyData[month].push(d.value)
    })

    const patterns: SeasonalPattern[] = []
    const overallAverage = data.reduce((sum, d) => sum + d.value, 0) / data.length

    for (let month = 1; month <= 12; month++) {
      if (monthlyData[month] && monthlyData[month].length > 0) {
        const monthValues = monthlyData[month]
        const monthAverage = monthValues.reduce((sum, v) => sum + v, 0) / monthValues.length
        const variance = monthValues.reduce((sum, v) => sum + Math.pow(v - monthAverage, 2), 0) / monthValues.length
        
        patterns.push({
          month,
          factor: overallAverage > 0 ? monthAverage / overallAverage : 1,
          confidence: Math.min(1, monthValues.length / 3), // Mais dados = maior confiança
          historicalAverage: monthAverage,
          variance
        })
      }
    }

    return patterns
  }

  private analyzeTrend(data: HistoricalData[]): TrendAnalysis {
    if (data.length < 3) {
      return {
        direction: 'stable',
        strength: 0,
        slope: 0,
        r_squared: 0,
        significance: 0
      }
    }

    // Regressão linear simples
    const n = data.length
    const x = data.map((_, i) => i)
    const y = data.map(d => d.value)
    
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Calcular R²
    const yMean = sumY / n
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept
      return sum + Math.pow(yi - predicted, 2)
    }, 0)
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0

    // Determinar direção e força da tendência
    const direction = Math.abs(slope) < 0.01 ? 'stable' : slope > 0 ? 'increasing' : 'decreasing'
    const strength = Math.min(1, Math.abs(rSquared))
    
    return {
      direction,
      strength,
      slope,
      r_squared: rSquared,
      significance: strength > 0.5 ? 0.95 : strength > 0.3 ? 0.8 : 0.5
    }
  }

  private async generateForecastPeriods(
    request: ForecastRequest,
    historicalData: HistoricalData[],
    seasonalPatterns: SeasonalPattern[],
    trendAnalysis: TrendAnalysis
  ): Promise<ForecastPeriod[]> {
    const lastDate = new Date(historicalData[historicalData.length - 1].date)
    const periods: ForecastPeriod[] = []

    for (let i = 1; i <= request.periods; i++) {
      const forecastDate = new Date(lastDate)
      forecastDate.setMonth(forecastDate.getMonth() + i)
      
      const period = forecastDate.toISOString().slice(0, 7)
      const month = forecastDate.getMonth() + 1
      
      let value = 0
      let components = { trend: 0, seasonal: 0, residual: 0 }

      switch (request.algorithm) {
        case 'linear_regression':
          value = this.linearRegressionForecast(historicalData, i, request.algorithmParams)
          break
        case 'moving_average':
          value = this.movingAverageForecast(historicalData, request.algorithmParams?.windowSize || 3)
          break
        case 'exponential_smoothing':
          value = this.exponentialSmoothingForecast(historicalData, i, request.algorithmParams)
          break
        case 'seasonal_decomposition':
          const decomposition = this.seasonalDecompositionForecast(
            historicalData, i, seasonalPatterns, trendAnalysis, request.algorithmParams
          )
          value = decomposition.value
          components = decomposition.components
          break
        default:
          value = this.linearRegressionForecast(historicalData, i)
      }

      // Aplicar fatores sazonais se disponíveis
      if (seasonalPatterns.length > 0 && request.algorithm !== 'seasonal_decomposition') {
        const seasonalPattern = seasonalPatterns.find(p => p.month === month)
        if (seasonalPattern) {
          value *= seasonalPattern.factor
          components.seasonal = value * (seasonalPattern.factor - 1)
        }
      }

      // Aplicar parâmetros de cenário
      if (request.scenarioParams) {
        value = this.applyScenarioParams(value, request.scenarioParams, i)
      }

      periods.push({
        period,
        date: forecastDate.toISOString(),
        value: Math.max(0, value), // Evitar valores negativos
        components: Object.values(components).some(c => c !== 0) ? components : undefined
      })
    }

    return periods
  }

  private linearRegressionForecast(
    data: HistoricalData[], 
    periodsAhead: number, 
    params?: any
  ): number {
    const n = data.length
    const x = data.map((_, i) => i)
    const y = data.map(d => d.value)
    
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    const futureX = n + periodsAhead - 1
    
    if (params?.polynomialDegree === 2) {
      // Regressão quadrática simplificada
      const acceleration = slope * 0.1 // Fator de aceleração simples
      return intercept + slope * futureX + acceleration * futureX * futureX
    }
    
    return intercept + slope * futureX
  }

  private movingAverageForecast(data: HistoricalData[], windowSize: number): number {
    const window = Math.min(windowSize, data.length)
    const recentData = data.slice(-window)
    return recentData.reduce((sum, d) => sum + d.value, 0) / recentData.length
  }

  private exponentialSmoothingForecast(
    data: HistoricalData[], 
    periodsAhead: number, 
    params?: any
  ): number {
    const alpha = params?.alpha || 0.3
    const beta = params?.beta || 0.1
    
    let level = data[0].value
    let trend = data.length > 1 ? data[1].value - data[0].value : 0
    
    for (let i = 1; i < data.length; i++) {
      const prevLevel = level
      level = alpha * data[i].value + (1 - alpha) * (level + trend)
      trend = beta * (level - prevLevel) + (1 - beta) * trend
    }
    
    return level + periodsAhead * trend
  }

  private seasonalDecompositionForecast(
    data: HistoricalData[],
    periodsAhead: number,
    seasonalPatterns: SeasonalPattern[],
    trendAnalysis: TrendAnalysis,
    params?: any
  ): { value: number; components: { trend: number; seasonal: number; residual: number } } {
    const lastValue = data[data.length - 1].value
    const trendComponent = trendAnalysis.slope * periodsAhead
    
    const futureDate = new Date(data[data.length - 1].date)
    futureDate.setMonth(futureDate.getMonth() + periodsAhead)
    const month = futureDate.getMonth() + 1
    
    const seasonalPattern = seasonalPatterns.find(p => p.month === month)
    const seasonalComponent = seasonalPattern ? (seasonalPattern.factor - 1) * lastValue : 0
    
    const baseValue = lastValue + trendComponent
    const seasonalValue = baseValue + seasonalComponent
    
    return {
      value: seasonalValue,
      components: {
        trend: trendComponent,
        seasonal: seasonalComponent,
        residual: 0
      }
    }
  }

  private applyScenarioParams(value: number, params: any, periodsAhead: number): number {
    let adjustedValue = value
    
    if (params.growthRate) {
      adjustedValue *= Math.pow(1 + params.growthRate, periodsAhead)
    }
    
    if (params.volatility) {
      const volatilityFactor = 1 + (Math.random() - 0.5) * params.volatility
      adjustedValue *= volatilityFactor
    }
    
    if (params.externalFactors) {
      const factors = params.externalFactors
      if (factors.economicGrowth) {
        adjustedValue *= (1 + factors.economicGrowth)
      }
      if (factors.inflation) {
        adjustedValue *= (1 + factors.inflation)
      }
      if (factors.marketConditions) {
        const conditionMultiplier = {
          optimistic: 1.1,
          neutral: 1.0,
          pessimistic: 0.9
        }[factors.marketConditions] || 1.0
        adjustedValue *= conditionMultiplier
      }
    }
    
    return adjustedValue
  }

  private calculateConfidenceIntervals(
    periods: ForecastPeriod[],
    historicalData: HistoricalData[],
    confidenceLevel: number
  ): ForecastPeriod[] {
    // Calcular erro padrão baseado nos dados históricos
    const values = historicalData.map(d => d.value)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1)
    const standardError = Math.sqrt(variance)
    
    // Z-score para diferentes níveis de confiança
    const zScores: { [key: number]: number } = {
      0.8: 1.28,
      0.9: 1.645,
      0.95: 1.96,
      0.99: 2.576
    }
    
    const zScore = zScores[confidenceLevel] || 1.96
    
    return periods.map((period, index) => {
      // Erro aumenta com a distância da previsão
      const errorMultiplier = Math.sqrt(index + 1)
      const margin = zScore * standardError * errorMultiplier
      
      return {
        ...period,
        confidenceInterval: {
          lower: Math.max(0, period.value - margin),
          upper: period.value + margin
        }
      }
    })
  }

  private generateScenarios(
    periods: ForecastPeriod[],
    scenarioParams?: any
  ): { optimistic: ForecastPeriod[]; pessimistic: ForecastPeriod[]; mostLikely: ForecastPeriod[] } {
    const optimisticMultiplier = 1.2
    const pessimisticMultiplier = 0.8
    
    return {
      optimistic: periods.map(p => ({
        ...p,
        value: p.value * optimisticMultiplier,
        confidenceInterval: p.confidenceInterval ? {
          lower: p.confidenceInterval.lower * optimisticMultiplier,
          upper: p.confidenceInterval.upper * optimisticMultiplier
        } : undefined
      })),
      pessimistic: periods.map(p => ({
        ...p,
        value: p.value * pessimisticMultiplier,
        confidenceInterval: p.confidenceInterval ? {
          lower: p.confidenceInterval.lower * pessimisticMultiplier,
          upper: p.confidenceInterval.upper * pessimisticMultiplier
        } : undefined
      })),
      mostLikely: periods // Cenário mais provável é a previsão base
    }
  }

  private generateInsights(
    periods: ForecastPeriod[],
    historicalData: HistoricalData[],
    trendAnalysis: TrendAnalysis,
    seasonalPatterns: SeasonalPattern[]
  ): ForecastInsight[] {
    const insights: ForecastInsight[] = []
    
    // Insight sobre tendência
    if (trendAnalysis.strength > 0.5) {
      insights.push({
        type: 'trend',
        title: `Tendência ${trendAnalysis.direction === 'increasing' ? 'crescente' : 'decrescente'} detectada`,
        description: `Os dados mostram uma tendência ${trendAnalysis.direction === 'increasing' ? 'de crescimento' : 'de declínio'} com força de ${(trendAnalysis.strength * 100).toFixed(1)}%`,
        impact: trendAnalysis.strength > 0.8 ? 'high' : 'medium',
        confidence: trendAnalysis.significance,
        recommendation: trendAnalysis.direction === 'increasing' 
          ? 'Considere investir em capacidade adicional'
          : 'Analise as causas do declínio e implemente ações corretivas'
      })
    }
    
    // Insight sobre sazonalidade
    if (seasonalPatterns.length > 0) {
      const strongSeasonality = seasonalPatterns.filter(p => Math.abs(p.factor - 1) > 0.2)
      if (strongSeasonality.length > 0) {
        const peakMonth = strongSeasonality.reduce((max, p) => p.factor > max.factor ? p : max)
        insights.push({
          type: 'seasonality',
          title: 'Padrão sazonal identificado',
          description: `Mês ${peakMonth.month} apresenta pico sazonal com fator ${peakMonth.factor.toFixed(2)}`,
          impact: 'medium',
          confidence: peakMonth.confidence,
          recommendation: 'Planeje recursos e estoque considerando a sazonalidade'
        })
      }
    }
    
    // Insight sobre volatilidade
    const values = historicalData.map(d => d.value)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    const coefficientOfVariation = Math.sqrt(variance) / mean
    
    if (coefficientOfVariation > 0.3) {
      insights.push({
        type: 'risk',
        title: 'Alta volatilidade detectada',
        description: `Coeficiente de variação de ${(coefficientOfVariation * 100).toFixed(1)}% indica alta volatilidade`,
        impact: 'high',
        confidence: 0.9,
        recommendation: 'Considere estratégias de mitigação de risco e planejamento de contingência'
      })
    }
    
    // Insight sobre oportunidades
    const lastValue = historicalData[historicalData.length - 1].value
    const forecastGrowth = periods.length > 0 ? (periods[periods.length - 1].value - lastValue) / lastValue : 0
    
    if (forecastGrowth > 0.1) {
      insights.push({
        type: 'opportunity',
        title: 'Oportunidade de crescimento',
        description: `Previsão indica crescimento de ${(forecastGrowth * 100).toFixed(1)}% no período`,
        impact: 'high',
        confidence: 0.8,
        recommendation: 'Prepare-se para aproveitar o crescimento previsto'
      })
    }
    
    return insights
  }

  private calculateAccuracy(data: HistoricalData[], algorithm: string): {
    mape: number;
    rmse: number;
    mae: number;
  } {
    if (data.length < 4) {
      return { mape: 0.2, rmse: 0, mae: 0 } // Valores padrão para poucos dados
    }
    
    // Usar os últimos 20% dos dados para teste
    const testSize = Math.max(1, Math.floor(data.length * 0.2))
    const trainData = data.slice(0, -testSize)
    const testData = data.slice(-testSize)
    
    let totalError = 0
    let totalSquaredError = 0
    let totalPercentageError = 0
    
    testData.forEach((actual, index) => {
      let predicted = 0
      
      switch (algorithm) {
        case 'moving_average':
          predicted = this.movingAverageForecast(trainData, 3)
          break
        case 'linear_regression':
          predicted = this.linearRegressionForecast(trainData, index + 1)
          break
        default:
          predicted = this.linearRegressionForecast(trainData, index + 1)
      }
      
      const error = Math.abs(actual.value - predicted)
      const squaredError = Math.pow(actual.value - predicted, 2)
      const percentageError = actual.value !== 0 ? error / Math.abs(actual.value) : 0
      
      totalError += error
      totalSquaredError += squaredError
      totalPercentageError += percentageError
    })
    
    return {
      mae: totalError / testData.length,
      rmse: Math.sqrt(totalSquaredError / testData.length),
      mape: totalPercentageError / testData.length
    }
  }

  private async saveForecastToDatabase(forecastData: ForecastData, userId: string): Promise<void> {
    const query = `
      INSERT INTO previsoes_financeiras (
        tipo_previsao, algoritmo, periodos_previstos, confianca,
        pontos_dados_historicos, metadados, criado_por, criado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `
    
    await this.db.query(query, [
      forecastData.forecastType,
      forecastData.algorithm,
      JSON.stringify(forecastData.periods),
      forecastData.confidence,
      forecastData.historicalDataPoints,
      JSON.stringify(forecastData.metadata),
      userId
    ])
  }

  private calculateStartDate(endDate: string, monthsBack: number): string {
    const date = new Date(endDate + '-01')
    date.setMonth(date.getMonth() - monthsBack)
    return date.toISOString().slice(0, 7)
  }
}