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
    // Consulta para obter anos disponíveis
    const { data, error } = await supabase
      .from('dim_periodo')
      .select('ano')
      .order('ano', { ascending: false });

    if (error) {
      throw error;
    }

    // Extrai anos únicos
    const years = [...new Set(data?.map(item => item.ano))];

    // Retorna os dados formatados
    return response.status(200).json({
      success: true,
      data: years || [],
    });
  } catch (error) {
    console.error('Erro ao buscar anos:', error);
    return response.status(500).json({
      success: false,
      error: 'Erro ao buscar anos',
    });
  }
}