import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    let actualUrl = downloadUrl;

    // Fallback para URL simulada se não encontrar no Vault
    if (vaultError || !downloadUrl) {
      console.log('⚠️ URL não encontrada no Vault, usando URL simulada...');
      actualUrl = 'https://exemplo.hitss.com.br/relatorio.xlsx';
      console.log(`🔗 URL simulada: ${actualUrl}`);
    } else {
      console.log('✅ URL obtida do Vault com sucesso');
      console.log(`🔗 URL de download: ${actualUrl}`);
    }

    // Fazer download do arquivo Excel
    console.log('📥 Iniciando download do arquivo HITSS...');

    const startTime = Date.now();

    // Simular download (já que a URL é de exemplo)
    console.log('📊 Simulando download...');

    // Criar dados simulados do Excel
    const mockExcelData = generateMockExcelData();

    const downloadTime = (Date.now() - startTime) / 1000;
    const fileSizeMB = (mockExcelData.length / (1024 * 1024)).toFixed(2);

    console.log(`✅ Download simulado concluído em ${downloadTime.toFixed(2)}s`);
    console.log(`📊 Tamanho simulado: ${fileSizeMB} MB`);

    // Gerar nome do arquivo
    const fileName = `dre_hitss_${Date.now()}.xlsx`;
    const tempDir = '/tmp';
    const filePath = `${tempDir}/${fileName}`;

    // Salvar arquivo Excel simulado
    console.log(`💾 Criando arquivo simulado: ${filePath}`);

    // Em um ambiente real, usaríamos uma biblioteca como xlsx para criar o arquivo
    // Por enquanto, vamos simular o upload
    const fileBuffer = new TextEncoder().encode('Dados simulados do Excel');

    // Upload para Supabase Storage
    console.log('☁️ Fazendo upload para Supabase Storage...');

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

    console.log(`✅ Upload simulado concluído: ${uploadData.path}`);

    // Processar dados simulados
    console.log('📋 Processando dados simulados...');

    const jsonData = generateMockRecords(1000); // Simular 1000 registros

    console.log(`📊 Registros simulados: ${jsonData.length}`);

    // Converter dados para formato DRE
    const processedData = {
      empresa: 'HITSS DO BRASIL SERVIÇOS TECNOLÓGICOS LTDA',
      cnpj: '12.345.678/0001-90',
      periodo: new Date().toISOString().slice(0, 7),
      data_geracao: new Date().toISOString(),
      registros: jsonData.length,
      fileName: fileName,
      fileSize: fileSizeMB,
      downloadTime: downloadTime,
      uploadPath: uploadData.path,
      mockData: true
    };

    // Inserir dados na tabela dre_hitss
    console.log('💾 Inserindo dados na tabela dre_hitss...');

    const currentDate = new Date();
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth() + 1;

    const insertData = jsonData.map((registro, index) => ({
      projeto: registro.Projeto || `Projeto_${index + 1}`,
      ano: ano,
      mes: mes,
      conta: registro.ContaResumo || `Conta_${index + 1}`,
      descricao: registro.DenominacaoConta || `Descrição_${index + 1}`,
      natureza: registro.Natureza || (registro.Lancamento >= 0 ? 'RECEITA' : 'DESPESA'),
      tipo: registro.Tipo || 'OPERACIONAL',
      valor: Math.abs(registro.Lancamento || 1000.00),
      observacoes: `Importação simulada - Execução: edge_${Date.now()} - Cliente: ${registro.Cliente}`,
      // Campos adicionais
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
      lancamento: registro.Lancamento || 1000.00,
      periodo: registro.Periodo,
      metadata: {
        execution_id: `edge_${Date.now()}`,
        empresa: processedData.empresa,
        original_data: registro,
        import_date: currentDate.toISOString(),
        source: 'edge_function_simulation',
        mock_data: true
      }
    }));

    // Inserir em lotes para evitar timeout
    const BATCH_SIZE = 500;
    let insertedCount = 0;

    for (let i = 0; i < insertData.length; i += BATCH_SIZE) {
      const batch = insertData.slice(i, i + BATCH_SIZE);
      console.log(`📦 Inserindo lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(insertData.length / BATCH_SIZE)} (${batch.length} registros)...`);

      const { error: insertError } = await supabase
        .from('dre_hitss')
        .insert(batch);

      if (insertError) {
        console.log(`❌ Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`);
        throw new Error(`Falha na inserção do lote ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`);
      }

      insertedCount += batch.length;
    }

    console.log(`✅ Inserção concluída: ${insertedCount} registros`);

    const totalTime = (Date.now() - startTime) / 1000;

    console.log(`✅ Edge Function concluída em ${totalTime.toFixed(2)}s`);
    console.log(`📁 Arquivo simulado: ${fileName} (${fileSizeMB} MB)`);
    console.log(`☁️ Storage: ${uploadData.path}`);
    console.log(`📊 Registros inseridos: ${insertedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        executionId: `edge_${Date.now()}`,
        downloadTime: downloadTime,
        totalTime: totalTime,
        fileName: fileName,
        fileSize: fileSizeMB,
        recordCount: jsonData.length,
        insertedCount: insertedCount,
        storagePath: uploadData.path,
        mockData: true,
        vaultConfigured: !!downloadUrl,
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
        timestamp: new Date().toISOString(),
        mockData: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Função para gerar dados simulados do Excel
function generateMockExcelData() {
  const mockData = [];
  const numRecords = 1000;

  for (let i = 1; i <= numRecords; i++) {
    mockData.push({
      Relatorio: `REL_${i}`,
      Tipo: i % 2 === 0 ? 'Mercado' : 'Interno',
      Cliente: `Cliente_${i}`,
      LinhaNegocio: `Linha_${i % 5 + 1}`,
      ResponsavelArea: `Area_${i % 3 + 1}`,
      ResponsavelDelivery: `Delivery_${i % 4 + 1}`,
      ResponsavelDevengado: `Devengado_${i % 2 + 1}`,
      IdHoms: `HOMS_${i}`,
      CodigoProjeto: `PROJ_${i}`,
      Projeto: `Projeto ${i} - Cliente ${i}`,
      FilialFaturamento: `Filial_${i % 3 + 1}`,
      Imposto: i % 10 === 0 ? 'Sim' : 'Não',
      ContaResumo: `Conta_${i % 20 + 1}`,
      DenominacaoConta: `Conta ${i % 20 + 1} - Descrição`,
      IdRecurso: `REC_${i}`,
      Recurso: `Recurso_${i}`,
      Lancamento: i % 5 === 0 ? -1000.00 : 1000.00, // Alguns negativos
      Periodo: `2025-${String(i % 12 + 1).padStart(2, '0')}`,
      Natureza: i % 3 === 0 ? 'Custo' : 'Receita'
    });
  }

  // Converter para buffer simulado
  return JSON.stringify(mockData);
}

// Função para gerar registros simulados
function generateMockRecords(count) {
  const records = [];

  for (let i = 1; i <= count; i++) {
    records.push({
      Relatorio: `REL_${i}`,
      Tipo: i % 2 === 0 ? 'Mercado' : 'Interno',
      Cliente: `Cliente_${i}`,
      LinhaNegocio: `Linha_${i % 5 + 1}`,
      ResponsavelArea: `Area_${i % 3 + 1}`,
      ResponsavelDelivery: `Delivery_${i % 4 + 1}`,
      ResponsavelDevengado: `Devengado_${i % 2 + 1}`,
      IdHoms: `HOMS_${i}`,
      CodigoProjeto: `PROJ_${i}`,
      Projeto: `Projeto ${i} - Cliente ${i}`,
      FilialFaturamento: `Filial_${i % 3 + 1}`,
      Imposto: i % 10 === 0 ? 'Sim' : 'Não',
      ContaResumo: `Conta_${i % 20 + 1}`,
      DenominacaoConta: `Conta ${i % 20 + 1} - Descrição`,
      IdRecurso: `REC_${i}`,
      Recurso: `Recurso_${i}`,
      Lancamento: i % 5 === 0 ? -1000.00 : 1000.00,
      Periodo: `2025-${String(i % 12 + 1).padStart(2, '0')}`,
      Natureza: i % 3 === 0 ? 'Custo' : 'Receita'
    });
  }

  return records;
}
