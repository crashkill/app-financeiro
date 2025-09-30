// Teste da lógica da Edge Function hitss-automation
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

// Configuração do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';
const supabase = createClient(supabaseUrl, supabaseKey);

// URL do sistema HITSS para exportação
const HITSS_EXPORT_URL = 'https://hitss.com.br/sistema/exportar-dre';

// Interface para os dados DRE
interface DreRow {
  id?: string;
  upload_batch_id: string;
  file_name: string;
  tipo: string;
  natureza: string;
  valor: number;
  data: string;
  project_reference?: string;
  year?: number;
  jan?: number;
  fev?: number;
  mar?: number;
  abr?: number;
  mai?: number;
  jun?: number;
  jul?: number;
  ago?: number;
  set?: number;
  out?: number;
  nov?: number;
  dez?: number;
}

// Função para processar dados DRE
function processDreData(buffer, fileName, batchId) {
  try {
    console.log('Iniciando processamento dos dados DRE...');
    
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`Planilha carregada com ${jsonData.length} linhas`);

    if (jsonData.length < 2) {
      throw new Error('Planilha vazia ou sem dados válidos');
    }

    // Encontrar cabeçalhos dos meses
    const headerRow = jsonData[0];
    const monthHeaders = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const monthIndexes = {};
    
    headerRow.forEach((header, index) => {
      if (header && typeof header === 'string') {
        const normalizedHeader = header.toLowerCase().trim();
        if (monthHeaders.includes(normalizedHeader)) {
          monthIndexes[normalizedHeader] = index;
        }
      }
    });

    console.log('Índices dos meses encontrados:', monthIndexes);

    const processedData = [];
    let processedCount = 0;
    let failedCount = 0;

    // Processar dados (pular cabeçalho)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        if (!row || row.length === 0) continue;

        const dreRow = {
          id: uuidv4(),
          upload_batch_id: batchId,
          file_name: fileName,
          tipo: row[0] || '',
          natureza: row[1] || '',
          valor: parseFloat(row[2]) || 0,
          data: new Date().toISOString(),
          project_reference: 'HITSS_AUTO',
          year: new Date().getFullYear()
        };

        // Adicionar valores dos meses
        monthHeaders.forEach(month => {
          if (monthIndexes[month] !== undefined) {
            dreRow[month] = parseFloat(row[monthIndexes[month]]) || 0;
          }
        });

        processedData.push(dreRow);
        processedCount++;
      } catch (error) {
        console.error(`Erro ao processar linha ${i}:`, error);
        failedCount++;
      }
    }

    console.log(`Processamento concluído: ${processedCount} registros processados, ${failedCount} falhas`);

    return {
      data: processedData,
      processedCount,
      failedCount,
      batchId
    };
  } catch (error) {
    console.error('Erro no processamento dos dados:', error);
    throw error;
  }
}

// Função principal de teste
async function testHitssAutomation() {
  try {
    console.log('=== TESTE DA EDGE FUNCTION HITSS-AUTOMATION ===');
    
    const executionId = uuidv4();
    const batchId = uuidv4();
    const fileName = `hitss_dre_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    console.log('Execution ID:', executionId);
    console.log('Batch ID:', batchId);
    console.log('File Name:', fileName);
    
    // Registrar execução
    console.log('\n1. Registrando execução...');
    const { error: insertError } = await supabase
      .from('automation_executions')
      .insert({
        id: executionId,
        function_name: 'hitss-automation',
        status: 'running',
        started_at: new Date().toISOString(),
        phase: 'initialization'
      });
    
    if (insertError) {
      console.error('Erro ao registrar execução:', insertError);
      return;
    }
    
    console.log('✅ Execução registrada com sucesso');
    
    // Simular download do arquivo (usando dados de exemplo)
    console.log('\n2. Simulando download do arquivo...');
    
    // Atualizar fase
    await supabase
      .from('automation_executions')
      .update({ phase: 'downloading' })
      .eq('id', executionId);
    
    // Criar dados de exemplo para teste
    const exampleData = [
      ['Tipo', 'Natureza', 'Valor', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      ['Receita', 'Vendas', 100000, 8000, 8500, 9000, 9500, 10000, 10500, 11000, 11500, 12000, 12500, 13000, 13500],
      ['Despesa', 'Salários', 50000, 4000, 4200, 4400, 4600, 4800, 5000, 5200, 5400, 5600, 5800, 6000, 6200],
      ['Despesa', 'Aluguel', 24000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000]
    ];
    
    // Criar workbook de exemplo
    const ws = XLSX.utils.aoa_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DRE');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    console.log('✅ Arquivo de exemplo criado');
    
    // Processar dados
    console.log('\n3. Processando dados...');
    
    await supabase
      .from('automation_executions')
      .update({ phase: 'processing' })
      .eq('id', executionId);
    
    const result = processDreData(buffer, fileName, batchId);
    console.log('✅ Dados processados:', {
      registros: result.processedCount,
      falhas: result.failedCount
    });
    
    // Limpar dados existentes
    console.log('\n4. Limpando dados existentes...');
    
    await supabase
      .from('automation_executions')
      .update({ phase: 'cleaning' })
      .eq('id', executionId);
    
    const { error: deleteError } = await supabase
      .from('dre_hitss')
      .delete()
      .eq('project_reference', 'HITSS_AUTO');
    
    if (deleteError) {
      console.error('Erro ao limpar dados:', deleteError);
    } else {
      console.log('✅ Dados existentes removidos');
    }
    
    // Inserir novos dados
    console.log('\n5. Inserindo novos dados...');
    
    await supabase
      .from('automation_executions')
      .update({ phase: 'inserting' })
      .eq('id', executionId);
    
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < result.data.length; i += batchSize) {
      const batch = result.data.slice(i, i + batchSize);
      
      const { error: batchError } = await supabase
        .from('dre_hitss')
        .insert(batch);
      
      if (batchError) {
        console.error(`Erro no lote ${Math.floor(i / batchSize) + 1}:`, batchError);
        throw batchError;
      }
      
      insertedCount += batch.length;
      console.log(`Lote ${Math.floor(i / batchSize) + 1} inserido: ${batch.length} registros`);
    }
    
    console.log(`✅ Total inserido: ${insertedCount} registros`);
    
    // Finalizar execução
    console.log('\n6. Finalizando execução...');
    
    await supabase
      .from('automation_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        phase: 'completed',
        records_processed: result.processedCount,
        records_failed: result.failedCount
      })
      .eq('id', executionId);
    
    console.log('✅ Execução finalizada com sucesso');
    
    // Verificar dados inseridos
    console.log('\n7. Verificando dados inseridos...');
    
    const { data: insertedData, error: selectError } = await supabase
      .from('dre_hitss')
      .select('*')
      .eq('upload_batch_id', batchId)
      .limit(5);
    
    if (selectError) {
      console.error('Erro ao verificar dados:', selectError);
    } else {
      console.log('✅ Primeiros 5 registros inseridos:');
      console.table(insertedData);
    }
    
    console.log('\n=== TESTE CONCLUÍDO COM SUCESSO ===');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    
    // Atualizar status de erro
    try {
      await supabase
        .from('automation_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          phase: 'error'
        })
        .eq('id', executionId);
    } catch (updateError) {
      console.error('Erro ao atualizar status de erro:', updateError);
    }
  }
}

// Executar teste
testHitssAutomation();