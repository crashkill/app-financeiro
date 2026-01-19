/**
 * HOST GlobalHitss Sync Edge Function
 * ==========================================
 * Sincroniza dados de profissionais do HOST GlobalHitss via download direto de relatórios Excel.
 * 
 * Endpoint de Download:
 * GET /Reportes/DescargaExcelm?reporte={NOME}&filtros=Año~I~{ANO}|Mes~I~{MES}
 * 
 * Relatórios Disponíveis:
 * - Horas_HOST_RecursoProyecto: Profissionais por projeto
 * - Reporte Colaboradores Disponibles: Lista de colaboradores
 * - Auditoria_AltasRecursos: Novos profissionais
 * - BajasRecursos: Profissionais desligados
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import * as xlsx from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs'

// Configurações
const HOST_BASE_URL = 'https://host.globalhitss.com'
const LOGIN_URL = `${HOST_BASE_URL}/Security/Login`
const REPORT_DOWNLOAD_URL = `${HOST_BASE_URL}/Reportes/DescargaExcelm`

// Credenciais (em produção, usar Vault)
const HOST_USER = Deno.env.get('HOST_USER') || 'cardosode'
const HOST_PASS = Deno.env.get('HOST_PASS') || 'Fsw@2025'

// Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://supabase.fsw-hitss.duckdns.org'
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
    reportType: 'recursos_projeto' | 'colaboradores' | 'altas' | 'baixas'
    ano: number
    mes: number
}

interface SyncResult {
    success: boolean
    recordsProcessed: number
    recordsInserted: number
    recordsUpdated: number
    recordsSkipped: number
    errors: string[]
    executionTimeMs: number
}

// Mapeamento de tipos de relatório para nomes no HOST
const REPORT_NAMES: Record<string, string> = {
    'recursos_projeto': 'Horas_HOST_RecursoProyecto',
    'colaboradores': 'Reporte Colaboradores Disponibles',
    'altas': 'Auditoria_AltasRecursos',
    'baixas': 'BajasRecursos',
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const startTime = Date.now()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    let syncLogId: string | null = null

    try {
        // Parse request
        const body: SyncRequest = await req.json()
        const { reportType = 'recursos_projeto', ano, mes } = body

        // Validar parâmetros
        const currentDate = new Date()
        const year = ano || currentDate.getFullYear()
        const month = mes || currentDate.getMonth() + 1

        const reportName = REPORT_NAMES[reportType]
        if (!reportName) {
            throw new Error(`Tipo de relatório inválido: ${reportType}`)
        }

        console.log(`[host-sync] Iniciando sync: ${reportName} - ${year}/${month}`)

        // Criar log de sync
        const { data: logData, error: logError } = await supabase
            .from('host_sync_logs')
            .insert({
                sync_type: reportType,
                report_name: reportName,
                ano: year,
                mes: month,
                status: 'INICIADO',
            })
            .select('id')
            .single()

        if (logError) {
            console.error('[host-sync] Erro ao criar log:', logError)
        } else {
            syncLogId = logData.id
        }

        // 1. Login no HOST
        console.log('[host-sync] Realizando login...')
        const sessionCookies = await loginToHost()

        // 2. Download do relatório
        console.log('[host-sync] Baixando relatório...')
        const excelBuffer = await downloadReport(sessionCookies, reportName, year, month)

        // 3. Parse do Excel
        console.log('[host-sync] Processando Excel...')
        const workbook = xlsx.read(excelBuffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = xlsx.utils.sheet_to_json(sheet)

        console.log(`[host-sync] ${data.length} registros encontrados`)

        // Atualizar log para PROCESSANDO
        if (syncLogId) {
            await supabase
                .from('host_sync_logs')
                .update({ status: 'PROCESSANDO', records_processed: data.length })
                .eq('id', syncLogId)
        }

        // 4. Processar e inserir dados
        const result = await processAndInsertData(supabase, data, reportType)

        // 5. Finalizar log
        const executionTime = Date.now() - startTime
        if (syncLogId) {
            await supabase
                .from('host_sync_logs')
                .update({
                    status: result.errors.length > 0 ? 'PARCIAL' : 'SUCESSO',
                    records_processed: result.recordsProcessed,
                    records_inserted: result.recordsInserted,
                    records_updated: result.recordsUpdated,
                    records_skipped: result.recordsSkipped,
                    execution_time_ms: executionTime,
                    completed_at: new Date().toISOString(),
                    error_details: result.errors.length > 0 ? { errors: result.errors } : null,
                })
                .eq('id', syncLogId)
        }

        console.log(`[host-sync] Sync concluído em ${executionTime}ms`)

        return new Response(
            JSON.stringify({
                success: true,
                ...result,
                executionTimeMs: executionTime,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('[host-sync] Erro:', error)

        // Atualizar log com erro
        if (syncLogId) {
            await supabase
                .from('host_sync_logs')
                .update({
                    status: 'ERRO',
                    error_message: error.message,
                    execution_time_ms: Date.now() - startTime,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', syncLogId)
        }

        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

/**
 * Realiza login no HOST GlobalHitss e retorna cookies de sessão
 */
