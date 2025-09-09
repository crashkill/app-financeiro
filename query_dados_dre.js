import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryDadosDre() {
  try {
    console.log('Consultando tabela dados_dre...');
    
    const { data, error } = await supabase
      .from('dados_dre')
      .select('id, codigo_conta, nome_conta, valor, ano, mes, situacao, agrupamento, usuario_id, criado_em, atualizado_em')
      .order('criado_em', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Erro ao consultar dados:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('Nenhum registro encontrado na tabela dados_dre.');
      return;
    }

    console.log(`\nEncontrados ${data.length} registros:\n`);
    console.log('ID\t\t\t\t\tCódigo\tNome da Conta\t\t\tValor\t\tAno\tMês\tSituação\tAgrupamento\t\tCriado em');
    console.log('-'.repeat(150));
    
    data.forEach(row => {
      const id = row.id.substring(0, 8) + '...';
      const codigo = row.codigo_conta || 'N/A';
      const nome = (row.nome_conta || 'N/A').substring(0, 20);
      const valor = row.valor ? parseFloat(row.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
      const ano = row.ano || 'N/A';
      const mes = row.mes || 'N/A';
      const situacao = row.situacao || 'N/A';
      const agrupamento = (row.agrupamento || 'N/A').substring(0, 15);
      const criado = row.criado_em ? new Date(row.criado_em).toLocaleString('pt-BR') : 'N/A';
      
      console.log(`${id}\t${codigo}\t${nome}\t\t${valor}\t${ano}\t${mes}\t${situacao}\t${agrupamento}\t\t${criado}`);
    });
    
    console.log(`\nTotal de registros: ${data.length}`);
    
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

queryDadosDre();