import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TriggerResponse {
  success: boolean;
  message: string;
  execution_id?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando trigger do robô HITSS...');

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // URL do seu backend onde o robô está rodando
    const backendUrl = Deno.env.get('BACKEND_URL') || 'http://localhost:3001'
    const robotEndpoint = `${backendUrl}/api/hitss-robot/execute`

    console.log(`📡 Chamando robô em: ${robotEndpoint}`);

    // Fazer chamada HTTP para o seu backend
    const response = await fetch(robotEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('BACKEND_API_KEY') || 'hitss-robot-key'}`
      },
      body: JSON.stringify({
        trigger: 'supabase_cron',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Backend respondeu com status ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('✅ Robô executado com sucesso:', result);

    // Log da execução no Supabase
    try {
      await supabase
        .from('automation_logs')
        .insert({
          type: 'robot_trigger',
          status: result.success ? 'success' : 'error',
          message: result.message || 'Robô executado via Edge Function',
          execution_id: result.execution_id,
          metadata: {
            backend_url: robotEndpoint,
            trigger_source: 'supabase_edge_function',
            result: result
          }
        });
    } catch (logError) {
      console.warn('⚠️ Erro ao registrar log:', logError);
    }

    const responseData: TriggerResponse = {
      success: true,
      message: 'Robô HITSS acionado com sucesso',
      execution_id: result.execution_id
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Erro ao acionar robô:', error);

    // Log do erro no Supabase
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      await supabase
        .from('automation_logs')
        .insert({
          type: 'robot_trigger',
          status: 'error',
          message: `Erro ao acionar robô: ${error.message}`,
          metadata: {
            error: error.message,
            trigger_source: 'supabase_edge_function'
          }
        });
    } catch (logError) {
      console.warn('⚠️ Erro ao registrar log de erro:', logError);
    }

    const errorResponse: TriggerResponse = {
      success: false,
      message: 'Erro ao acionar robô HITSS',
      error: error.message
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})