async function loginToHost(): Promise<string> {
    const formData = new URLSearchParams()
    formData.append('UserName', HOST_USER)
    formData.append('Password', HOST_PASS)

    const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        redirect: 'manual', // Não seguir redirect automaticamente
    })

    // Extrair cookies da resposta
    const cookies = response.headers.get('set-cookie') || ''

    if (!cookies.includes('.ASPXAUTH')) {
        throw new Error('Falha no login: cookies de autenticação não encontrados')
    }

    // Parsear múltiplos cookies
    const cookieArray = cookies.split(',').map(c => c.split(';')[0].trim())
    return cookieArray.join('; ')
}

/**
 * Baixa relatório do HOST em formato Excel
 */
async function downloadReport(
    cookies: string,
    reportName: string,
    ano: number,
    mes: number
): Promise<ArrayBuffer> {
    const filtros = `Año~I~${ano}|Mes~I~${mes}`
    const url = `${REPORT_DOWNLOAD_URL}?reporte=${encodeURIComponent(reportName)}&filtros=${encodeURIComponent(filtros)}`

    console.log(`[host-sync] Download URL: ${url}`)

    const response = await fetch(url, {
        headers: {
            'Cookie': cookies,
        },
    })

    if (!response.ok) {
        throw new Error(`Falha no download: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('spreadsheet') && !contentType.includes('excel')) {
        // Pode ser uma página de erro HTML
        const text = await response.text()
        if (text.includes('Error') || text.includes('error')) {
            throw new Error('O servidor retornou uma página de erro ao invés do Excel')
        }
        throw new Error(`Content-Type inesperado: ${contentType}`)
    }

    return await response.arrayBuffer()
}

/**
 * Processa dados do Excel e insere no Supabase
 */
async function processAndInsertData(
    supabase: any,
    data: any[],
    reportType: string
): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        recordsProcessed: data.length,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errors: [],
        executionTimeMs: 0,
    }

    for (const row of data) {
        try {
            // Mapear campos do Excel para o schema do banco
            const professional = mapRowToProfessional(row, reportType)

            if (!professional.id_recurso) {
                result.recordsSkipped++
                continue
            }

            // Upsert no Supabase
            const { data: existing } = await supabase
                .from('profissionais')
                .select('id')
                .eq('id_recurso', professional.id_recurso)
                .single()

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('profissionais')
                    .update({
                        ...professional,
                        last_sync_at: new Date().toISOString(),
                    })
                    .eq('id_recurso', professional.id_recurso)

                if (error) throw error
                result.recordsUpdated++
            } else {
                // Insert
                const { error } = await supabase
                    .from('profissionais')
                    .insert({
                        ...professional,
                        last_sync_at: new Date().toISOString(),
                    })

                if (error) throw error
                result.recordsInserted++
            }

        } catch (err) {
            result.errors.push(`Erro ao processar registro: ${err.message}`)
            if (result.errors.length >= 10) {
                result.errors.push('... (mais erros omitidos)')
                break
            }
        }
    }

    return result
}

/**
 * Mapeia uma linha do Excel para o formato de profissional
 */
function mapRowToProfessional(row: any, reportType: string): Record<string, any> {
    // Mapeamento genérico - ajustar conforme colunas reais do Excel
    return {
        id_recurso: row['Id Recurso'] || row['ID_RECURSO'] || row['IdRecurso'] || null,
        nome: row['Recurso'] || row['Nombre'] || row['Nome'] || '',
        email: row['Email'] || row['Correo'] || null,
        cargo: row['Puesto'] || row['Cargo'] || null,
        gerente: row['Gerente'] || row['Manager'] || null,
        gerente_area: row['Gerente Área'] || row['GerenteArea'] || null,
        lider_responsavel: row['Líder Responsável'] || row['LiderResponsable'] || null,
        companhia: row['Compañía'] || row['Companhia'] || row['Company'] || null,
        unidade_negocio: row['Unidad de Negocio'] || row['UnidadNegocio'] || null,
        centro_custo: row['Centro de Costo'] || row['CentroCosto'] || null,
        projeto_atual: row['Proyecto'] || row['Projeto'] || null,
        projeto_atual_id: row['Id Proyecto'] || row['IdProyecto'] || null,
        horas_mes: parseFloat(row['Horas'] || row['Total Horas'] || '0') || 0,
        status: determineStatus(row, reportType),
        metadata: {
            raw: row,
            report_type: reportType,
            sync_date: new Date().toISOString(),
        },
    }
}

/**
 * Determina o status do profissional baseado nos dados
 */
function determineStatus(row: any, reportType: string): string {
    if (reportType === 'baixas') return 'INATIVO'
    if (reportType === 'colaboradores') return 'DISPONIVEL'

    const status = row['Estatus'] || row['Status'] || ''
    if (status.toLowerCase().includes('inactivo')) return 'INATIVO'
    if (status.toLowerCase().includes('disponible')) return 'DISPONIVEL'
    if (status.toLowerCase().includes('vacaciones')) return 'FERIAS'

    return 'ATIVO'
}
