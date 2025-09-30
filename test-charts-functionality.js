import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testChartsData() {
  console.log('🔍 Testando dados para gráficos...\n');

  try {
    // Teste 1: Verificar dados mensais para um projeto específico
    console.log('📊 Teste 1: Dados mensais para gráficos');
    
    const projeto = 'NCPVIA068.1 - OGS - PORTAL 2017';
    const ano = 2025;
    
    const { data: dadosMensais, error } = await supabase
      .from('dre_hitss')
      .select('mes, receita_total, custo_total, desoneracao')
      .eq('projeto', projeto)
      .eq('ano', ano)
      .order('mes');

    if (error) {
      console.error('❌ Erro ao buscar dados mensais:', error);
      return;
    }

    console.log(`📈 Dados encontrados para ${projeto} (${ano}):`, dadosMensais.length, 'registros');

    // Agrupar dados por mês (simulando o que o ProjectCharts faz)
    const dadosAgrupados = {};
    
    dadosMensais.forEach(registro => {
      const mes = registro.mes;
      if (!dadosAgrupados[mes]) {
        dadosAgrupados[mes] = {
          mes: mes,
          receita_total: 0,
          custo_total: 0,
          desoneração_total: 0
        };
      }
      
      dadosAgrupados[mes].receita_total += registro.receita_total || 0;
      dadosAgrupados[mes].custo_total += registro.custo_total || 0;
      dadosAgrupados[mes].desoneração_total += registro.desoneracao || 0;
    });

    console.log('\n📊 Dados agrupados por mês:');
    Object.values(dadosAgrupados).forEach(dado => {
      console.log(`Mês ${dado.mes}:`);
      console.log(`  Receita: R$ ${dado.receita_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`  Custo: R$ ${Math.abs(dado.custo_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`  Desoneração: R$ ${dado.desoneração_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      
      const margem = dado.receita_total > 0 ? (dado.receita_total - Math.abs(dado.custo_total)) / dado.receita_total : 0;
      console.log(`  Margem: ${(margem * 100).toFixed(1)}%\n`);
    });

    // Teste 2: Verificar se há dados para todos os meses
    console.log('📅 Teste 2: Verificação de meses com dados');
    const mesesComDados = Object.keys(dadosAgrupados).map(Number).sort((a, b) => a - b);
    console.log('Meses com dados:', mesesComDados);
    
    const mesesSemDados = [];
    for (let mes = 1; mes <= 12; mes++) {
      if (!mesesComDados.includes(mes)) {
        mesesSemDados.push(mes);
      }
    }
    
    if (mesesSemDados.length > 0) {
      console.log('⚠️ Meses sem dados:', mesesSemDados);
    } else {
      console.log('✅ Todos os meses têm dados');
    }

    // Teste 3: Simular estrutura de dados que o gráfico espera
    console.log('\n🎯 Teste 3: Estrutura de dados para gráfico');
    const dadosParaGrafico = Object.values(dadosAgrupados);
    console.log('Estrutura de dados que será enviada para ProjectCharts:');
    console.log(JSON.stringify(dadosParaGrafico, null, 2));

    console.log('\n✅ Teste de dados para gráficos concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testChartsData();