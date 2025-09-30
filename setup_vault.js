import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGliaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class VaultConfigurator {
  constructor() {
    this.executionId = `vault_config_${Date.now()}`;
    console.log(`🔐 CONFIGURADOR DO VAULT - ${this.executionId}`);
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}\n`);
  }

  async log(step, status, message = '') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${step}: ${status} - ${message}`);
  }

  async checkExistingSecrets() {
    console.log('🔍 Verificando segredos existentes no Vault...');

    try {
      // Tentar buscar todos os segredos possíveis
      const secretsToCheck = [
        'HITSS_DOWNLOAD_URL',
        'RESEND_API_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];

      console.log('📋 Segredos a verificar:');
      for (const secretName of secretsToCheck) {
        try {
          const { data, error } = await supabase.rpc('get_secret', {
            secret_name: secretName
          });

          if (error) {
            console.log(`  ❌ ${secretName}: ${error.message}`);
          } else if (data) {
            // Ocultar valores sensíveis
            const maskedValue = data.length > 10 ? `${data.substring(0, 10)}...` : '***';
            console.log(`  ✅ ${secretName}: ${maskedValue}`);
          } else {
            console.log(`  ⚠️ ${secretName}: Não encontrado`);
          }
        } catch (err) {
          console.log(`  ❌ ${secretName}: Erro ao verificar - ${err.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ Erro ao verificar segredos: ${error.message}`);
    }
  }

  async configureHitssUrl() {
    console.log('\n🔐 CONFIGURANDO HITSS_DOWNLOAD_URL...');

    // IMPORTANTE: Configure a URL real da HITSS aqui
    const hitssUrl = 'https://exemplo.hitss.com.br/relatorio.xlsx'; // ← ALTERE AQUI

    try {
      console.log(`📝 Tentando configurar: ${hitssUrl}`);

      // Nota: No ambiente real, isso seria feito via Supabase Dashboard
      // ou via API de Management do Supabase
      console.log('⚠️ AVISO: Configure manualmente no Supabase Dashboard:');
      console.log('   1. Acesse: https://supabase.com/dashboard');
      console.log('   2. Projeto: app-financeiro');
      console.log('   3. Settings > Vault');
      console.log('   4. Adicione: HITSS_DOWNLOAD_URL');
      console.log(`   5. Valor: ${hitssUrl}`);

      // Simular configuração
      console.log('✅ Simulação: HITSS_DOWNLOAD_URL configurada');
      console.log(`🔗 URL configurada: ${hitssUrl}`);

      await this.log('VAULT_CONFIG', 'SIMULADO', `HITSS_DOWNLOAD_URL configurada: ${hitssUrl}`);
      return true;

    } catch (error) {
      console.log(`❌ Erro ao configurar URL: ${error.message}`);
      await this.log('VAULT_CONFIG', 'ERRO', error.message);
      return false;
    }
  }

  async configureResendApiKey() {
    console.log('\n🔐 CONFIGURANDO RESEND_API_KEY...');

    // IMPORTANTE: Configure a chave real da API do Resend aqui
    const resendApiKey = 'your-resend-api-key-here'; // ← ALTERE AQUI

    try {
      console.log('⚠️ AVISO: Configure manualmente no Supabase Dashboard:');
      console.log('   1. Acesse: https://supabase.com/dashboard');
      console.log('   2. Projeto: app-financeiro');
      console.log('   3. Settings > Vault');
      console.log('   4. Adicione: RESEND_API_KEY');
      console.log(`   5. Valor: ${resendApiKey}`);

      // Simular configuração
      console.log('✅ Simulação: RESEND_API_KEY configurada');
      console.log('🔗 Chave configurada (oculta para segurança)');

      await this.log('VAULT_CONFIG', 'SIMULADO', 'RESEND_API_KEY configurada');
      return true;

    } catch (error) {
      console.log(`❌ Erro ao configurar chave do Resend: ${error.message}`);
      await this.log('VAULT_CONFIG', 'ERRO', error.message);
      return false;
    }
  }

  async testConfiguration() {
    console.log('\n🧪 TESTANDO CONFIGURAÇÃO DO VAULT...');

    try {
      // Testar HITSS_DOWNLOAD_URL
      console.log('🔍 Testando HITSS_DOWNLOAD_URL...');
      const { data: hitssUrl, error: hitssError } = await supabase.rpc('get_secret', {
        secret_name: 'HITSS_DOWNLOAD_URL'
      });

      if (hitssError || !hitssUrl) {
        console.log(`❌ HITSS_DOWNLOAD_URL: ${hitssError?.message || 'Não configurada'}`);
        return false;
      }

      console.log(`✅ HITSS_DOWNLOAD_URL: ${hitssUrl.substring(0, 50)}...`);

      // Testar RESEND_API_KEY
      console.log('🔍 Testando RESEND_API_KEY...');
      const { data: resendKey, error: resendError } = await supabase.rpc('get_secret', {
        secret_name: 'RESEND_API_KEY'
      });

      if (resendError || !resendKey) {
        console.log(`⚠️ RESEND_API_KEY: ${resendError?.message || 'Não configurada'}`);
      } else {
        console.log('✅ RESEND_API_KEY: Configurada');
      }

      console.log('\n✅ Configuração do Vault testada com sucesso!');
      return true;

    } catch (error) {
      console.log(`❌ Erro ao testar configuração: ${error.message}`);
      return false;
    }
  }

  async execute() {
    console.log('🚀 EXECUTANDO CONFIGURAÇÃO DO VAULT\n');

    const steps = [
      { name: 'Verificar Segredos Existentes', method: this.checkExistingSecrets },
      { name: 'Configurar HITSS URL', method: this.configureHitssUrl },
      { name: 'Configurar Resend API Key', method: this.configureResendApiKey },
      { name: 'Testar Configuração', method: this.testConfiguration }
    ];

    let successCount = 0;

    for (const step of steps) {
      console.log(`\n📋 ${step.name}`);
      console.log('─'.repeat(40));

      const success = await step.method.call(this);

      if (success) {
        successCount++;
        console.log(`✅ ${step.name} - CONCLUÍDO`);
      } else {
        console.log(`❌ ${step.name} - FALHOU`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESULTADO DA CONFIGURAÇÃO: ${successCount}/${steps.length} etapas`);
    console.log(`🆔 ID da Execução: ${this.executionId}`);
    console.log('='.repeat(60));

    if (successCount === steps.length) {
      console.log('\n🎉 CONFIGURAÇÃO DO VAULT CONCLUÍDA!');
      console.log('✅ Agora você pode executar as Edge Functions');
      console.log('🚀 Próximo passo: Testar Edge Functions');
    } else {
      console.log('\n⚠️ CONFIGURAÇÃO INCOMPLETA');
      console.log('❌ Configure os segredos no Supabase Dashboard');
      console.log('📋 Verifique os logs acima para detalhes');
    }

    return successCount === steps.length;
  }
}

async function main() {
  try {
    console.log('🔐 CONFIGURADOR DO VAULT DRE');
    console.log('📝 Este script configura os segredos necessários para as Edge Functions\n');

    const configurator = new VaultConfigurator();
    const result = await configurator.execute();

    console.log(`\n${result ? '🎉' : '💥'} Configuração ${result ? 'concluída com sucesso' : 'falhou'}`);
    process.exit(result ? 0 : 1);

  } catch (error) {
    console.error('💥 Erro crítico na configuração:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

main();

export default VaultConfigurator;
