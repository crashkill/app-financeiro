import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import https from 'https';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGliaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class EdgeFunctionTester {
  constructor() {
    this.testId = `test_edge_${Date.now()}`;
    this.startTime = new Date();
  }

  async log(step, status, message = '') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${step}: ${status} - ${message}`);
  }

  async testSimulatedFunction() {
    console.log('\n🧪 TESTE DA EDGE FUNCTION SIMULADA');
    console.log('='.repeat(50));

    try {
      // URL da Edge Function simulada
      const functionUrl = `${supabaseUrl}/functions/v1/download-hitss-simulated`;

      console.log(`🚀 Testando função: ${functionUrl}`);

      const headers = {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      };

      const startTime = Date.now();

      await this.log('EDGE_TEST', 'INICIADO', 'Testando Edge Function simulada');

      // Fazer a chamada para a Edge Function
      const response = await axios.post(functionUrl, {}, {
        headers,
        timeout: 30000, // 30 segundos timeout
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      });

      const duration = (Date.now() - startTime) / 1000;

      console.log(`✅ Chamada concluída em ${duration.toFixed(2)}s`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));

      // Verificar se dados foram inseridos na tabela
      const { data: insertedData, error: queryError } = await supabase
        .from('dre_hitss')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (queryError) {
        console.log(`⚠️ Erro ao verificar dados: ${queryError.message}`);
      } else {
        console.log(`✅ Dados verificados: ${insertedData.length} registros encontrados`);
        if (insertedData.length > 0) {
          console.log('📋 Últimos registros:', insertedData.map(r => ({
            id: r.id,
            empresa: r.empresa,
            periodo: r.periodo,
            created_at: r.created_at
          })));
        }
      }

      await this.log('EDGE_TEST', 'SUCESSO', `Função simulada executada com sucesso em ${duration.toFixed(2)}s`);

      return {
        success: true,
        duration,
        response: response.data,
        recordsInserted: insertedData?.length || 0
      };

    } catch (error) {
      console.log(`❌ Erro na chamada: ${error.message}`);

      if (error.response) {
        console.log(`📊 Status: ${error.response.status}`);
        console.log(`📋 Response:`, error.response.data);
      }

      await this.log('EDGE_TEST', 'ERRO', error.message);
      return {
        success: false,
        error: error.message,
        duration: (Date.now() - this.startTime) / 1000
      };
    }
  }

  async testRealFunction() {
    console.log('\n🧪 TESTE DA EDGE FUNCTION REAL');
    console.log('='.repeat(50));

    try {
      // Primeiro, verificar se temos a URL no Vault
      const { data: vaultData, error: vaultError } = await supabase.rpc('get_secret', {
        secret_name: 'HITSS_DOWNLOAD_URL'
      });

      if (vaultError || !vaultData) {
        console.log('⚠️ URL não configurada no Vault - pulando teste da função real');
        console.log('💡 Configure HITSS_DOWNLOAD_URL no Supabase Dashboard > Settings > Vault');
        return { success: false, message: 'Vault não configurado' };
      }

      const functionUrl = `${supabaseUrl}/functions/v1/download-hitss-edge`;

      console.log(`🚀 Testando função real: ${functionUrl}`);

      const headers = {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      };

      const startTime = Date.now();

      await this.log('EDGE_TEST_REAL', 'INICIADO', 'Testando Edge Function real');

      const response = await axios.post(functionUrl, {}, {
        headers,
        timeout: 60000, // 60 segundos timeout
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      });

      const duration = (Date.now() - startTime) / 1000;

      console.log(`✅ Chamada concluída em ${duration.toFixed(2)}s`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));

      await this.log('EDGE_TEST_REAL', 'SUCESSO', `Função real executada com sucesso em ${duration.toFixed(2)}s`);

      return {
        success: true,
        duration,
        response: response.data
      };

    } catch (error) {
      console.log(`❌ Erro na chamada: ${error.message}`);

      if (error.response) {
        console.log(`📊 Status: ${error.response.status}`);
        console.log(`📋 Response:`, error.response.data);
      }

      await this.log('EDGE_TEST_REAL', 'ERRO', error.message);
      return {
        success: false,
        error: error.message,
        duration: (Date.now() - this.startTime) / 1000
      };
    }
  }

  async runAllTests() {
    console.log('🧪 TESTE DAS EDGE FUNCTIONS');
    console.log('='.repeat(70));
    console.log(`🆔 ID do Teste: ${this.testId}`);
    console.log(`📅 Data/Hora: ${this.startTime.toLocaleString('pt-BR')}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);
    console.log('='.repeat(70));

    const results = {
      simulated: await this.testSimulatedFunction(),
      real: await this.testRealFunction()
    };

    const endTime = new Date();
    const totalDuration = (endTime - this.startTime) / 1000;

    console.log('\n📊 RESULTADO FINAL DOS TESTES');
    console.log('='.repeat(70));
    console.log(`⏱️ Duração Total: ${totalDuration.toFixed(2)}s`);
    console.log(`✅ Simulada: ${results.simulated.success ? 'SUCESSO' : 'FALHA'}`);
    console.log(`✅ Real: ${results.real.success ? 'SUCESSO' : results.real.message || 'FALHA'}`);

    if (results.simulated.success) {
      console.log(`📈 Performance Simulada: ${results.simulated.duration.toFixed(2)}s`);
      console.log(`📊 Registros Inseridos: ${results.simulated.recordsInserted}`);
    }

    if (results.real.success) {
      console.log(`📈 Performance Real: ${results.real.duration.toFixed(2)}s`);
    }

    console.log('='.repeat(70));

    return {
      testId: this.testId,
      success: results.simulated.success || results.real.success,
      results,
      totalDuration
    };
  }
}

async function main() {
  try {
    const tester = new EdgeFunctionTester();
    const result = await tester.runAllTests();

    console.log(`\n✅ Testes concluídos com status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('💥 Erro crítico nos testes:', error);
    process.exit(1);
  }
}

main();
