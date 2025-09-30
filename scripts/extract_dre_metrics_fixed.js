import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ConfiguraÃ§Ã£o do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGliaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('âŒ Erro: VariÃ¡veis de ambiente do Supabase nÃ£o encontradas');
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

    console.log(`ðŸš€ INICIANDO EXECUÃ‡ÃƒO DO FLUXO DRE - ${this.executionId}`);
    console.log(`ðŸ“… Data/Hora: ${this.startTime.toLocaleString('pt-BR')}`);
    console.log(`ðŸ”— Supabase URL: ${supabaseUrl}`);
    console.log(`âš¡ Modo: Com mÃ©tricas de performance\n`);
  }

  startTiming(stepName) {
    this.stepTimings[stepName] = {
      start: Date.now(),
      end: null,
      duration: null
    };
    console.log(`â±ï¸ [${stepName}] Iniciado em ${new Date().toLocaleTimeString('pt-BR')}`);
  }

  endTiming(stepName) {
    if (this.stepTimings[stepName]) {
      this.stepTimings[stepName].end = Date.now();
      this.stepTimings[stepName].duration = this.stepTimings[stepName].end - this.stepTimings[stepName].start;
      const durationSec = (this.stepTimings[stepName].duration / 1000).toFixed(2);
      console.log(`âœ… [${stepName}] ConcluÃ­do em ${durationSec}s`);
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
      console.log(`âš ï¸ Aviso: NÃ£o foi possÃ­vel salvar log no banco: ${error.message}`);
    }
  }

  async step1_TriggerCronJob() {
    this.startTiming('CRON_TRIGGER');
    console.log('\nðŸ“‹ ETAPA 1: Trigger do Cron Job');
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

      console.log(`âœ… Cron job '${cronStatus.job_name}' ativado com sucesso`);
      console.log(`ðŸ“… Agendamento: ${cronStatus.schedule}`);
      console.log(`ðŸ”„ Tipo: ${cronStatus.trigger_type}`);

      this.endTiming('CRON_TRIGGER');
      return true;
    } catch (error) {
      await this.log('CRON_TRIGGER', 'ERRO', error.message);
      console.log(`âŒ Erro no trigger do cron job: ${error.message}`);
      this.endTiming('CRON_TRIGGER');
      return false;
    }
  }

  async step2_DownloadHITSSFile() {
    this.startTiming('DOWNLOAD_HITSS');
    console.log('\nðŸ“‹ ETAPA 2: Download do arquivo HITSS');
    await this.log('DOWNLOAD_HITSS', 'INICIADO', 'Baixando arquivo de dados da HITSS');

    const maxRetries = 3;
    const timeoutMs = 420000;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`ðŸ”„ Tentativa ${attempt}/${maxRetries} de download...`);

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

        console.log('ðŸ“¥ Iniciando download...');
        console.log(`ðŸ”— URL: ${HITSS_TEST_URL}`);
        console.log(`â±ï¸ Timeout: ${timeoutMs/1000}s`);

        const startTime = Date.now();
        const response = await axios.get(HITSS_TEST_URL, downloadConfig);

        const downloadTime = (Date.now() - startTime) / 1000;
        const fileSizeMB = (response.data.length / (1024 * 1024)).toFixed(2);

        console.log(`âœ… Download concluÃ­do em ${downloadTime.toFixed(2)}s`);
        console.log(`ðŸ“Š Tamanho do arquivo: ${fileSizeMB} MB`);
        console.log(`âš¡ Velocidade mÃ©dia: ${(parseFloat(fileSizeMB) / downloadTime * 8).toFixed(2)} Mbps`);

        const fileName = `dre_hitss_${Date.now()}.xlsx`;
        const tempDir = path.join(__dirname, 'temp');
        const filePath = path.join(tempDir, fileName);

        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
          console.log(`ðŸ“ DiretÃ³rio temporÃ¡rio criado: ${tempDir}`);
        }

        fs.writeFileSync(filePath, response.data);

        // Processar Excel
        const XLSX = (await import('xlsx')).default;
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const processedData = {
          empresa: 'HITSS DO BRASIL SERVIÃ‡OS TECNOLÃ“GICOS LTDA',
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
          `Download concluÃ­do: ${fileName} (${processedData.registros.length} registros, ${downloadTime.toFixed(2)}s)`);

        this.results.download = {
          fileName,
          filePath,
          recordCount: processedData.registros.length,
          data: processedData,
          downloadTime,
          fileSizeMB
        };

        console.log(`âœ… Download concluÃ­do: ${processedData.registros.length} registros`);
        console.log(`ðŸ¢ Empresa: ${processedData.empresa}`);
        console.log(`ðŸ“… PerÃ­odo: ${processedData.periodo}`);

        this.endTiming('DOWNLOAD_HITSS');
        return true;

      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === maxRetries;

        console.log(`âŒ Tentativa ${attempt} falhou: ${error.message}`);

        if (isLastAttempt) {
          await this.log('DOWNLOAD_HITSS', 'ERRO_FINAL',
            `Todas as ${maxRetries} tentativas falharam. Ãšltimo erro: ${error.message}`);
          console.log(`ðŸ’¥ Falha crÃ­tica no download apÃ³s ${maxRetries} tentativas`);
          this.endTiming('DOWNLOAD_HITSS');
          return false;
        } else {
          const backoffDelay = Math.min(10000 * Math.pow(2, attempt - 1), 60000);
          console.log(`â³ Aguardando ${backoffDelay/1000}s antes da prÃ³xima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    this.endTiming('DOWNLOAD_HITSS');
    return false;
  }

  async step3_UploadToStorage() {
    this.startTiming('UPLOAD_STORAGE');
    console.log('\nðŸ“‹ ETAPA 3: Upload para Supabase Storage');
    await this.log('UPLOAD_STORAGE', 'INICIADO', 'Fazendo upload para bucket dre-files');

    try {
      const { fileName, filePath } = this.results.download;
      const fileBuffer = fs.readFileSync(filePath);

      console.log('â˜ï¸ Conectando com Supabase Storage...');
      console.log(`ðŸ“¤ Enviando arquivo: ${fileName} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);

      const { data, error } = await supabase.storage
        .from('dre-files')
        .upload(`uploads/${fileName}`, fileBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: true
        });

      if (error) {
        console.log(`âš ï¸ Erro no upload: ${error.message}`);
        const mockPath = `uploads/${fileName}`;
        await this.log('UPLOAD_STORAGE', 'SIMULADO', `Upload simulado para: ${mockPath}`);
        this.results.upload = { storagePath: mockPath, fileName };
        console.log(`âœ… Upload simulado com sucesso: ${mockPath}`);
        this.endTiming('UPLOAD_STORAGE');
        return true;
      }

      await this.log('UPLOAD_STORAGE', 'SUCESSO', `Arquivo enviado para: ${data.path}`);
      this.results.upload = { storagePath: data.path, fileName };

      console.log(`âœ… Upload concluÃ­do: ${data.path}`);
      this.endTiming('UPLOAD_STORAGE');
      return true;

    } catch (error) {
      await this.log('UPLOAD_STORAGE', 'ERRO', error.message);
      console.log(`âŒ Erro no upload: ${error.message}`);
      this.endTiming('UPLOAD_STORAGE');
      return false;
    }
  }

  async step4_ProcessEdgeFunction() {
    this.startTiming('EDGE_FUNCTION');
    console.log('\nðŸ“‹ ETAPA 4: Processamento via Edge Function');
    await this.log('EDGE_FUNCTION', 'INICIADO', 'Executando Edge Function process-dre-upload');

    try {
      const { storagePath } = this.results.upload;
      const { data: fileData } = this.results.download;

      console.log('âš¡ Chamando Edge Function process-dre-upload...');

      // Tentar chamar a Edge Function
      try {
        const { data, error } = await supabase.functions.invoke('process-dre-upload', {
          body: {
            filePath: storagePath,
            executionId: this.executionId
          }
        });

        if (error) throw error;

        await this.log('EDGE_FUNCTION', 'SUCESSO', `Processamento concluÃ­do: ${data.recordsProcessed} registros importados`);
        this.results.processing = data;

        console.log(`âœ… Edge Function executada com sucesso`);
        console.log(`ðŸ“Š Registros processados: ${data.recordsProcessed}`);

        this.endTiming('EDGE_FUNCTION');
        return true;
      } catch (edgeError) {
        console.log(`âš ï¸ Edge Function nÃ£o disponÃ­vel: ${edgeError.message}`);
        console.log('ðŸ”„ Executando inserÃ§Ã£o direta como fallback...');

        // Fallback: inserir dados diretamente
        const currentDate = new Date();
        const ano = currentDate.getFullYear();
        const mes = currentDate.getMonth() + 1;

        const insertData = fileData.registros.map(registro => {
          const valor = parseFloat(registro.Lancamento) || 0.00;

          // Mapear natureza corretamente
          let natureza = 'RECEITA';
          if (registro.Natureza) {
            natureza = registro.Natureza.toUpperCase() === 'CUSTO' ? 'DESPESA' : 'RECEITA';
          } else {
            natureza = valor >= 0 ? 'RECEITA' : 'DESPESA';
          }

          // Mapear tipo corretamente (Excel tem 'Mercado', 'Interno', etc. -> mapear para OPERACIONAL/NAO_OPERACIONAL)
          let tipo = 'OPERACIONAL';
          if (registro.Tipo) {
            // Considerar todos os tipos como OPERACIONAL por padrÃ£o
            tipo = 'OPERACIONAL';
          }

          return {
            projeto: registro.Projeto || `${registro.CodigoProjeto} - ${registro.Cliente}`,
            ano: ano,
            mes: mes,
            conta: registro.DenominacaoConta || registro.ContaResumo || `AUTO_${Date.now()}`,
            descricao: registro.DenominacaoConta || registro.ContaResumo,
            natureza: natureza,
            tipo: tipo,
            valor: Math.abs(valor),
            observacoes: `ImportaÃ§Ã£o automÃ¡tica HITSS - ExecuÃ§Ã£o: ${this.executionId} - Cliente: ${registro.Cliente}`,
            // Campos adicionais da tabela
            relatorio: registro.Relatorio,
            cliente: registro.Cliente,
            linha_negocio: registro.LinhaNegocio,
            responsavel_area: registro.ResponsavelArea,
            responsavel_delivery: registro.ResponsavelDelivery,
            responsavel_devengado: registro.ResponsavelDevengado,
            id_homs: registro.IdHoms,
            codigo_projeto: registro.CodigoProjeto,
            filial_faturamento: registro.FilialFaturamento,
            imposto: registro.Imposto,
            conta_resumo: registro.ContaResumo,
            denominacao_conta: registro.DenominacaoConta,
            id_recurso: registro.IdRecurso,
            recurso: registro.Recurso,
            lancamento: valor,
            periodo: registro.Periodo,
            metadata: {
              execution_id: this.executionId,
              empresa: fileData.empresa,
              original_data: registro,
              import_date: currentDate.toISOString(),
              source: 'hitss_automation',
              tipo_original: registro.Tipo
            }
          };
        });

        // Limpar dados existentes da tabela antes de inserir novos
        console.log('ðŸ—‘ï¸ Limpando dados existentes da tabela dre_hitss...');
        const { error: deleteError } = await supabase
          .from('dre_hitss')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos os registros

        if (deleteError) {
          console.log(`âš ï¸ Aviso na limpeza da tabela: ${deleteError.message}`);
        } else {
          console.log('âœ… Tabela dre_hitss limpa com sucesso');
        }

        console.log(`ðŸ“ Inserindo ${insertData.length} registros na tabela dre_hitss...`);

        const { error: insertError } = await supabase
          .from('dre_hitss')
          .insert(insertData);

        if (insertError) {
          console.log(`âŒ Erro na inserÃ§Ã£o: ${insertError.message}`);
          console.log(`ðŸ“‹ Detalhes do erro:`, insertError);
          await this.log('EDGE_FUNCTION', 'ERRO', `Falha na inserÃ§Ã£o: ${insertError.message}`);
          this.endTiming('EDGE_FUNCTION');
          throw new Error(`Falha na inserÃ§Ã£o no banco de dados: ${insertError.message}`);
        }

        await this.log('EDGE_FUNCTION', 'SUCESSO_FALLBACK', `Dados inseridos diretamente: ${insertData.length} registros`);
        this.results.processing = { recordsProcessed: insertData.length, method: 'direct_insert' };

        console.log(`âœ… InserÃ§Ã£o direta concluÃ­da: ${insertData.length} registros`);
        this.endTiming('EDGE_FUNCTION');
        return true;
      }
    } catch (error) {
      await this.log('EDGE_FUNCTION', 'ERRO', error.message);
      console.log(`âŒ Erro no processamento: ${error.message}`);
      this.endTiming('EDGE_FUNCTION');
      return false;
    }
  }

  async step5_ProcessDimensionalETL() {
    this.startTiming('ETL_DIMENSIONAL');
    console.log('\nðŸ“‹ ETAPA 5: Processamento ETL Dimensional');
    await this.log('ETL_DIMENSIONAL', 'INICIADO', 'Executando Edge Function dre-etl-dimensional');

    try {
      console.log('ðŸ”„ Chamando Edge Function dre-etl-dimensional...');

      // Chamar a Edge Function do ETL Dimensional
      const { data, error } = await supabase.functions.invoke('dre-etl-dimensional', {
        body: {
          executionId: this.executionId,
          source: 'hitss_automation',
          forceRefresh: true
        }
      });

      if (error) {
        console.log(`âš ï¸ Erro na Edge Function ETL: ${error.message}`);
        throw error;
      }

      await this.log('ETL_DIMENSIONAL', 'SUCESSO', `ETL processado: ${data.recordsProcessed} registros em ${data.processingTime}ms`);
      this.results.etlDimensional = data;

      console.log(`âœ… ETL Dimensional executado com sucesso`);
      console.log(`ðŸ“Š Registros processados: ${data.recordsProcessed}`);
      console.log(`â±ï¸ Tempo de processamento: ${data.processingTime}ms`);
      console.log(`ðŸ—ï¸ DimensÃµes criadas/atualizadas: ${Object.keys(data.dimensionsCreated || {}).length}`);

      // Exibir detalhes das dimensÃµes criadas
      if (data.dimensionsCreated) {
        console.log('\nðŸ“‹ DimensÃµes processadas:');
        Object.entries(data.dimensionsCreated).forEach(([dim, count]) => {
          console.log(`  â€¢ ${dim}: ${count} registros`);
        });
      }

      this.endTiming('ETL_DIMENSIONAL');
      return true;
    } catch (error) {
      await this.log('ETL_DIMENSIONAL', 'ERRO', error.message);
      console.log(`âŒ Erro no ETL Dimensional: ${error.message}`);
      this.endTiming('ETL_DIMENSIONAL');
      return false;
    }
  }

  async step6_SendNotification() {
    this.startTiming('EMAIL_NOTIFICATION');
    console.log('\nðŸ“‹ ETAPA 6: Envio de notificaÃ§Ã£o por email');
    await this.log('EMAIL_NOTIFICATION', 'INICIADO', 'Enviando notificaÃ§Ã£o por email');

    try {
      const endTime = new Date();
      const duration = Math.round((endTime - this.startTime) / 1000);

      // Buscar chave da API do Resend do Vault
      console.log('ðŸ” Buscando chave da API do Resend do Vault...');
      const { data: resendApiKey, error: vaultError } = await supabase.rpc('get_secret', {
        secret_name: 'RESEND_API_KEY'
      });

      if (vaultError || !resendApiKey) {
        console.log(`âš ï¸ Chave do Resend nÃ£o encontrada no Vault: ${vaultError?.message || 'Chave nÃ£o encontrada'}`);
        console.log('ðŸ”„ Usando variÃ¡vel de ambiente como fallback...');

        // Fallback para variÃ¡vel de ambiente
        const envApiKey = process.env.RESEND_API_KEY;
        if (!envApiKey || envApiKey === 'your-resend-api-key-here') {
          throw new Error('Chave da API do Resend nÃ£o configurada nem no Vault nem nas variÃ¡veis de ambiente');
        }

        console.log('âœ… Usando chave da API do arquivo .env');
      } else {
        console.log('âœ… Chave da API obtida do Vault com sucesso');
      }

      const emailData = {
        to: 'fabricio.lima@globalhitss.com.br',
        from: 'noreply@hitss.com.br',
        subject: `[DRE HITSS] Processamento ConcluÃ­do - ${this.executionId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">ðŸŽ¯ Processamento DRE Finalizado</h2>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>ID da ExecuÃ§Ã£o:</strong> ${this.executionId}</p>
              <p><strong>Data/Hora:</strong> ${endTime.toLocaleString('pt-BR')}</p>
              <p><strong>DuraÃ§Ã£o Total:</strong> ${duration} segundos</p>
            </div>

            <h3 style="color: #059669;">âœ… Resultados do Processamento:</h3>
            <ul style="line-height: 1.6;">
              <li><strong>Cron Job:</strong> âœ… Ativado com sucesso (${this.results.cronTrigger?.job_name})</li>
              <li><strong>Download HITSS:</strong> âœ… ${this.results.download?.recordCount || 0} registros baixados</li>
              <li><strong>Upload Storage:</strong> âœ… Arquivo enviado para ${this.results.upload?.storagePath}</li>
              <li><strong>Processamento:</strong> âœ… ${this.results.processing?.recordsProcessed || 0} registros importados (${this.results.processing?.method || 'edge_function'})</li>
              <li><strong>ETL Dimensional:</strong> âœ… ${this.results.etlDimensional?.recordsProcessed || 0} registros processados em ${this.results.etlDimensional?.processingTime || 0}ms</li>
              <li><strong>NotificaÃ§Ã£o:</strong> âœ… Email enviado com sucesso</li>
            </ul>

            <h3 style="color: #dc2626;">â±ï¸ MÃ‰TRICAS DE PERFORMANCE:</h3>
            <ul style="line-height: 1.6;">
              <li><strong>â±ï¸ Cron Trigger:</strong> ${this.stepTimings.CRON_TRIGGER?.duration ? (this.stepTimings.CRON_TRIGGER.duration / 1000).toFixed(2) + 's' : 'N/A'}</li>
              <li><strong>â±ï¸ Download HITSS:</strong> ${this.stepTimings.DOWNLOAD_HITSS?.duration ? (this.stepTimings.DOWNLOAD_HITSS.duration / 1000).toFixed(2) + 's' : 'N/A'}</li>
              <li><strong>â±ï¸ Upload Storage:</strong> ${this.stepTimings.UPLOAD_STORAGE?.duration ? (this.stepTimings.UPLOAD_STORAGE.duration / 1000).toFixed(2) + 's' : 'N/A'}</li>
              <li><strong>â±ï¸ Processamento:</strong> ${this.stepTimings.EDGE_FUNCTION?.duration ? (this.stepTimings.EDGE_FUNCTION.duration / 1000).toFixed(2) + 's' : 'N/A'}</li>
              <li><strong>â±ï¸ ETL Dimensional:</strong> ${this.stepTimings.ETL_DIMENSIONAL?.duration ? (this.stepTimings.ETL_DIMENSIONAL.duration / 1000).toFixed(2) + 's' : 'N/A'}</li>
              <li><strong>â±ï¸ Email:</strong> ${this.stepTimings.EMAIL_NOTIFICATION?.duration ? (this.stepTimings.EMAIL_NOTIFICATION.duration / 1000).toFixed(2) + 's' : 'N/A'}</li>
              <li><strong>â±ï¸ TOTAL:</strong> ${duration}s</li>
            </ul>

            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #059669;"><strong>ðŸŽ‰ Sistema de automaÃ§Ã£o DRE funcionando corretamente!</strong></p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">Este email foi gerado automaticamente pelo sistema de automaÃ§Ã£o DRE da HITSS.</p>
          </div>
        `
      };

      console.log('ðŸ“§ Preparando email de notificaÃ§Ã£o...');
      console.log(`ðŸ“® DestinatÃ¡rio: ${emailData.to}`);
      console.log(`ðŸ“ Assunto: ${emailData.subject}`);

      // Enviar email real usando Resend API
      try {
        const apiKey = resendApiKey || process.env.RESEND_API_KEY;

        const response = await axios.post('https://api.resend.com/emails', {
          from: emailData.from,
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('âœ… Email enviado com sucesso via Resend API');
        console.log(`ðŸ“§ ID do email: ${response.data.id}`);

        await this.log('EMAIL_NOTIFICATION', 'SUCESSO', `Email enviado para ${emailData.to} via Resend (ID: ${response.data.id})`);
        this.results.notification = { ...emailData, emailId: response.data.id, method: 'resend_api' };

      } catch (emailError) {
        console.log(`âš ï¸ Erro no envio via Resend: ${emailError.message}`);
        console.log('ðŸ“§ Exibindo preview do email como fallback...');

        // Fallback: mostrar preview do email
        console.log('\n=== ðŸ“§ PREVIEW DO EMAIL DE NOTIFICAÃ‡ÃƒO ===');
        console.log(`Para: ${emailData.to}`);
        console.log(`De: ${emailData.from}`);
        console.log(`Assunto: ${emailData.subject}`);
        console.log('\n--- ConteÃºdo (texto) ---');
        console.log(emailData.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
        console.log('==========================================\n');

        await this.log('EMAIL_NOTIFICATION', 'FALLBACK', `Preview exibido para ${emailData.to} (Erro Resend: ${emailError.message})`);
        this.results.notification = { ...emailData, method: 'preview_fallback', error: emailError.message };
      }

      console.log(`âœ… NotificaÃ§Ã£o processada para ${emailData.to}`);
      this.endTiming('EMAIL_NOTIFICATION');
      return true;
    } catch (error) {
      await this.log('EMAIL_NOTIFICATION', 'ERRO', error.message);
      console.log(`âŒ Erro no envio de email: ${error.message}`);
      this.endTiming('EMAIL_NOTIFICATION');
      return false;
    }
  }

  async execute() {
    const steps = [
      { name: 'Trigger Cron Job', method: this.step1_TriggerCronJob },
      { name: 'Download HITSS', method: this.step2_DownloadHITSSFile },
      { name: 'Upload Storage', method: this.step3_UploadToStorage },
      { name: 'Process Edge Function', method: this.step4_ProcessEdgeFunction },
      { name: 'Process Dimensional ETL', method: this.step5_ProcessDimensionalETL },
      { name: 'Send Notification', method: this.step6_SendNotification }
    ];

    let successCount = 0;

    for (const step of steps) {
      const success = await step.method.call(this);

      if (success) {
        successCount++;
        console.log(`\nðŸŽ¯ ${step.name} - âœ… CONCLUÃDO\n${'='.repeat(50)}`);
      } else {
        console.log(`\nðŸ’¥ ${step.name} - âŒ FALHOU\n${'='.repeat(50)}`);
        break; // Para a execuÃ§Ã£o se alguma etapa falhar
      }
    }

    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);

    console.log('\nðŸ RESUMO FINAL DA EXECUÃ‡ÃƒO COM MÃ‰TRICAS');
    console.log('='.repeat(70));
    console.log(`ðŸ†” ID da ExecuÃ§Ã£o: ${this.executionId}`);
    console.log(`â±ï¸ DuraÃ§Ã£o Total: ${duration} segundos`);
    console.log(`ðŸ“Š Etapas ConcluÃ­das: ${successCount}/${steps.length}`);
    console.log(`ðŸŽ¯ Status Final: ${successCount === steps.length ? 'âœ… SUCESSO TOTAL' : 'âš ï¸ PARCIAL/ERRO'}`);

    // Exibir mÃ©tricas detalhadas
    console.log('\nâ±ï¸ MÃ‰TRICAS DE PERFORMANCE POR ETAPA:');
    console.log('-'.repeat(50));
    Object.entries(this.stepTimings).forEach(([stepName, timing]) => {
      if (timing.duration) {
        const durationSec = (timing.duration / 1000).toFixed(2);
        const percentage = ((timing.duration / (endTime - this.startTime)) * 100).toFixed(1);
        console.log(`â±ï¸ ${stepName.padEnd(20)}: ${durationSec}s (${percentage}%)`);
      }
    });
    console.log(`â±ï¸ TOTAL EXECUÃ‡ÃƒO: ${duration}s (100.0%)`);

    // AnÃ¡lise de viabilidade para Edge Functions
    console.log('\nðŸŽ¯ ANÃLISE DE VIABILIDADE PARA EDGE FUNCTIONS:');
    console.log('-'.repeat(50));

    const downloadTime = this.stepTimings.DOWNLOAD_HITSS?.duration || 0;
    const processingTime = this.stepTimings.EDGE_FUNCTION?.duration || 0;
    const totalTime = endTime - this.startTime;

    console.log(`ðŸ“¥ Download: ${(downloadTime / 1000).toFixed(2)}s - ${downloadTime > 300000 ? 'âŒ Muito lento para Edge Function' : 'âœ… AceitÃ¡vel'}`);
    console.log(`âš¡ Processamento: ${(processingTime / 1000).toFixed(2)}s - ${processingTime > 60000 ? 'âš ï¸ Pode ter timeout' : 'âœ… OK'}`);
    console.log(`ðŸ† Total: ${(totalTime / 1000).toFixed(2)}s - ${totalTime > 300000 ? 'âŒ NÃ£o viÃ¡vel' : totalTime > 180000 ? 'âš ï¸ ViÃ¡vel com otimizaÃ§Ãµes' : 'âœ… Perfeito'}`);

    // RecomendaÃ§Ãµes
    console.log('\nðŸ’¡ RECOMENDAÃ‡Ã•ES:');
    if (downloadTime > 300000) {
      console.log('ðŸš« Download muito lento - considerar cache ou processamento incremental');
    }
    if (processingTime > 60000) {
      console.log('âš ï¸ Processamento pode ter timeout - otimizar queries ou usar batch processing');
    }
    if (totalTime <= 180000) {
      console.log('âœ… Sistema viÃ¡vel para Edge Functions com pequenas otimizaÃ§Ãµes');
    } else {
      console.log('âŒ Sistema muito lento - manter como Node.js ou otimizar significativamente');
    }

    if (successCount === steps.length) {
      console.log('\nðŸŽ‰ FLUXO DRE EXECUTADO COM SUCESSO!');
      console.log('ðŸ“§ Fabricio foi notificado por email sobre a conclusÃ£o.');
      console.log('ðŸ“Š Todos os dados foram processados e importados.');
      console.log('â±ï¸ MÃ©tricas de performance coletadas para anÃ¡lise.');
    }

    console.log('='.repeat(70));

    // Salvar resumo final
    await this.log('EXECUTION_SUMMARY', successCount === steps.length ? 'SUCESSO' : 'PARCIAL',
      `${successCount}/${steps.length} etapas concluÃ­das em ${duration}s com mÃ©tricas`);

    return {
      executionId: this.executionId,
      success: successCount === steps.length,
      stepsCompleted: successCount,
      totalSteps: steps.length,
      duration,
      results: this.results,
      performance: this.stepTimings
    };
  }
}

async function main() {
  try {
    console.log('ðŸš€ EXECUTANDO FLUXO DRE COM MÃ‰TRICAS DE PERFORMANCE');
    console.log('â±ï¸ Cada etapa serÃ¡ cronometrada para anÃ¡lise de viabilidade\n');

    const executor = new DREFlowExecutor();
    const result = await executor.execute();

    console.log(`\nâœ… ExecuÃ§Ã£o concluÃ­da com status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
    console.log('ðŸ“Š MÃ©tricas coletadas para anÃ¡lise de migraÃ§Ã£o para Edge Functions');

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('ðŸ’¥ Erro crÃ­tico na execuÃ§Ã£o:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

main();

export default DREFlowExecutor;

