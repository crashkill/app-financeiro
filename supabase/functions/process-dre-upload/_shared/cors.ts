/**
 * Configuração CORS para Edge Functions
 * Centraliza as configurações de CORS para todas as Edge Functions
 */

// Headers CORS padrão para todas as Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 
    'authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin, referer, user-agent',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Max-Age': '86400', // 24 horas
  'Access-Control-Allow-Credentials': 'true'
};

// Headers CORS mais restritivos para operações sensíveis
export const restrictedCorsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  'Access-Control-Allow-Headers': 
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '3600', // 1 hora
  'Access-Control-Allow-Credentials': 'true'
};

export function handleCorsOptions(
  request: Request, 
  useRestrictedCors: boolean = false
): Response {
  const headers = useRestrictedCors ? restrictedCorsHeaders : corsHeaders;
  return new Response('ok', { status: 200, headers });
}

export function createCorsResponse(
  data: any,
  options: { status?: number; statusText?: string; headers?: Record<string, string> } = {},
  useRestrictedCors: boolean = false
): Response {
  const corsHeadersToUse = useRestrictedCors ? restrictedCorsHeaders : corsHeaders;
  const responseHeaders = { ...corsHeadersToUse, 'Content-Type': 'application/json', ...options.headers };
  return new Response(typeof data === 'string' ? data : JSON.stringify(data), {
    status: options.status || 200,
    statusText: options.statusText,
    headers: responseHeaders
  });
}

export function createCorsErrorResponse(
  error: Error | string,
  status: number = 500,
  useRestrictedCors: boolean = false
): Response {
  const errorMessage = error instanceof Error ? error.message : error;
  return createCorsResponse({ success: false, error: errorMessage, timestamp: new Date().toISOString() }, { status }, useRestrictedCors);
}

export default { corsHeaders, restrictedCorsHeaders, handleCorsOptions, createCorsResponse, createCorsErrorResponse }
