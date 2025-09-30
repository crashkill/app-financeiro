const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Vite expõe variáveis de ambiente com o prefixo VITE_
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas no arquivo .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function validateFilters() {
  console.log('🚀  Iniciando validação dos filtros...');

  try {
    // 1. Validar Projetos
    console.log('   - Validando projetos...');
    const { data: projectsResponse, error: projectsError } = await supabase.functions.invoke('financial-data-unified', {
      body: { type: 'projetos' }
    });

    if (projectsError) {
      throw new Error(`Erro ao buscar projetos: ${projectsError.message}`);
    }

    if (!projectsResponse.success || !Array.isArray(projectsResponse.data)) {
        throw new Error(`Resposta inválida da Edge Function para projetos: ${JSON.stringify(projectsResponse)}`);
    }
    
    const projectCount = projectsResponse.data.length;
    console.log(`     ✅  Sucesso! ${projectCount} projetos encontrados.`);
    if (projectCount < 80) { // Esperado ~88
        console.warn(`     ⚠️  Atenção: Número de projetos (${projectCount}) é menor que o esperado.`);
    }


    // 2. Validar Anos
    console.log('\n   - Validando anos...');
    const { data: yearsResponse, error: yearsError } = await supabase.functions.invoke('financial-data-unified', {
        body: { type: 'anos' }
    });

    if (yearsError) {
        throw new Error(`Erro ao buscar anos: ${yearsError.message}`);
    }

    if (!yearsResponse.success || !Array.isArray(yearsResponse.data)) {
        throw new Error(`Resposta inválida da Edge Function para anos: ${JSON.stringify(yearsResponse)}`);
    }

    const yearCount = yearsResponse.data.length;
    const minYear = Math.min(...yearsResponse.data);
    console.log(`     ✅  Sucesso! ${yearCount} anos encontrados.`);
    console.log(`     🗓️  Anos: ${yearsResponse.data.join(', ')}`);
    if (minYear > 2016) {
        console.warn(`     ⚠️  Atenção: O ano inicial (${minYear}) é maior que o esperado (2016).`);
    }


    console.log('\n🏁  Validação concluída com sucesso!');

  } catch (error) {
    console.error('\n❌  Erro na validação:', error.message);
    process.exit(1);
  }
}

validateFilters();