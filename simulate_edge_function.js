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

class EdgeFunctionSimulator {
  constructor() {
    this.executionId = `sim_edge_${Date.now()}`;
    console.log(`🧪 SIMULAÇÃO DA EDGE FUNCTION - ${this.executionId}`);
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}\n`);
  }

  async log(step, status, message = '') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${step}: ${status} - ${message}`);
  }

  async simulateEdgeFunction() {
    console.log('🚀 SIMULANDO EDGE FUNCTION: download-hitss-edge');
    await this.log('EDGE_SIM', 'INICIADO', 'Simulando Edge Function de download');

    try {
      console.log('⚡ Executando lógica da Edge Function...');

      const startTime = Date.now();

      // Buscar URL de download do Vault
      console.log('🔐 Buscando URL de download do Vault...');
      const { data: downloadUrl, error: vaultError } = await supabase.rpc('get_secret', {
        secret_name: 'HITSS_DOWNLOAD_URL'
      });

      if (vaultError || !downloadUrl) {
        throw new Error(`Erro ao buscar URL do Vault: ${vaultError?.message || 'URL não encontrada'}`);
      }

      console.log('✅ URL obtida do Vault com sucesso');
      console.log(`🔗 URL de download: ${downloadUrl}`);

      // Fazer download do arquivo Excel
      console.log('📥 Iniciando download do arquivo HITSS...');

      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 420000, // 7 minutos de timeout
        headers: {
          'User-Agent': 'DRE-Automation-Edge/1.0',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
          keepAlive: true,
          timeout: 420000,
          maxSockets: 1,
          keepAliveMsecs: 30000,
          maxFreeSockets: 1,
          scheduling: 'lifo'
        })
      });

      const downloadTime = (Date.now() - startTime) / 1000;
      const fileSizeMB = (response.data.length / (1024 * 1024)).toFixed(2);

      console.log(`✅ Download concluído em ${downloadTime.toFixed(2)}s`);
      console.log(`📊 Tamanho do arquivo: ${fileSizeMB} MB`);
      console.log(`⚡ Velocidade média: ${(parseFloat(fileSizeMB) / downloadTime * 8).toFixed(2)} Mbps`);

      // Gerar nome do arquivo
      const fileName = `dre_hitss_${Date.now()}.xlsx`;
      const tempDir = path.join(__dirname, 'temp');
      const filePath = path.join(tempDir, fileName);

      // Criar diretório temp se não existir
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log(`📁 Diretório temporário criado: ${tempDir}`);
      }

      // Salvar arquivo Excel
      console.log(`💾 Salvando arquivo: ${filePath}`);
      fs.writeFileSync(filePath, response.data);

      // Upload para Supabase Storage
      console.log('☁️ Fazendo upload para Supabase Storage...');

      const fileBuffer = fs.readFileSync(filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dre-files')
        .upload(`uploads/${fileName}`, fileBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: true
        });

      if (uploadError) {
        console.log(`⚠️ Erro no upload: ${uploadError.message}`);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      console.log(`✅ Upload concluído: ${uploadData.path}`);

      // Processar arquivo Excel para extrair dados
      console.log('📋 Processando arquivo Excel...');

      // Importar XLSX dinamicamente
      const XLSX = (await import('xlsx')).default;

      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log(`📊 Registros extraídos: ${jsonData.length}`);

      // Limpar arquivo temporário
      fs.unlinkSync(filePath);

      const totalTime = (Date.now() - startTime) / 1000;

      console.log(`✅ Simulação concluída em ${totalTime.toFixed(2)}s`);
      console.log(`📁 Arquivo: ${fileName} (${fileSizeMB} MB)`);
      console.log(`☁️ Storage: ${uploadData.path}`);
      console.log(`📊 Registros: ${jsonData.length}`);

      // Verificar se o arquivo foi realmente enviado para o Storage
      console.log('\n🔍 VERIFICANDO ARQUIVO NO STORAGE...');

      const { data: files, error: listError } = await supabase.storage
        .from('dre-files')
        .list('uploads', {
          search: fileName
        });

      if (listError) {
        console.log(`⚠️ Erro ao verificar Storage: ${listError.message}`);
      } else {
        const foundFile = files?.find(file => file.name === fileName);
        if (foundFile) {
          console.log(`✅ Arquivo encontrado no Storage:`);
          console.log(`  • Nome: ${foundFile.name}`);
          console.log(`  • Tamanho: ${(foundFile.metadata?.size / (1024 * 1024)).toFixed(2)} MB`);
          console.log(`  • Atualizado: ${new Date(foundFile.updated_at).toLocaleString('pt-BR')}`);
          console.log(`  • URL: ${supabaseUrl}/storage/v1/object/public/dre-files/${uploadData.path}`);
        } else {
          console.log(`❌ Arquivo não encontrado no Storage`);
        }
      }

      console.log('\n📋 ANÁLISE DE VIABILIDADE PARA EDGE FUNCTIONS:');
      console.log('-'.repeat(50));

      console.log(`📥 Download: ${downloadTime.toFixed(2)}s - ${downloadTime > 300 ? '❌ Muito lento para Edge Function' : '✅ Aceitável'}`);
      console.log(`⚡ Processamento: ${totalTime.toFixed(2)}s - ${totalTime > 60 ? '⚠️ Pode ter timeout' : '✅ OK'}`);
      console.log(`🏆 Total: ${totalTime.toFixed(2)}s - ${totalTime > 300 ? '❌ Não viável' : totalTime > 180 ? '⚠️ Viável com otimizações' : '✅ Perfeito'}`);

      await this.log('EDGE_SIM', 'SUCESSO',
        `Download: ${downloadTime.toFixed(2)}s, Total: ${totalTime.toFixed(2)}s, Arquivo: ${fileName}, Storage: ${uploadData.path}`);

      return {
        success: true,
        executionId: this.executionId,
        downloadTime: downloadTime,
        totalTime: totalTime,
        fileName: fileName,
        fileSize: fileSizeMB,
        recordCount: jsonData.length,
        storagePath: uploadData.path
      };

    } catch (error) {
      console.log(`❌ Erro na simulação: ${error.message}`);
      await this.log('EDGE_SIM', 'ERRO', error.message);
      return { success: false, error: error.message };
    }
  }

  async execute() {
    console.log('🧪 EXECUTANDO SIMULAÇÃO DA EDGE FUNCTION\n');

    const result = await this.simulateEdgeFunction();

    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESULTADO DA SIMULAÇÃO: ${result.success ? '✅ SUCESSO' : '❌ FALHA'}`);
    console.log(`🆔 ID da Execução: ${this.executionId}`);
    console.log(`⏱️ Duração: ${((Date.now() - new Date(this.executionId.split('_')[2]).getTime()) / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));

    return result.success;
  }
}

async function main() {
  try {
    const simulator = new EdgeFunctionSimulator();
    const result = await simulator.execute();

    console.log(`\n${result ? '🎉' : '💥'} Simulação da Edge Function ${result ? 'concluída com sucesso' : 'falhou'}`);
    process.exit(result ? 0 : 1);

  } catch (error) {
    console.error('💥 Erro crítico na simulação:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

main();

export default EdgeFunctionSimulator;
