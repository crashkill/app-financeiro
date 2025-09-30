import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const { projeto, ano } = request.query;
    
    if (!projeto || !ano) {
      return response.status(400).json({
        success: false,
        error: 'Parâmetros projeto e ano são obrigatórios'
      });
    }

    // Consulta para obter dados financeiros
    const { data, error } = await supabase
      .rpc('get_financial_data', {
        p_projeto: Array.isArray(projeto) ? projeto[0] : projeto,
        p_ano: Array.isArray(ano) ? parseInt(ano[0]) : parseInt(ano as string)
      });

    if (error) {
      throw error;
    }

    // Retorna os dados formatados
    return response.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    return response.status(500).json({
      success: false,
      error: 'Erro ao buscar dados financeiros'
    });
  }
}