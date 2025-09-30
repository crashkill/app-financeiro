import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Iniciando teste completo do fluxo DRE');
console.log('📅 Data/Hora:', new Date().toISOString());
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Service Key configurada:', supabaseServiceKey ? 'SIM' : 'NÃO');

async function testCompleteFlow() {
  const results = [];
  const startTime = new Date();
  
  try {
    // 1. Verificar conectividade com Supabase
    console.log('\n1. Verificando conectividade com Supabase...');
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        console.error('❌ Erro de conectividade:', error.message);
        results.push({ step: 'Conectividade', status: 'FALHA', error: error.message });
      } else {
        console.log('✅ Conectividade OK');
        results.push({ step: 'Conectividade', status: 'SUCESSO' });
      }
    } catch (error) {
      console.error('❌ Erro de conectividade:', error.message);
      results.push({ step: 'Conectividade', status: 'FALHA', error: error.message });
    }

    // 2. Verificar tabelas DRE existentes
    console.log('\n2. Verificando tabelas DRE...');
    
    const tablesToCheck = ['dados_dre', 'dre_hitss', 'hitss_data', 'dre_categories', 'dre_reports', 'dre_items'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
          results.push({ step: `Verificar ${table}`, status: 'FALHA', error: error.message });
        } else {
          console.log(`✅ Tabela ${table}: Acessível`);
          results.push({ step: `Verificar ${table}`, status: 'SUCESSO' });
        }
      } catch (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
        results.push({ step: `Verificar ${table}`, status: 'FALHA', error: error.message });
      }
    }

    // 3. Verificar bucket de arquivos DRE
    console.log('\n3. Verificando bucket dre-files...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Erro ao listar buckets:', bucketsError.message);
        results.push({ step: 'Verificar Buckets', status: 'FALHA', error: bucketsError.message });
      } else {
        const dreFilesBucket = buckets.find(bucket => bucket.name === 'dre-files');
        
        if (dreFilesBucket) {
          console.log('✅ Bucket dre-files encontrado');
          
          // Listar arquivos no bucket
          const { data: files, error: filesError } = await supabase.storage
            .from('dre-files')
            .list('', { limit: 10 });
          
          if (filesError) {
            console.log('❌ Erro ao listar arquivos:', filesError.message);
            results.push({ step: 'Listar Arquivos Bucket', status: 'FALHA', error: filesError.message });
          } else {
            console.log(`✅ Bucket contém ${files.length} arquivos`);
            results.push({ step: 'Verificar Bucket DRE', status: 'SUCESSO', fileCount: files.length });
          }
        } else {
          console.log('❌ Bucket dre-files não encontrado');
          results.push({ step: 'Verificar Bucket DRE', status: 'FALHA', error: 'Bucket não encontrado' });
        }
      }
    } catch (error) {
      console.error('❌ Erro na verificação do bucket:', error.message);
      results.push({ step: 'Verificar Bucket DRE', status: 'FALHA', error: error.message });
    }

    // 4. Simular download de dados HITSS
    console.log('\n4. Simulando download de dados HITSS...');
    try {
      // Verificar se existem dados HITSS recentes
      const { data: hitssData, error: hitssError } = await supabase
        .from('hitss_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (hitssError) {
        console.error('❌ Erro ao consultar hitss_data:', hitssError.message);
        results.push({ step: 'Download HITSS', status: 'FALHA', error: hitssError.message });
      } else {
        console.log(`✅ Encontrados ${hitssData.length} registros HITSS`);
        if (hitssData.length > 0) {
          console.log('Último registro HITSS:', {
            id: hitssData[0].id,
            created_at: hitssData[0].created_at,
            data_keys: Object.keys(hitssData[0]).slice(0, 5)
          });
        }
        results.push({ step: 'Download HITSS', status: 'SUCESSO', recordCount: hitssData.length });
      }
    } catch (error) {
      console.error('❌ Erro no download HITSS:', error.message);
      results.push({ step: 'Download HITSS', status: 'FALHA', error: error.message });
    }

    // 5. Verificar dados DRE processados
    console.log('\n5. Verificando dados DRE processados...');
    try {
      const { data: dadosDre, error: dreError } = await supabase
        .from('dados_dre')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(5);
      
      if (dreError) {
        console.error('❌ Erro ao consultar dados_dre:', dreError.message);
        results.push({ step: 'Dados DRE', status: 'FALHA', error: dreError.message });
      } else {
        console.log(`✅ Encontrados ${dadosDre.length} registros DRE`);
        if (dadosDre.length > 0) {
          console.log('Último registro DRE:', {
            id: dadosDre[0].id,
            criado_em: dadosDre[0].criado_em,
            data_keys: Object.keys(dadosDre[0]).slice(0, 5)
          });
        }
        results.push({ step: 'Dados DRE', status: 'SUCESSO', recordCount: dadosDre.length });
      }
    } catch (error) {
      console.error('❌ Erro na verificação DRE:', error.message);
      results.push({ step: 'Dados DRE', status: 'FALHA', error: error.message });
    }

    // 6. Verificar logs de automação
    console.log('\n6. Verificando logs de automação...');
    try {
      const { data: logs, error: logsError } = await supabase
        .from('logs_auditoria')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (logsError) {
        console.error('❌ Erro ao consultar logs:', logsError.message);
        results.push({ step: 'Logs Automação', status: 'FALHA', error: logsError.message });
      } else {
        console.log(`✅ Encontrados ${logs.length} logs de auditoria`);
        
        // Filtrar logs relacionados ao DRE
        const dreLogs = logs.filter(log => 
          log.acao && (log.acao.includes('DRE') || log.acao.includes('HITSS'))
        );
        
        console.log(`📊 Logs relacionados ao DRE: ${dreLogs.length}`);
        results.push({ step: 'Logs Automação', status: 'SUCESSO', totalLogs: logs.length, dreLogs: dreLogs.length });
      }
    } catch (error) {
      console.error('❌ Erro na verificação de logs:', error.message);
      results.push({ step: 'Logs Automação', status: 'FALHA', error: error.message });
    }

    // 7. Verificar configurações do sistema
    console.log('\n7. Verificando configurações do sistema...');
    try {
      const { data: configs, error: configError } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .order('atualizado_em', { ascending: false });
      
      if (configError) {
        console.error('❌ Erro ao consultar configurações:', configError.message);
        results.push({ step: 'Configurações Sistema', status: 'FALHA', error: configError.message });
      } else {
        console.log(`✅ Encontradas ${configs.length} configurações`);
        
        // Verificar configurações específicas do DRE
        const dreConfigs = configs.filter(config => 
          config.chave && (config.chave.includes('DRE') || config.chave.includes('HITSS'))
        );
        
        console.log(`⚙️ Configurações DRE: ${dreConfigs.length}`);
        results.push({ step: 'Configurações Sistema', status: 'SUCESSO', totalConfigs: configs.length, dreConfigs: dreConfigs.length });
      }
    } catch (error) {
      console.error('❌ Erro na verificação de configurações:', error.message);
      results.push({ step: 'Configurações Sistema', status: 'FALHA', error: error.message });
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    results.push({ step: 'Teste Geral', status: 'FALHA', error: error.message });
  }

  // Relatório final
  const endTime = new Date();
  const duration = endTime - startTime;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL DO TESTE DRE');
  console.log('='.repeat(60));
  console.log(`⏱️ Duração: ${duration}ms`);
  console.log(`📅 Início: ${startTime.toISOString()}`);
  console.log(`📅 Fim: ${endTime.toISOString()}`);
  console.log('');
  
  const successCount = results.filter(r => r.status === 'SUCESSO').length;
  const failureCount = results.filter(r => r.status === 'FALHA').length;
  
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas: ${failureCount}`);
  console.log(`📈 Taxa de sucesso: ${((successCount / results.length) * 100).toFixed(1)}%`);
  console.log('');
  
  console.log('📋 DETALHES POR ETAPA:');
  results.forEach((result, index) => {
    const status = result.status === 'SUCESSO' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.step}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
    if (result.recordCount !== undefined) {
      console.log(`   Registros: ${result.recordCount}`);
    }
    if (result.fileCount !== undefined) {
      console.log(`   Arquivos: ${result.fileCount}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (failureCount === 0) {
    console.log('🎉 TESTE COMPLETO: TODOS OS COMPONENTES FUNCIONANDO!');
  } else {
    console.log('⚠️ TESTE COMPLETO: ALGUNS COMPONENTES PRECISAM DE ATENÇÃO');
  }
  
  return results;
}

// Executar o teste
testCompleteFlow()
  .then(results => {
    console.log('\n🏁 Teste finalizado com sucesso');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erro fatal no teste:', error);
    process.exit(1);
  });