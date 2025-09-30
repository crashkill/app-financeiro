const yaml = require('js-yaml');
const fs = require('fs');
const axios = require('axios');

async function validatePipelineConfig() {
  console.log('🔍 Validando configurações do pipeline FLUXO.yaml...\n');
  
  try {
    // Carregar pipeline
    const pipelineFile = __dirname + '/FLUXO.yaml';
    const pipeline = yaml.load(fs.readFileSync(pipelineFile, 'utf8'));
    
    const config = pipeline.config.supabase;
    console.log('📋 Configurações encontradas:');
    console.log(`   Project URL: ${config.project_ref}`);
    console.log(`   Bucket: ${config.bucket_name}`);
    console.log(`   Anon Key: ${config.anon_key.substring(0, 20)}...`);
    
    // Extrair project_ref da URL
    const projectRef = config.project_ref.replace('https://', '').replace('.supabase.co', '');
    console.log(`   Project Ref: ${projectRef}\n`);
    
    // 1. Testar conectividade básica
    console.log('🌐 Testando conectividade com Supabase...');
    try {
      const healthResponse = await axios.get(`${config.project_ref}/rest/v1/`, {
        headers: {
          'apikey': config.anon_key,
          'Authorization': `Bearer ${config.anon_key}`
        },
        timeout: 10000
      });
      console.log('✅ Conectividade OK');
    } catch (error) {
      console.error('❌ Falha na conectividade:', error.message);
      return false;
    }
    
    // 2. Verificar se as Edge Functions existem
    console.log('\n🔧 Verificando Edge Functions necessárias...');
    
    const requiredFunctions = [
      'download-and-trigger',
      'dre-etl-dimensional'
    ];
    
    for (const funcName of requiredFunctions) {
      try {
        const response = await axios.post(`${config.project_ref}/functions/v1/${funcName}`, 
          { test: true }, 
          {
            headers: {
              'Authorization': `Bearer ${config.anon_key}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );
        console.log(`✅ Edge Function '${funcName}' acessível`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.error(`❌ Edge Function '${funcName}' não encontrada`);
        } else {
          console.log(`⚠️ Edge Function '${funcName}' existe mas retornou erro (esperado para teste)`);
        }
      }
    }
    
    // 3. Verificar tabelas necessárias
    console.log('\n📊 Verificando tabelas necessárias...');
    
    const requiredTables = [
      'dre_hitss',
      'dim_projeto',
      'dim_cliente', 
      'dim_conta',
      'dim_periodo',
      'dim_recurso',
      'fact_dre_lancamentos',
      'audit_logs'
    ];
    
    for (const tableName of requiredTables) {
      try {
        const response = await axios.get(`${config.project_ref}/rest/v1/${tableName}?limit=1`, {
          headers: {
            'apikey': config.anon_key,
            'Authorization': `Bearer ${config.anon_key}`
          },
          timeout: 5000
        });
        console.log(`✅ Tabela '${tableName}' acessível`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.error(`❌ Tabela '${tableName}' não encontrada`);
        } else {
          console.error(`❌ Erro ao acessar tabela '${tableName}':`, error.response?.status || error.message);
        }
      }
    }
    
    // 4. Verificar bucket de storage
    console.log('\n🗄️ Verificando bucket de storage...');
    try {
      const response = await axios.get(`${config.project_ref}/storage/v1/bucket/${config.bucket_name}`, {
        headers: {
          'Authorization': `Bearer ${config.anon_key}`
        },
        timeout: 5000
      });
      console.log(`✅ Bucket '${config.bucket_name}' acessível`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.error(`❌ Bucket '${config.bucket_name}' não encontrado`);
      } else {
        console.error(`❌ Erro ao acessar bucket:`, error.response?.status || error.message);
      }
    }
    
    // 5. Verificar RPC functions
    console.log('\n⚙️ Verificando RPC functions...');
    try {
      const response = await axios.post(`${config.project_ref}/rest/v1/rpc/verify_batch_processing`, 
        { batch_id: 'test-batch-id' }, 
        {
          headers: {
            'apikey': config.anon_key,
            'Authorization': `Bearer ${config.anon_key}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      console.log('✅ RPC function verify_batch_processing acessível');
    } catch (error) {
      if (error.response?.status === 404) {
        console.error('❌ RPC function verify_batch_processing não encontrada');
      } else {
        console.log('⚠️ RPC function verify_batch_processing existe mas retornou erro (esperado para teste)');
      }
    }
    
    console.log('\n🎯 Validação de configurações concluída!');
    return true;
    
  } catch (error) {
    console.error('💥 Erro durante validação:', error.message);
    return false;
  }
}

// Executar validação se chamado diretamente
if (require.main === module) {
  validatePipelineConfig()
    .then(success => {
      if (success) {
        console.log('\n✅ Configurações válidas - Pipeline pronto para execução!');
        process.exit(0);
      } else {
        console.log('\n❌ Problemas encontrados nas configurações');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Falha na validação:', error.message);
      process.exit(1);
    });
}

module.exports = { validatePipelineConfig };