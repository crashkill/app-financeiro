#!/usr/bin/env node
/**
 * Robô HITSS - Download e processamento automático de Excel
 * Executa download do arquivo Excel da API HITSS e processa os dados
 */

const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class HITSSRobot {
  constructor() {
    console.log('🤖 Inicializando Robô HITSS...');
    
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.executionId = uuidv4();
    this.batchId = `HITSS_AUTO_${Date.now()}`;
    
    console.log(`🆔 Execução: ${this.executionId}`);
    console.log(`📦 Batch: ${this.batchId}`);
  }

  async createExecutionRecord() {
    console.log('📝 Criando registro de execução...');
    
    try {
      const { error } = await this.supabase
        .from('automation_executions')
        .insert({
          id: this.executionId,
          status: 'running',
          started_at: new Date().toISOString(),
          phase: 'downloading',
          batch_id: this.batchId
        });

      if (error) throw error;
      
      console.log('✅ Registro de execução criado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar execução:', error);
      return false;
    }
  }

  async updateExecutionPhase(phase, additionalData = {}) {
    console.log(`📝 Atualizando fase: ${phase}`);
    
    try {
      const updateData = { phase, ...additionalData };
      
      const { error } = await this.supabase
        .from('automation_executions')
        .update(updateData)
        .eq('id', this.executionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar fase:', error);
      return false;
    }
  }

  async downloadExcelFile() {
    console.log('📥 Baixando arquivo Excel da API HITSS...');
    
    const url = 'https://hitsscontrol.globalhitss.com.br/api/api/export/xls';
    const params = new URLSearchParams({
      clienteFiltro: '',
      servicoFiltro: '-1',
      tipoFiltro: '-1',
      projetoFiltro: '',
      projetoAtivoFiltro: 'true',
      projetoParalisadoFiltro: 'true',
      projetoEncerradoFiltro: 'true',
      projetoCanceladoFiltro: 'true',
      responsavelareaFiltro: '',
      idResponsavelareaFiltro: '',
      responsavelprojetoFiltro: 'FABRICIO CARDOSO DE LIMA',
      idresponsavelprojetoFiltro: '78',
      filtroDeFiltro: '09-2016',
      filtroAteFiltro: '08-2025',
      visaoFiltro: 'PROJ',
      usuarioFiltro: 'fabricio.lima',
      idusuarioFiltro: '78',
      perfilFiltro: 'RESPONSAVEL_DELIVERY|RESPONSAVEL_LANCAMENTO|VISITANTE',
      telaFiltro: 'painel_projetos'
    });

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
    };

    try {
      const response = await fetch(`${url}?${params}`, { 
        method: 'GET', 
        headers,
        timeout: 30000 
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      console.log(`✅ Arquivo baixado: ${buffer.length} bytes`);
      
      return buffer;
    } catch (error) {
      throw new Error(`Erro ao baixar arquivo: ${error.message}`);
    }
  }

  processExcelData(excelBuffer) {
    console.log('📊 Processando arquivo Excel...');
    
    try {
      // Ler Excel com XLSX
      const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
      
      if (!workbook.SheetNames.length) {
        throw new Error('Arquivo Excel não contém planilhas');
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log(`📋 Dados carregados: ${jsonData.length} linhas`);
      
      // Encontrar linha de cabeçalho com meses
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                         'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      let headerRowIndex = -1;
      let monthHeaders = [];
      
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        const rowStr = row.join(' ').toLowerCase();
        const monthsFound = monthNames.filter(month => 
          rowStr.includes(month.toLowerCase())
        );
        
        if (monthsFound.length >= 3) {
          headerRowIndex = i;
          monthHeaders = monthsFound;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error('Não foi possível encontrar cabeçalho com meses');
      }

      console.log(`📍 Cabeçalho encontrado na linha ${headerRowIndex + 1}`);
      console.log(`📅 Meses encontrados: ${monthHeaders.join(', ')}`);

      // Processar dados
      const dreRecords = [];
      const currentYear = new Date().getFullYear();
      let processedCount = 0;
      let failedCount = 0;

      // Processar linhas de dados
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        if (!row || row.length < 4) continue;
        
        try {
          const accountSituation = row[0] || null;
          const accountGrouping = row[1] || null;
          const accountCode = String(row[2] || '');
          const accountName = String(row[3] || '');

          if (!accountCode || !accountName) continue;

          // Processar cada mês
          monthNames.forEach((monthName, monthIndex) => {
            const colIndex = monthIndex + 4; // Assumindo que os meses começam na coluna 4
            
            if (colIndex < row.length && row[colIndex] !== undefined && 
                row[colIndex] !== null && row[colIndex] !== '') {
              
              try {
                let amount;
                if (typeof row[colIndex] === 'string') {
                  amount = parseFloat(row[colIndex].replace(/[^0-9.,-]+/g, '').replace('.', '').replace(',', '.'));
                } else {
                  amount = parseFloat(row[colIndex]);
                }

                if (!isNaN(amount) && amount !== 0) {
                  const rawData = {
                    accountSituation,
                    accountGrouping,
                    accountCode,
                    accountName,
                    monthName,
                    originalAmount: row[colIndex],
                    projectReference: 'HITSS_AUTO',
                    year: currentYear,
                    rowIndex: i,
                    colIndex
                  };

                  const dreRecord = {
                    upload_batch_id: this.batchId,
                    file_name: `hitss_auto_${new Date().toISOString().split('T')[0]}.xlsx`,
                    tipo: amount >= 0 ? 'receita' : 'despesa',
                    natureza: amount >= 0 ? 'RECEITA' : 'CUSTO',
                    descricao: `HITSS_AUTO - ${accountName}`,
                    valor: amount.toString(),
                    data: `${monthIndex + 1}/${currentYear}`,
                    categoria: accountGrouping || 'Não especificado',
                    observacao: null,
                    lancamento: amount.toString(),
                    projeto: `HITSS_AUTO - ${accountName}`,
                    periodo: `${monthIndex + 1}/${currentYear}`,
                    denominacao_conta: accountName,
                    conta_resumo: accountCode,
                    linha_negocio: accountGrouping || 'Não especificado',
                    relatorio: 'Realizado',
                    raw_data: rawData
                  };

                  dreRecords.push(dreRecord);
                  processedCount++;
                }
              } catch (error) {
                failedCount++;
                continue;
              }
            }
          });
        } catch (error) {
          console.warn(`⚠️ Erro ao processar linha ${i}:`, error.message);
          failedCount++;
          continue;
        }
      }

      console.log(`✅ Processamento concluído: ${processedCount} registros, ${failedCount} falhas`);
      
      return { dreRecords, processedCount, failedCount };
      
    } catch (error) {
      throw new Error(`Erro ao processar Excel: ${error.message}`);
    }
  }

  async sendDataToSupabase(dreRecords) {
    console.log('💾 Enviando dados para o Supabase...');
    
    try {
      if (!dreRecords.length) {
        console.log('⚠️ Nenhum registro para enviar');
        return true;
      }

      // Limpar dados existentes do mesmo tipo
      try {
        await this.supabase
          .from('hitss_data')
          .delete()
          .like('upload_batch_id', 'HITSS_AUTO_%');
        
        console.log('🧹 Dados anteriores removidos');
      } catch (error) {
        console.warn('⚠️ Aviso ao limpar dados:', error.message);
      }

      // Inserir em lotes
      const batchSize = 100;
      let insertedCount = 0;

      for (let i = 0; i < dreRecords.length; i += batchSize) {
        const batch = dreRecords.slice(i, i + batchSize);
        
        try {
          const { error } = await this.supabase
            .from('hitss_data')
            .insert(batch);

          if (error) throw error;
          
          insertedCount += batch.length;
          console.log(`📦 Lote ${Math.floor(i / batchSize) + 1} inserido: ${batch.length} registros`);
          
        } catch (error) {
          console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error);
          throw error;
        }
      }

      console.log(`✅ Total inserido: ${insertedCount} registros`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao enviar dados:', error);
      return false;
    }
  }

  async finalizeExecution(success, processedCount = 0, failedCount = 0) {
    console.log('🏁 Finalizando execução...');
    
    try {
      const status = success ? 'completed' : 'failed';
      
      await this.supabase
        .from('automation_executions')
        .update({
          status,
          completed_at: new Date().toISOString(),
          phase: success ? 'completed' : 'failed',
          records_processed: processedCount,
          records_failed: failedCount
        })
        .eq('id', this.executionId);

      console.log(`🏁 Execução finalizada: ${status}`);
      
    } catch (error) {
      console.error('❌ Erro ao finalizar execução:', error);
    }
  }

  async run() {
    console.log('🚀 Iniciando execução do robô...');
    
    try {
      // 1. Criar registro de execução
      if (!(await this.createExecutionRecord())) {
        throw new Error('Falha ao criar registro de execução');
      }

      // 2. Baixar arquivo Excel
      await this.updateExecutionPhase('downloading');
      const excelBuffer = await this.downloadExcelFile();

      // 3. Processar dados
      await this.updateExecutionPhase('processing');
      const { dreRecords, processedCount, failedCount } = this.processExcelData(excelBuffer);

      // 4. Enviar para Supabase
      await this.updateExecutionPhase('inserting', {
        records_processed: processedCount,
        records_failed: failedCount
      });
      
      const success = await this.sendDataToSupabase(dreRecords);
      
      if (!success) {
        throw new Error('Falha ao inserir dados no Supabase');
      }

      // 5. Finalizar
      await this.finalizeExecution(true, processedCount, failedCount);

      const result = {
        success: true,
        execution_id: this.executionId,
        batch_id: this.batchId,
        records_processed: processedCount,
        records_failed: failedCount,
        records_inserted: dreRecords.length,
        message: 'Robô HITSS executado com sucesso'
      };

      console.log('🎉 Robô concluído com sucesso!');
      return result;

    } catch (error) {
      console.error('💥 Erro no robô:', error);
      await this.finalizeExecution(false);
      
      return {
        success: false,
        execution_id: this.executionId,
        error: error.message,
        message: 'Erro na execução do robô HITSS'
      };
    }
  }
}

// Função principal
async function main() {
  try {
    const robot = new HITSSRobot();
    const result = await robot.run();
    
    // Imprimir resultado final
    console.log('\n' + '='.repeat(50));
    console.log('RESULTADO FINAL:');
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(50));
    
    // Retornar código de saída
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = HITSSRobot;