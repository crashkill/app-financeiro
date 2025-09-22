import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DreRecord {
  upload_batch_id: string;
  file_name: string;
  tipo: string;
  natureza: string;
  descricao: string;
  valor: string;
  data: string;
  categoria: string;
  observacao: string | null;
  lancamento: string;
  projeto: string;
  periodo: string;
  denominacao_conta: string;
  conta_resumo: string;
  linha_negocio: string;
  relatorio: string;
  raw_data: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando automação HITSS Excel...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create execution record
    const executionId = crypto.randomUUID()
    const batchId = `HITSS_AUTO_${Date.now()}`
    
    console.log(`📝 Criando registro de execução: ${executionId}`)
    
    const { error: executionError } = await supabase
      .from('automation_executions')
      .insert({
        id: executionId,
        status: 'running',
        started_at: new Date().toISOString(),
        phase: 'downloading',
        batch_id: batchId
      })

    if (executionError) {
      throw new Error(`Erro ao criar execução: ${executionError.message}`)
    }

    // Download Excel file from HITSS API
    console.log('📥 Baixando arquivo Excel da API HITSS...')
    
    const hitssUrl = 'https://hitsscontrol.globalhitss.com.br/api/api/export/xls?clienteFiltro=&servicoFiltro=-1&tipoFiltro=-1&projetoFiltro=&projetoAtivoFiltro=true&projetoParalisadoFiltro=true&projetoEncerradoFiltro=true&projetoCanceladoFiltro=true&responsavelareaFiltro=&idResponsavelareaFiltro=&responsavelprojetoFiltro=FABRICIO%20CARDOSO%20DE%20LIMA&idresponsavelprojetoFiltro=78&filtroDeFiltro=09-2016&filtroAteFiltro=08-2025&visaoFiltro=PROJ&usuarioFiltro=fabricio.lima&idusuarioFiltro=78&perfilFiltro=RESPONSAVEL_DELIVERY%7CRESPONSAVEL_LANCAMENTO%7CVISITANTE&telaFiltro=painel_projetos'
    
    const response = await fetch(hitssUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.status} ${response.statusText}`)
    }

    console.log('✅ Arquivo baixado com sucesso')

    // Update execution phase
    await supabase
      .from('automation_executions')
      .update({ phase: 'processing' })
      .eq('id', executionId)

    // Process Excel file
    console.log('📊 Processando arquivo Excel...')
    
    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    if (!workbook.SheetNames.length) {
      throw new Error('Arquivo Excel não contém planilhas')
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    console.log(`📋 Dados extraídos: ${jsonData.length} linhas`)

    // Process data according to DRE rules
    console.log('🔄 Processando dados conforme regras DRE...')
    
    const dreRecords: DreRecord[] = []
    const currentYear = new Date().getFullYear()
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    // Find header row (usually contains month names)
    let headerRowIndex = -1
    let monthHeaders: string[] = []
    
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i] as any[]
      const monthsFound = row.filter(cell => 
        typeof cell === 'string' && monthNames.some(month => 
          cell.toLowerCase().includes(month.toLowerCase())
        )
      )
      
      if (monthsFound.length >= 3) {
        headerRowIndex = i
        monthHeaders = monthsFound
        break
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('Não foi possível encontrar cabeçalho com meses na planilha')
    }

    console.log(`📍 Cabeçalho encontrado na linha ${headerRowIndex + 1}`)
    console.log(`📅 Meses encontrados: ${monthHeaders.join(', ')}`)

    // Process data rows
    let processedCount = 0
    let failedCount = 0

    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[]
      
      if (!row || row.length < 4) continue

      try {
        const accountSituation = row[0] || null
        const accountGrouping = row[1] || null
        const accountCode = String(row[2] || '')
        const accountName = String(row[3] || '')

        if (!accountCode || !accountName) continue

        // Process each month column
        monthHeaders.forEach((monthHeader, colIndex) => {
          const monthIndex = monthNames.findIndex(month => 
            monthHeader.toLowerCase().includes(month.toLowerCase())
          )
          
          if (monthIndex !== -1 && row[colIndex + 4] !== undefined && row[colIndex + 4] !== null && row[colIndex + 4] !== '') {
            const rawValue = String(row[colIndex + 4])
            const amount = parseFloat(rawValue.replace(/[^0-9.,-]+/g, '').replace('.', '').replace(',', '.'))
            
            if (!isNaN(amount) && amount !== 0) {
              const rawData = {
                accountSituation,
                accountGrouping,
                accountCode,
                accountName,
                monthHeader,
                originalAmount: row[colIndex + 4],
                projectReference: 'HITSS_AUTO',
                year: currentYear,
                rowIndex: i,
                colIndex: colIndex + 4
              }
              
              const dreRecord: DreRecord = {
                upload_batch_id: batchId,
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
              }
              
              dreRecords.push(dreRecord)
              processedCount++
            }
          }
        })
      } catch (error) {
        console.error(`Erro ao processar linha ${i}:`, error)
        failedCount++
      }
    }

    console.log(`✅ Processamento concluído: ${processedCount} registros processados, ${failedCount} falhas`)

    // Update execution phase
    await supabase
      .from('automation_executions')
      .update({ 
        phase: 'inserting',
        records_processed: processedCount,
        records_failed: failedCount
      })
      .eq('id', executionId)

    // Insert data into dre_hitss table
    console.log('💾 Inserindo dados na tabela dre_hitss...')
    
    if (dreRecords.length > 0) {
      // Clear existing auto data
      const { error: deleteError } = await supabase
        .from('dre_hitss')
        .delete()
        .eq('upload_batch_id', batchId.split('_')[0] + '_AUTO_%')

      if (deleteError) {
        console.warn('Aviso ao limpar dados existentes:', deleteError)
      }

      // Insert in batches
      const batchSize = 100
      let insertedCount = 0

      for (let i = 0; i < dreRecords.length; i += batchSize) {
        const batch = dreRecords.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('dre_hitss')
          .insert(batch)

        if (insertError) {
          console.error(`Erro no lote ${Math.floor(i / batchSize) + 1}:`, insertError)
          failedCount += batch.length
        } else {
          insertedCount += batch.length
          console.log(`Lote ${Math.floor(i / batchSize) + 1} inserido: ${batch.length} registros`)
        }
      }

      console.log(`✅ Inserção concluída: ${insertedCount} registros inseridos`)
    }

    // Finalize execution
    console.log('🏁 Finalizando execução...')
    
    await supabase
      .from('automation_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        phase: 'completed',
        records_processed: processedCount,
        records_failed: failedCount
      })
      .eq('id', executionId)

    const result = {
      success: true,
      executionId,
      batchId,
      recordsProcessed: processedCount,
      recordsFailed: failedCount,
      recordsInserted: dreRecords.length,
      message: 'Automação HITSS Excel executada com sucesso'
    }

    console.log('✅ Automação concluída:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Erro na automação:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro na automação HITSS Excel'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})