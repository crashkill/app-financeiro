/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { corsHeaders, handleCors, createCorsResponse, createErrorResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

// Configurações do Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const HITSS_EXPORT_URL = 'https://hitsscontrol.globalhitss.com.br/api/api/export/xls?clienteFiltro=&servicoFiltro=-1&tipoFiltro=-1&projetoFiltro=&projetoAtivoFiltro=true&projetoParalisadoFiltro=true&projetoEncerradoFiltro=true&projetoCanceladoFiltro=true&responsavelareaFiltro=&idResponsavelareaFiltro=&responsavelprojetoFiltro=FABRICIO%20CARDOSO%20DE%20LIMA&idresponsavelprojetoFiltro=78&filtroDeFiltro=09-2016&filtroAteFiltro=08-2025&visaoFiltro=PROJ&usuarioFiltro=fabricio.lima&idusuarioFiltro=78&perfilFiltro=RESPONSAVEL_DELIVERY%7CRESPONSAVEL_LANCAMENTO%7CVISITANTE&telaFiltro=painel_projetos';

interface HitssProject {
  codigo_projeto: string;
  nome_projeto: string;
  cliente: string;
  responsavel: string;
  status: string;
  data_inicio?: string;
  data_fim?: string;
  valor_contrato?: number;
  horas_previstas?: number;
  horas_realizadas?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors(req);
  }

  try {
    const startTime = Date.now();
    const executionId = crypto.randomUUID();
    
    console.log(`🚀 Iniciando automação HITSS - ID: ${executionId}`);
    
    // Registrar início da execução
    const { error: startError } = await supabase
      .from('automation_executions')
      .insert({
        execution_id: executionId,
        status: 'running'
      });
    
    if (startError) {
      console.warn('Erro ao registrar início da execução:', startError);
      throw new Error(`Erro ao registrar execução: ${startError.message}`);
    }

    console.log('✅ Execução registrada com sucesso');
    
    // Buscar credenciais do HITSS no Vault
    console.log('🔐 Buscando credenciais do HITSS...');
    const { data: credentials, error: credError } = await supabase
      .from('vault')
      .select('secret')
      .eq('name', 'hitss_credentials')
      .single();
    
    if (credError || !credentials) {
      throw new Error('Credenciais do HITSS não encontradas no Vault');
    }
    
    const hitssCredentials = JSON.parse(credentials.secret);
    
    // Download do arquivo XLSX do HITSS
    console.log('📥 Fazendo download do arquivo HITSS...');
    const response = await fetch(HITSS_EXPORT_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${hitssCredentials.username}:${hitssCredentials.password}`)}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo HITSS: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames.length) {
      throw new Error('Arquivo XLSX não contém planilhas');
    }
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📊 Arquivo processado: ${jsonData.length} linhas encontradas`);
    
    // Processar dados (assumindo que a primeira linha são os cabeçalhos)
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);
    
    const projects: HitssProject[] = [];
    let recordsProcessed = 0;
    let recordsFailed = 0;
    
    for (const row of dataRows) {
      try {
        if (!row || row.length === 0) continue;
        
        const project: HitssProject = {
          codigo_projeto: String(row[0] || '').trim(),
          nome_projeto: String(row[1] || '').trim(),
          cliente: String(row[2] || '').trim(),
          responsavel: String(row[3] || '').trim(),
          status: String(row[4] || '').trim(),
          data_inicio: row[5] ? String(row[5]) : undefined,
          data_fim: row[6] ? String(row[6]) : undefined,
          valor_contrato: row[7] ? Number(row[7]) : undefined,
          horas_previstas: row[8] ? Number(row[8]) : undefined,
          horas_realizadas: row[9] ? Number(row[9]) : undefined
        };
        
        if (project.codigo_projeto && project.nome_projeto) {
          projects.push(project);
          recordsProcessed++;
        }
      } catch (error) {
        console.warn('Erro ao processar linha:', error);
        recordsFailed++;
      }
    }
    
    console.log(`✅ Processamento concluído: ${recordsProcessed} registros válidos, ${recordsFailed} falhas`);
    
    // Limpar dados existentes do período atual
    const today = new Date().toISOString().split('T')[0];
    console.log('🧹 Limpando dados existentes...');
    
    const { error: deleteError } = await supabase
      .from('hitss_projetos')
      .delete()
      .gte('created_at', `${today}T00:00:00.000Z`);
    
    if (deleteError) {
      console.warn('Erro ao limpar dados existentes:', deleteError);
    }
    
    // Inserir novos dados
    let recordsImported = 0;
    if (projects.length > 0) {
      console.log(`💾 Inserindo ${projects.length} projetos no banco...`);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('hitss_projetos')
        .insert(projects)
        .select();
      
      if (insertError) {
        console.error('Erro ao inserir dados:', insertError);
        throw new Error(`Erro ao inserir dados: ${insertError.message}`);
      }
      
      recordsImported = insertedData?.length || 0;
      console.log(`✅ ${recordsImported} projetos inseridos com sucesso`);
    }
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Registrar execução concluída
    const { error: completeError } = await supabase
      .from('automation_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        records_processed: recordsProcessed,
        records_imported: recordsImported,
        records_failed: recordsFailed,
        file_name: 'hitss_export.xlsx',
        file_size: arrayBuffer.byteLength
      })
      .eq('execution_id', executionId);
    
    if (completeError) {
      console.warn('Erro ao atualizar execução concluída:', completeError);
      throw new Error(`Erro ao atualizar execução: ${completeError.message}`);
    }

    console.log('✅ Automação HITSS concluída com sucesso');

    return createCorsResponse({
      success: true,
      message: "Automação HITSS executada com sucesso",
      executionId,
      recordsProcessed,
      recordsImported,
      recordsFailed,
      executionTime
    }, 200);
    
  } catch (err) {
    console.error('❌ Erro na automação HITSS:', err);
    
    // Registrar erro na execução
    const errorExecutionId = crypto.randomUUID();
    const { error: errorUpdateError } = await supabase
      .from('automation_executions')
      .insert({
        execution_id: errorExecutionId,
        status: 'failed',
        error_message: err.message
      });
    
    if (errorUpdateError) {
      console.warn('Erro ao registrar erro da execução:', errorUpdateError);
    }
    
    return createErrorResponse(err.message, 500);
  }
});