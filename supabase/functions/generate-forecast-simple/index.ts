import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors, createCorsResponse, createErrorResponse } from '../_shared/cors.ts'
import { logger } from '../_shared/logger.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  try {
    logger.info('Simple forecast generation request received', {
      method: req.method,
      url: req.url
    }, 'generate-forecast-simple')

    // Only allow POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405)
    }

    // Parse request body
    let requestData: any
    try {
      requestData = await req.json()
    } catch (error) {
      logger.error('Invalid JSON in request body', { error: error.message }, 'generate-forecast-simple')
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Validate request data
    const validationResult = validateForecastRequest(requestData)
    if (!validationResult.isValid) {
      logger.warn('Invalid forecast request', {
        errors: validationResult.errors
      }, 'generate-forecast-simple')
      return createErrorResponse(`Validation failed: ${validationResult.errors.join(', ')}`, 400)
    }

    // Generate mock forecast data
    const forecastData = generateMockForecast(requestData)

    // Prepare response
    const response = {
      success: true,
      message: 'Forecast generated successfully',
      data: forecastData,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: '00000000-0000-0000-0000-000000000000',
        algorithm: requestData.algorithm,
        confidence: forecastData.confidence,
        dataPoints: forecastData.historicalDataPoints
      }
    }

    logger.info('Simple forecast generated successfully', {
      forecastType: requestData.forecastType,
      periods: requestData.periods,
      algorithm: requestData.algorithm,
      confidence: forecastData.confidence
    }, 'generate-forecast-simple')

    return createCorsResponse(response, 200)

  } catch (error) {
    logger.error('Unexpected error in simple forecast generation', {
      error: error.message,
      stack: error.stack
    }, 'generate-forecast-simple')

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

  return {
    isValid: errors.length === 0,
    errors
  }
}

function generateMockForecast(request: any) {
  const baseValue = request.forecastType === 'revenue' ? 100000 : 
                   request.forecastType === 'cost' ? 75000 : 
                   request.forecastType === 'profit' ? 25000 : 50000

  const periods = []
  const currentDate = new Date()
  
  for (let i = 1; i <= request.periods; i++) {
    const futureDate = new Date(currentDate)
    futureDate.setMonth(currentDate.getMonth() + i)
    
    // Generate some variation based on algorithm
    let variation = 1
    if (request.algorithm === 'linear_regression') {
      variation = 1 + (i * 0.05) // 5% growth per period
    } else if (request.algorithm === 'moving_average') {
      variation = 1 + (Math.random() * 0.1 - 0.05) // ±5% random variation
    } else if (request.algorithm === 'exponential_smoothing') {
      variation = 1 + (i * 0.03) // 3% growth per period
    }
    
    const value = baseValue * variation
    
    periods.push({
      period: futureDate.toISOString().slice(0, 7), // YYYY-MM format
      date: futureDate.toISOString(),
      value: Math.round(value * 100) / 100,
      confidence: 0.85 - (i * 0.05), // Decreasing confidence over time
      upperBound: Math.round(value * 1.15 * 100) / 100,
      lowerBound: Math.round(value * 0.85 * 100) / 100
    })
  }

  return {
    forecastType: request.forecastType,
    algorithm: request.algorithm,
    periods: periods,
    confidence: 0.85,
    historicalDataPoints: 12, // Mock historical data points
    insights: [
      {
        type: 'trend',
        message: `${request.forecastType} shows a positive trend with ${request.algorithm} algorithm`,
        severity: 'info',
        confidence: 0.8
      },
      {
        type: 'recommendation',
        message: 'Consider reviewing budget allocations based on forecast trends',
        severity: 'medium',
        confidence: 0.7
      }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      dataRange: {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      algorithmParams: request.algorithmParams || {},
      accuracy: {
        mape: 0.15, // Mean Absolute Percentage Error
        rmse: 5000, // Root Mean Square Error
        mae: 3500   // Mean Absolute Error
      }
    }
  }
}