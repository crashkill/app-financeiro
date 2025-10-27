// Script para testar o carregamento de projetos
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando as mesmas configurações do .env)
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarCarregamentoProjetos() {
  console.log('🔍 Testando carregamento de projetos...');
  
  try {
    // Teste 1: Buscar todos os projetos
    console.log('\n📋 Teste 1: Buscar todos os projetos');
    const { data: todosProjetos, error: erro1, count } = await supabase
      .from('projetos')
      .select('*', { count: 'exact' });
    
    if (erro1) {
      console.error('❌ Erro ao buscar todos os projetos:', erro1);
    } else {
      console.log(`✅ Total de projetos encontrados: ${count}`);
      console.log('📄 Primeiros 3 projetos:', todosProjetos?.slice(0, 3));
    }

    // Teste 2: Buscar apenas projetos ativos
    console.log('\n📋 Teste 2: Buscar projetos ativos');
    const { data: projetosAtivos, error: erro2 } = await supabase
      .from('projetos')
      .select('*')
      .eq('status', 'ativo')
      .order('nome', { ascending: true });
    
    if (erro2) {
      console.error('❌ Erro ao buscar projetos ativos:', erro2);
    } else {
      console.log(`✅ Projetos ativos encontrados: ${projetosAtivos?.length || 0}`);
      console.log('📄 Projetos ativos:', projetosAtivos?.map(p => ({ id: p.id, nome: p.nome, status: p.status })));
    }

    // Teste 3: Verificar diferentes valores de status
    console.log('\n📋 Teste 3: Verificar valores únicos de status');
    const { data: statusUnicos, error: erro3 } = await supabase
      .from('projetos')
      .select('status')
      .not('status', 'is', null);
    
    if (erro3) {
      console.error('❌ Erro ao buscar status únicos:', erro3);
    } else {
      const statusSet = new Set(statusUnicos?.map(p => p.status));
      console.log('✅ Status únicos encontrados:', Array.from(statusSet));
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar teste
testarCarregamentoProjetos();