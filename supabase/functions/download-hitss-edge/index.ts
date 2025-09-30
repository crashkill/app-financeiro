import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import axios from 'https://deno.land/x/axios@0.27.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Edge Function: Download HITSS iniciada');

    // Configuração do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const startTime = Date.now();

    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 420000, // 7 minutos de timeout
      headers: {
        'User-Agent': 'DRE-Automation-Edge/1.0',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

    const downloadTime = (Date.now() - startTime) / 1000;
    const fileSizeMB = (response.data.length / (1024 * 1024)).toFixed(2);

    console.log(`✅ Download concluído em ${downloadTime.toFixed(2)}s`);
    console.log(`📊 Tamanho do arquivo: ${fileSizeMB} MB`);
    console.log(`⚡ Velocidade média: ${(parseFloat(fileSizeMB) / downloadTime * 8).toFixed(2)} Mbps`);

    // Gerar nome do arquivo
    const fileName = `dre_hitss_${Date.now()}.xlsx`;
    const tempDir = '/tmp';
    const filePath = `${tempDir}/${fileName}`;

    // Salvar arquivo temporariamente
    console.log(`💾 Salvando arquivo temporariamente: ${filePath}`);
    await Deno.writeFile(filePath, new Uint8Array(response.data));

    // Upload para Supabase Storage
    console.log('☁️ Fazendo upload para Supabase Storage...');

    const fileBuffer = await Deno.readFile(filePath);

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
    const { default: XLSX } = await import('https://esm.sh/xlsx@0.18.5');

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Registros extraídos: ${jsonData.length}`);

    // Converter dados do Excel para formato DRE
    const processedData = {
      empresa: 'HITSS DO BRASIL SERVIÇOS TECNOLÓGICOS LTDA',
      cnpj: '12.345.678/0001-90',
      periodo: new Date().toISOString().slice(0, 7),
      data_geracao: new Date().toISOString(),
      registros: jsonData.length,
      fileName: fileName,
      fileSize: fileSizeMB,
      downloadTime: downloadTime,
      uploadPath: uploadData.path
    };

    // Limpar arquivo temporário
    await Deno.remove(filePath);

    const totalTime = (Date.now() - startTime) / 1000;

    console.log(`✅ Edge Function concluída em ${totalTime.toFixed(2)}s`);
    console.log(`📁 Arquivo: ${fileName} (${fileSizeMB} MB)`);
    console.log(`☁️ Storage: ${uploadData.path}`);
    console.log(`📊 Registros: ${jsonData.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        executionId: `edge_${Date.now()}`,
        downloadTime: downloadTime,
        totalTime: totalTime,
        fileName: fileName,
        fileSize: fileSizeMB,
        recordCount: jsonData.length,
        storagePath: uploadData.path,
        data: processedData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
