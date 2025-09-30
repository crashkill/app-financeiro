import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { executionId } = await req.json()
    const maxRetries = 3
    const timeoutMs = 420000 // 7 minutos

    console.log('🚀 Iniciando download otimizado...')

    // Buscar URL do Vault
    const { data: downloadUrl, error: vaultError } = await supabase.rpc('get_secret', {
      secret_name: 'HITSS_DOWNLOAD_URL'
    })

    if (vaultError || !downloadUrl) {
      throw new Error(`Vault error: ${vaultError?.message || 'URL not found'}`)
    }

    // Configurações otimizadas para downloads lentos
    const downloadConfig = {
      method: 'GET',
      headers: {
        'User-Agent': 'DRE-Automation-Supabase/1.0',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Cache-Control': 'no-cache'
      },
      // Configurações específicas do Deno para conexões lentas
      signal: AbortSignal.timeout(timeoutMs),
      keepalive: true
    }

    let lastError = null
    let downloadTime = 0
    let fileSize = 0

    // Retry com backoff exponencial
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${maxRetries}...`)

        const startTime = Date.now()

        // Download usando fetch nativo do Deno (mais eficiente)
        const response = await fetch(downloadUrl, downloadConfig)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // Ler como ArrayBuffer para XLSX
        const arrayBuffer = await response.arrayBuffer()
        downloadTime = (Date.now() - startTime) / 1000
        fileSize = arrayBuffer.byteLength

        console.log(`✅ Download concluído em ${downloadTime.toFixed(2)}s`)
        console.log(`📊 Tamanho: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`)
        console.log(`⚡ Velocidade: ${((fileSize / (1024 * 1024)) / downloadTime * 8).toFixed(2)} Mbps`)

        // Salvar no Storage do Supabase
        const fileName = `dre_hitss_${Date.now()}.xlsx`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('dre-files')
          .upload(`uploads/${fileName}`, arrayBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            upsert: true
          })

        if (uploadError) throw uploadError

        // Log de sucesso
        await supabase
          .from('dre_execution_logs')
          .insert({
            execution_id: executionId || `download_${Date.now()}`,
            step: 'DOWNLOAD_HITSS',
            status: 'SUCESSO',
            message: `Download concluído: ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)}MB em ${downloadTime.toFixed(2)}s)`
          })

        return new Response(
          JSON.stringify({
            success: true,
            fileName,
            storagePath: uploadData.path,
            downloadTime,
            fileSize,
            executionId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (error) {
        lastError = error
        const isLastAttempt = attempt === maxRetries

        console.log(`❌ Tentativa ${attempt} falhou: ${error.message}`)

        if (!isLastAttempt) {
          const backoffDelay = Math.min(5000 * Math.pow(2, attempt - 1), 60000)
          console.log(`⏳ Aguardando ${backoffDelay/1000}s...`)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        }
      }
    }

    // Todas as tentativas falharam
    await supabase
      .from('dre_execution_logs')
      .insert({
        execution_id: executionId || `download_${Date.now()}`,
        step: 'DOWNLOAD_HITSS',
        status: 'ERRO',
        message: `Download falhou após ${maxRetries} tentativas: ${lastError.message}`
      })

    return new Response(
      JSON.stringify({
        success: false,
        error: `Download failed after ${maxRetries} attempts: ${lastError.message}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )

  } catch (error) {
    console.error('❌ Erro crítico:', error)

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
