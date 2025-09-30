import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const start = Date.now()
    const executionId = crypto.randomUUID()

    // Body opcional com override da URL
    let overrideUrl: string | null = null
    try {
      const body = await req.json()
      overrideUrl = body?.url || null
    } catch (_) {}

    // 1) Obter URL (override do body ou Vault)
    let downloadUrl: string | null = overrideUrl
    if (!downloadUrl) {
      const { data, error: vaultErr } = await supabase.rpc('get_secret', { secret_name: 'HITSS_DOWNLOAD_URL' })
      if (vaultErr || !data) throw new Error(`HITSS_DOWNLOAD_URL não encontrado no Vault: ${vaultErr?.message ?? 'sem valor'}`)
      downloadUrl = data as string
    }

    // 2) Baixar arquivo
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
      }
    })
    if (!response.ok) throw new Error(`Falha no download: ${response.status} ${response.statusText}`)

    const arrayBuffer = await response.arrayBuffer()

    // 3) Calcular hash do arquivo
    const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(arrayBuffer))
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('')

    // 4) Salvar no Storage
    const fileName = `dre_hitss_${new Date().toISOString().replace(/[:.]/g,'-')}.xlsx`
    const storagePath = `uploads/${fileName}`

    const { error: uploadErr } = await supabase.storage
      .from('dre_reports')
      .upload(storagePath, arrayBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true,
        duplex: 'half' as any
      })

    if (uploadErr) throw new Error(`Erro no upload para Storage: ${uploadErr.message}`)

    // 5) Retornar resultado (o trigger no storage chamará process-dre-upload)
    return new Response(
      JSON.stringify({
        success: true,
        executionId,
        storage: { bucket: 'dre_reports', path: storagePath },
        file_hash: hashHex,
        processing_hint: 'process-dre-upload será acionada via webhook',
        elapsed_ms: Date.now() - start
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
