/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configurações do Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔐 Testando acesso às credenciais...');
    
    // Testar cada credencial individualmente
    const usernameResult = await supabase.rpc('get_secret', { secret_name: 'hitss_username' });
    console.log('Username result:', usernameResult);
    
    const passwordResult = await supabase.rpc('get_secret', { secret_name: 'hitss_password' });
    console.log('Password result:', passwordResult);
    
    const baseUrlResult = await supabase.rpc('get_secret', { secret_name: 'hitss_base_url' });
    console.log('BaseUrl result:', baseUrlResult);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          username: {
            found: !!usernameResult.data,
            error: usernameResult.error,
            value: usernameResult.data ? usernameResult.data.substring(0, 5) + '...' : null
          },
          password: {
            found: !!passwordResult.data,
            error: passwordResult.error,
            value: passwordResult.data ? passwordResult.data.substring(0, 5) + '...' : null
          },
          baseUrl: {
            found: !!baseUrlResult.data,
            error: baseUrlResult.error,
            value: baseUrlResult.data ? baseUrlResult.data.substring(0, 10) + '...' : null
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('❌ Erro ao testar credenciais:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 500,
          message: error.message,
          stack: error.stack
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});