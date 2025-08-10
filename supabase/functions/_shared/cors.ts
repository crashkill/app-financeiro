export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

export function handleCors(req: Request): Response {
  return new Response('ok', { headers: corsHeaders })
}

export function createCorsResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  )
}

export function createErrorResponse(message: string, code: string = 'INTERNAL_ERROR', status: number = 500): Response {
  return createCorsResponse({
    success: false,
    error: {
      code,
      message
    }
  }, status)
}