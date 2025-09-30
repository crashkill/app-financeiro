import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGliaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// URL de teste - CONFIGURE AQUI COM A URL REAL DA HITSS
const HITSS_TEST_URL = process.env.HITSS_DOWNLOAD_URL;

class DREFlowExecutor {
  constructor() {
    this.executionId = `exec_${Date.now()}`;
    this.startTime = new Date();
    this.stepTimings = {};
    this.results = {
      cronTrigger: null,
      download: null,
      upload: null,
      processing: null,
      etlDimensional: null,
      notification: null
    };

    console.log(`🚀 INICIANDO EXECUÇÃO DO FLUXO DRE - ${this.executionId}`);
    console.log(`📅 Data/Hora: ${this.startTime.toLocaleString('pt-BR')}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);
    console.log(`⚡ Modo: Com métricas de performance\n`);
  }

  startTiming(stepName) {
    this.stepTimings[stepName] = {
      start: Date.now(),
      end: null,
      duration: null
    };
    console.log(`⏱️ [${stepName}] Iniciado em ${new Date().toLocaleTimeString('pt-BR')}`);
  }

  endTiming(stepName) {
    if (this.stepTimings[stepName]) {
      this.stepTimings[stepName].end = Date.now();
      this.stepTimings[stepName].duration = this.stepTimings[stepName].end - this.stepTimings[stepName].start;
      const durationSec = (this.stepTimings[stepName].duration / 1000).toFixed(2);
      console.log(`✅ [${stepName}] Concluído em ${durationSec}s`);
    }
  }

  async log(step, status, message = '') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      execution_id: this.executionId,
      step,
      status,
      message
    };

    console.log(`[${timestamp}] ${step}: ${status} - ${message}`);

    try {
      await supabase.from('dre_execution_logs').insert(logEntry);
    } catch (error) {
      console.log(`⚠️ Aviso: Não foi possível salvar log no banco: ${error.message}`);
    }
  }

  async step1_TriggerCronJob() {
    this.startTiming('CRON_TRIGGER');
    console.log('\n📋 ETAPA 1: Trigger do Cron Job');
    await this.log('CRON_TRIGGER', 'INICIADO', 'Simulando trigger manual do cron job');

    try {
      const cronStatus = {
        job_name: 'dre-hitss-automation',
        schedule: '0 8 * * 1-5',
        last_run: new Date().toISOString(),
        status: 'TRIGGERED_MANUALLY',
        trigger_type: 'MANUAL'
      };

      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.log('CRON_TRIGGER', 'SUCESSO', `Cron job ativado: ${cronStatus.job_name}`);
      this.results.cronTrigger = cronStatus;

      console.log(`✅ Cron job '${cronStatus.job_name}' ativado com sucesso`);
      console.log(`📅 Agendamento: ${cronStatus.schedule}`);
      console.log(`🔄 Tipo: ${cronStatus.trigger_type}`);

      this.endTiming('CRON_TRIGGER');
      return true;
    } catch (error) {
      await this.log('CRON_TRIGGER', 'ERRO', error.message);
      console.log(`❌ Erro no trigger do cron job: ${error.message}`);
      this.endTiming('CRON_TRIGGER');
      return false;
    }
  }

  async step2_DownloadHITSSFile() {
    this.startTiming('DOWNLOAD_HITSS');
    console.log('\n📋 ETAPA 2: Download do arquivo HITSS');
    await this.log('DOWNLOAD_HITSS', 'INICIADO', 'Baixando arquivo de dados da HITSS');

    const maxRetries = 3;
    const timeoutMs = 420000;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${maxRetries} de download...`);

        const downloadConfig = {
          timeout: timeoutMs,
          maxRedirects: 5,
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'DRE-Automation/1.0',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
            timeout: timeoutMs,
            maxSockets: 1,
            keepAliveMsecs: 30000,
            maxFreeSockets: 1,
            scheduling: 'lifo'
          })
        };

        console.log('📥 Iniciando download...');
        console.log(`🔗 URL: ${HITSS_TEST_URL}`);
        console.log(`⏱️ Timeout: ${timeoutMs/1000}s`);

        const startTime = Date.now();
        const response = await axios.get(HITSS_TEST_URL, downloadConfig);

        const downloadTime = (Date.now() - startTime) / 1000;
        const fileSizeMB = (response.data.length / (1024 * 1024)).toFixed(2);

        console.log(`✅ Download concluído em ${downloadTime.toFixed(2)}s`);
        console.log(`📊 Tamanho do arquivo: ${fileSizeMB} MB`);
        console.log(`⚡ Velocidade média: ${(parseFloat(fileSizeMB) / downloadTime * 8).toFixed(2)} Mbps`);

        const fileName = `dre_hitss_${Date.now()}.xlsx`;
        const tempDir = path.join(__dirname, 'temp');
        const filePath = path.join(tempDir, fileName);

        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
          console.log(`📁 Diretório temporário criado: ${tempDir}`);
        }

        fs.writeFileSync(filePath, response.data);

        // Processar Excel
        const XLSX = (await import('xlsx')).default;
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const processedData = {
          empresa: 'HITSS DO BRASIL SERVIÇOS TECNOLÓGICOS LTDA',
          cnpj: '12.345.678/0001-90',
          periodo: new Date().toISOString().slice(0, 7),
          data_geracao: new Date().toISOString(),
          registros: jsonData.map((row, index) => ({
            Relatorio: row.Relatorio,
            Tipo: row.Tipo,
            Cliente: row.Cliente,
            LinhaNegocio: row.LinhaNegocio,
            ResponsavelArea: row.ResponsavelArea,
            ResponsavelDelivery: row.ResponsavelDelivery,
            ResponsavelDevengado: row.ResponsavelDevengado,
            IdHoms: row.IdHoms,
            CodigoProjeto: row.CodigoProjeto,
            Projeto: row.Projeto,
            FilialFaturamento: row.FilialFaturamento,
            Imposto: row.Imposto,
            ContaResumo: row.ContaResumo,
            DenominacaoConta: row.DenominacaoConta,
            IdRecurso: row.IdRecurso,
            Recurso: row.Recurso,
            Lancamento: row.Lancamento,
            Periodo: row.Periodo,
            Natureza: row.Natureza
          }))
        };

        await this.log('DOWNLOAD_HITSS', 'SUCESSO',
          `Download concluído: ${fileName} (${processedData.registros.length} registros, ${downloadTime.toFixed(2)}s)`);

        this.results.download = {
          fileName,
          filePath,
          recordCount: processedData.registros.length,
          data: processedData,
          downloadTime,
          fileSizeMB
        };

        console.log(`✅ Download concluído: ${processedData.registros.length} registros`);
        console.log(`🏢 Empresa: ${processedData.empresa}`);
        console.log(`📅 Período: ${processedData.periodo}`);

        this.endTiming('DOWNLOAD_HITSS');
        return true;

      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === maxRetries;

        console.log(`❌ Tentativa ${attempt} falhou: ${error.message}`);

        if (isLastAttempt) {
          await this.log('DOWNLOAD_HITSS', 'ERRO_FINAL',
            `Todas as ${maxRetries} tentativas falharam. Último erro: ${error.message}`);
          console.log(`💥 Falha crítica no download após ${maxRetries} tentativas`);
          this.endTiming('DOWNLOAD_HITSS');
          return false;
        } else {
          const backoffDelay = Math.min(10000 * Math.pow(2, attempt - 1), 60000);
          console.log(`⏳ Aguardando ${backoffDelay/1000}s antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    this.endTiming('DOWNLOAD_HITSS');
    return false;
  }

  async execute() {
    console.log('🚀 EXECUTANDO FLUXO DRE COM MÉTRICAS DE PERFORMANCE');
    console.log('⏱️ Cada etapa será cronometrada para análise de viabilidade\n');

    const steps = [
      { name: 'Trigger Cron Job', method: this.step1_TriggerCronJob },
      { name: 'Download HITSS', method: this.step2_DownloadHITSSFile }
    ];

    let successCount = 0;

    for (const step of steps) {
      const success = await step.method.call(this);

      if (success) {
        successCount++;
        console.log(`\n🎯 ${step.name} - ✅ CONCLUÍDO\n$ {'='.repeat(50)}`);
      } else {
        console.log(`\n💥 ${step.name} - ❌ FALHOU\n$ {'='.repeat(50)}`);
        break;
      }
    }

    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);

    console.log('\n🏁 RESUMO FINAL DA EXECUÇÃO COM MÉTRICAS');
    console.log('='.repeat(70));
    console.log(`🆔 ID da Execução: ${this.executionId}`);
    console.log(`⏱️ Duração Total: ${duration} segundos`);
    console.log(`📊 Etapas Concluídas: ${successCount}/${steps.length}`);
    console.log(`🎯 Status Final: ${successCount === steps.length ? '✅ SUCESSO TOTAL' : '⚠️ PARCIAL/ERRO'}`);

    Object.entries(this.stepTimings).forEach(([stepName, timing]) => {
      if (timing.duration) {
        const durationSec = (timing.duration / 1000).toFixed(2);
        const percentage = ((timing.duration / (endTime - this.startTime)) * 100).toFixed(1);
        console.log(`⏱️ ${stepName.padEnd(20)}: ${durationSec}s (${percentage}%)`);
      }
    });

    console.log(`⏱️ TOTAL EXECUÇÃO: ${duration}s (100.0%)`);

    return {
      executionId: this.executionId,
      success: successCount === steps.length,
      stepsCompleted: successCount,
      totalSteps: steps.length,
      duration,
      performance: this.stepTimings
    };
  }
}

async function main() {
  try {
    const executor = new DREFlowExecutor();
    const result = await executor.execute();

    console.log(`\n✅ Execução concluída com status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('💥 Erro crítico na execução:', error);
    process.exit(1);
  }
}

main();

export default DREFlowExecutor;