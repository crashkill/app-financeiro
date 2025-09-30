import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Garante que o .env da raiz do projeto seja carregado
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas. Verifique seu arquivo .env na raiz do projeto.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function countUniqueProjects() {
  try {
    console.log('Buscando projetos únicos na tabela dre_hitss...');

    const { data, error } = await supabase
      .from('dre_hitss')
      .select('projeto')
      .eq('ativo', true)
      .not('projeto', 'is', null);

    if (error) {
      throw error;
    }

    const uniqueProjects = new Set(data.map(item => item.projeto).filter(Boolean));
    const count = uniqueProjects.size;

    console.log(`✅ Encontrado(s) ${count} projeto(s) único(s).`);

  } catch (error) {
    console.error('❌ Erro ao contar projetos:', error.message);
  }
}

countUniqueProjects();
