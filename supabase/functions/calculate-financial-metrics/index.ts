import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors, createCorsResponse, createErrorResponse } from '../_shared/cors.ts'
import { authenticateUser, validateRequest } from '../_shared/auth.ts'
import { logger } from '../_shared/logger.ts'
import { db } from '../_shared/database.ts'
import { FinancialCalculator } from './financial-calculator.ts'
import { MetricsRequest, MetricsResponse } from './types.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  try {
    // Authenticate user (temporarily disabled for testing)
    // const user = await authenticateUser(req)
    // if (!user) {
    //   return createErrorResponse('Unauthorized', 'AUTH_ERROR', 401)
    // }
    const user = { id: 'test-user-id' } // Mock user for testing

    // Validate request
    const requestData: MetricsRequest = await validateRequest(req, {
      projectId: 'string',
      startDate: 'string',
      endDate: 'string',
      metrics: 'array',
      filters: 'object?'
    })

    logger.info('Calculating financial metrics', {
      userId: user.id,
      projectId: requestData.projectId,
      metrics: requestData.metrics
    }, 'calculate-financial-metrics')

    // Initialize calculator
    const calculator = new FinancialCalculator()

    // Calculate metrics
    const results = await calculator.calculateMetrics(requestData)

    const response: MetricsResponse = {
      success: true,
      data: results,
      metadata: {
        calculatedAt: new Date().toISOString(),
        userId: user.id,
        projectId: requestData.projectId,
        period: {
          start: requestData.startDate,
          end: requestData.endDate
        }
      }
    }

    // Log audit event
    await db.logAuditEvent({
      userId: user.id,
      action: 'CALCULATE_METRICS',
      resource: 'financial_metrics',
      resourceId: requestData.projectId,
      changes: { metrics: requestData.metrics },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    })

    logger.info('Financial metrics calculated successfully', {
      userId: user.id,
      projectId: requestData.projectId,
      metricsCount: Object.keys(results).length
    }, 'calculate-financial-metrics')

    return createCorsResponse(response)

  } catch (error) {
    logger.error('Error calculating financial metrics', {
      error: error.message,
      stack: error.stack
    }, 'calculate-financial-metrics')

    return createErrorResponse(
      error.message || 'Internal server error',
      'CALCULATION_ERROR'
    )
  }
})