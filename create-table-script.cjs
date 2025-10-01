const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sua_chave_aqui';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDreHitssTable() {
  try {
    // Ler o arquivo SQL de migração
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20241220000000_create_dre_hitss_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executando migração da tabela dre_hitss...');
    console.log('SQL a ser executado:');
    console.log(sqlContent.substring(0, 500) + '...');
    
    // Executar o SQL usando rpc (se houver uma função personalizada)
    // Ou usar o cliente SQL diretamente se disponível
    
    // Como alternativa, vamos dividir o SQL em comandos menores
    const commands = sqlContent.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim() + ';';
      if (command.length > 1) {
        console.log(`Executando comando ${i + 1}/${commands.length}...`);
        
        // Para comandos DDL, precisaríamos de uma função RPC personalizada
        // ou usar a API de administração do Supabase
        console.log('Comando:', command.substring(0, 100) + '...');
      }
    }
    
    console.log('\n=== IMPORTANTE ===');
    console.log('Este script mostra o SQL que seria executado.');
    console.log('Para executar realmente, você precisa:');
    console.log('1. Usar o Supabase CLI: supabase db push');
    console.log('2. Ou executar o SQL diretamente no Dashboard do Supabase');
    console.log('3. Ou usar a API de administração com as credenciais corretas');
    
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  }
}

// Executar o script
createTableScript();

// Função alternativa para mostrar o SQL
function createTableScript() {
  console.log('=== SCRIPT DE CRIAÇÃO DA TABELA DRE_HITSS ===\n');
  
  try {
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20241220000000_create_dre_hitss_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Conteúdo do arquivo SQL:');
    console.log('========================');
    console.log(sqlContent);
    console.log('========================\n');
    
    console.log('Para aplicar esta migração ao projeto Supabase:');
    console.log('1. Copie o SQL acima');
    console.log('2. Acesse: https://supabase.com/dashboard/project/oomhhhfahdvavnhlbioa/sql');
    console.log('3. Cole e execute o SQL no editor');
    console.log('\nOu use o Supabase CLI se estiver configurado:');
    console.log('supabase link --project-ref oomhhhfahdvavnhlbioa');
    console.log('supabase db push');
    
  } catch (error) {
    console.error('Erro ao ler arquivo SQL:', error);
  }
}