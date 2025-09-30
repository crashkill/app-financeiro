import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors, createCorsResponse, createErrorResponse } from '../_shared/cors.ts'
import { authenticateUser, requirePermission } from '../_shared/auth.ts'
import { logger } from '../_shared/logger.ts'
import { DatabaseService } from '../_shared/database.ts'
import { ForecastService } from './forecast-service.ts'
import type { 
  ForecastRequest, 
  ForecastResponse,
  ForecastData
} from './types.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  try {
    logger.info('Forecast generation request received', {
      method: req.method,
      url: req.url
    }, 'generate-forecast')

    // Only allow POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405)
    }

    // Authenticate user
    const authResult = await authenticateUser(req)
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('Authentication required', 401)
    }

    // Check permissions
    const hasPermission = await requirePermission(authResult.user, 'view_forecasts')
    if (!hasPermission) {
      return createErrorResponse('Insufficient permissions', 403)
    }

    // Parse request body
    let requestData: ForecastRequest
    try {
      requestData = await req.json()
    } catch (error) {
      logger.error('Invalid JSON in request body', { error: error.message }, 'generate-forecast')
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Validate request data
    const validationResult = validateForecastRequest(requestData)
    if (!validationResult.isValid) {
      logger.warn('Invalid forecast request', {
        errors: validationResult.errors,
        userId: authResult.user.id
      }, 'generate-forecast')
      return createErrorResponse(`Validation failed: ${validationResult.errors.join(', ')}`, 400)
    }

    // Initialize services
    const dbService = new DatabaseService()
    const forecastService = new ForecastService(dbService)

    // Generate forecast
    const forecastData = await forecastService.generateForecast(requestData, authResult.user.id)

    // Log audit event
    await dbService.logAuditEvent({
      user_id: authResult.user.id,
      action: 'generate_forecast',
      resource_type: 'forecast',
      resource_id: null,
      details: {
        forecast_type: requestData.forecastType,
        periods: requestData.periods,
        algorithm: requestData.algorithm,
        generated_periods: forecastData.periods.length
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    })

    // Prepare response
    const response: ForecastResponse = {
      success: true,
      message: 'Forecast generated successfully',
      data: forecastData,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: authResult.user.id,
        algorithm: requestData.algorithm,
        confidence: forecastData.confidence,
        dataPoints: forecastData.historicalDataPoints
      }
    }

    logger.info('Forecast generated successfully', {
      userId: authResult.user.id,
      forecastType: requestData.forecastType,
      periods: requestData.periods,
      algorithm: requestData.algorithm,
      confidence: forecastData.confidence
    }, 'generate-forecast')

    return createCorsResponse(response, 200)

  } catch (error) {
    logger.error('Unexpected error in forecast generation', {
      error: error.message,
      stack: error.stack
    }, 'generate-forecast')

    return createErrorResponse('Internal server error', 500)
  }
})

function validateForecastRequest(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  if (!data.forecastType) {
    errors.push('forecastType is required')
  } else if (!['revenue', 'cost', 'profit', 'cashflow', 'comprehensive'].includes(data.forecastType)) {
    errors.push('forecastType must be one of: revenue, cost, profit, cashflow, comprehensive')
  }

  if (!data.periods || typeof data.periods !== 'number' || data.periods < 1 || data.periods > 24) {
    errors.push('periods must be a number between 1 and 24')
  }

  if (!data.algorithm) {
    errors.push('algorithm is required')
  } else if (!['linear_regression', 'moving_average', 'exponential_smoothing', 'arima', 'seasonal_decomposition'].includes(data.algorithm)) {
    errors.push('algorithm must be one of: linear_regression, moving_average, exponential_smoothing, arima, seasonal_decomposition')
  }

  // Validate date range
  if (data.startDate) {
    const startDate = new Date(data.startDate)
    if (isNaN(startDate.getTime())) {
      errors.push('startDate must be a valid date')
    }
  }

  if (data.endDate) {
    const endDate = new Date(data.endDate)
    if (isNaN(endDate.getTime())) {
      errors.push('endDate must be a valid date')
    }
    
    if (data.startDate) {
      const startDate = new Date(data.startDate)
      if (endDate <= startDate) {
        errors.push('endDate must be after startDate')
      }
    }
  }

  // Validate filters
  if (data.filters) {
    if (data.filters.accountCodes && !Array.isArray(data.filters.accountCodes)) {
      errors.push('filters.accountCodes must be an array')
    }
    
    if (data.filters.departments && !Array.isArray(data.filters.departments)) {
      errors.push('filters.departments must be an array')
    }
    
    if (data.filters.costCenters && !Array.isArray(data.filters.costCenters)) {
      errors.push('filters.costCenters must be an array')
    }
  }

  // Validate algorithm parameters
  if (data.algorithmParams) {
    if (data.algorithm === 'moving_average') {
      if (data.algorithmParams.windowSize && (typeof data.algorithmParams.windowSize !== 'number' || data.algorithmParams.windowSize < 2 || data.algorithmParams.windowSize > 12)) {
        errors.push('algorithmParams.windowSize must be a number between 2 and 12 for moving_average')
      }
    }
    
    if (data.algorithm === 'exponential_smoothing') {
      if (data.algorithmParams.alpha && (typeof data.algorithmParams.alpha !== 'number' || data.algorithmParams.alpha < 0 || data.algorithmParams.alpha > 1)) {
        errors.push('algorithmParams.alpha must be a number between 0 and 1 for exponential_smoothing')
      }
    }
  }

  // Validate scenario parameters
  if (data.scenarioParams) {
    if (data.scenarioParams.growthRate && typeof data.scenarioParams.growthRate !== 'number') {
      errors.push('scenarioParams.growthRate must be a number')
    }
    
    if (data.scenarioParams.seasonalityFactor && typeof data.scenarioParams.seasonalityFactor !== 'number') {
      errors.push('scenarioParams.seasonalityFactor must be a number')
    }
    
    if (data.scenarioParams.volatility && (typeof data.scenarioParams.volatility !== 'number' || data.scenarioParams.volatility < 0)) {
      errors.push('scenarioParams.volatility must be a non-negative number')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}