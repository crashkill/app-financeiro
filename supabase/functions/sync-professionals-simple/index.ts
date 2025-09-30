import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { logger } from '../_shared/logger.ts'
import { DatabaseService } from '../_shared/database.ts'
import { ProfessionalSyncService } from '../sync-professionals/professional-sync-service.ts'

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    logger.info('Simple professional sync request received', {
      method: req.method,
      url: req.url
    }, 'sync-professionals-simple')

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    let requestData: any
    try {
      requestData = await req.json()
    } catch (error) {
      logger.error('Invalid JSON in request body', { error: error.message }, 'sync-professionals-simple')
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate professionals array
    if (!requestData.professionals || !Array.isArray(requestData.professionals)) {
      return new Response(
        JSON.stringify({ error: 'professionals array is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize services
    const dbService = new DatabaseService()
    const syncService = new ProfessionalSyncService(dbService)

    // Set default syncType
    requestData.syncType = 'full'

    // Perform synchronization with a mock user ID
    const mockUserId = '00000000-0000-0000-0000-000000000000'
    const syncResult = await syncService.syncProfessionals(requestData, mockUserId)

    logger.info('Simple professional sync completed', {
      totalProcessed: syncResult.totalProcessed,
      created: syncResult.created,
      updated: syncResult.updated,
      errors: syncResult.errors.length
    }, 'sync-professionals-simple')

    // Prepare response
    const response = {
      success: syncResult.success,
      message: syncResult.message,
      data: {
        syncResult,
        summary: {
          totalProcessed: syncResult.totalProcessed,
          created: syncResult.created,
          updated: syncResult.updated,
          skipped: syncResult.skipped,
          errors: syncResult.errors.length
        }
      },
      errors: syncResult.errors,
      warnings: syncResult.warnings
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    logger.error('Unexpected error in simple professional sync', {
      error: error.message,
      stack: error.stack
    }, 'sync-professionals-simple')

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})