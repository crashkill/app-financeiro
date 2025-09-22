import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from '../_shared/logger.ts'
import { 
  HITSSConfig, 
  AutomationResult, 
  DownloadedFile, 
  ProcessedData, 
  ImportResult
} from './types.ts'
import { HITSSDataProcessor } from './hitss-data-processor.ts'

/**
 * Serviço principal para automação HITSS
 * Gerencia todo o fluxo de login, download e importação
 */
export class HITSSAutomationService {
  private supabase: SupabaseClient
  private config: HITSSConfig
  private executionId: string
  private startTime: number

  constructor(supabase: SupabaseClient, config: HITSSConfig) {
    this.supabase = supabase
    this.config = config
    this.executionId = crypto.randomUUID()
    this.startTime = Date.now()
  }

  /**
   * Executa todo o processo de automação
   */
  async execute(): Promise<AutomationResult> {
    const result: AutomationResult = {
      success: false,
      timestamp: new Date().toISOString(),
      fileDownloaded: false,
      executionTime: 0,
      errors: []
    }

    let tempFilePath = ''

    try {
      logger.info('🚀 Iniciando execução da automação HITSS', { executionId: this.executionId })

      // 1. Baixar arquivo diretamente via API
      const downloadedFile = await this.downloadFileDirectly()
      tempFilePath = downloadedFile.path
      result.fileDownloaded = true
      result.fileName = downloadedFile.name
      result.fileSize = downloadedFile.size
      
      // 2. Processar dados do arquivo
      const processedData = await this.processFile(downloadedFile)
      result.recordsProcessed = processedData.totalRows
      
      // 3. Importar dados no banco
      const importResult = await this.importData(processedData)
      result.recordsImported = importResult.imported
      
      // 4. Limpar arquivo temporário
      await this.cleanupFile(downloadedFile.path)
      
      result.success = true
      logger.info('✅ Automação HITSS concluída com sucesso', { 
        executionId: this.executionId,
        recordsImported: result.recordsImported
      })
      
    } catch (error) {
      logger.error('❌ Erro na automação HITSS:', error)
      result.errors = [error.message]
      
      // Limpar arquivo temporário em caso de erro
      if (tempFilePath) {
        await this.cleanupFile(tempFilePath)
      }
      
      // Registrar erro no banco para auditoria
      await this.logError(error)
    }
    
    result.executionTime = Date.now() - this.startTime
    
    // Registrar execução no banco
    await this.logExecution(result)
    
    return result
  }

  /**
   * Baixa arquivo diretamente via API usando fetch
   */
  private async downloadFileDirectly(): Promise<DownloadedFile> {
    logger.info('📥 Iniciando download direto do arquivo DRE XLSX')
    
    try {
      // Fazer login e obter cookies/tokens de sessão
      const sessionData = await this.authenticateAndGetSession()
      
      // Fazer requisição para download do arquivo
      const response = await fetch(this.config.downloadUrl, {
        method: 'GET',
        headers: {
          'Cookie': sessionData.cookies,
          'Authorization': sessionData.token || '',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Erro no download: ${response.status} ${response.statusText}`)
      }
      
      const buffer = await response.arrayBuffer()
      const fileName = `hitss_dre_${Date.now()}.xlsx`
      const filePath = `/tmp/${fileName}`
      
      await Deno.writeFile(filePath, new Uint8Array(buffer))
      
      const downloadedFile: DownloadedFile = {
        path: filePath,
        name: fileName,
        size: buffer.byteLength,
        mimeType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
      
      logger.info('✅ Arquivo DRE baixado com sucesso', { 
        fileName: downloadedFile.name, 
        fileSize: downloadedFile.size 
      })
      
      return downloadedFile
      
    } catch (error) {
      logger.error('❌ Erro no download direto:', error)
      throw error
    }
  }

  /**
   * Autentica na API e obtém dados de sessão
   */
  private async authenticateAndGetSession(): Promise<{ cookies: string; token?: string }> {
    logger.info('🔐 Autenticando na API HITSS')
    
    const loginResponse = await fetch(this.config.loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password
      })
    })
    
    if (!loginResponse.ok) {
      throw new Error(`Falha na autenticação: ${loginResponse.status} ${loginResponse.statusText}`)
    }
    
    const cookies = loginResponse.headers.get('set-cookie') || ''
    const authData = await loginResponse.json()
    
    logger.info('✅ Autenticação realizada com sucesso')
    
    return {
      cookies,
      token: authData.token
    }
  }

  /**
   * Processa o arquivo XLSX baixado
   */
  private async processFile(file: DownloadedFile): Promise<ProcessedData> {
    logger.info('📊 Processando arquivo XLSX', { fileName: file.name })
    
    const processor = new HITSSDataProcessor()
    const processedData = await processor.processXLSX(file.path)
    
    logger.info('✅ Arquivo processado', { 
      totalRows: processedData.totalRows,
      validRows: processedData.validRows,
      invalidRows: processedData.invalidRows
    })
    
    return processedData
  }

  /**
   * Importa os dados processados no banco de dados
   */
  private async importData(data: ProcessedData): Promise<ImportResult> {
    logger.info('💾 Importando dados no banco de dados')
    
    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: 0,
      details: []
    }
    
    for (let i = 0; i < data.data.length; i++) {
      const row = data.data[i]
      
      try {
        // Inserir dados na tabela (ajustar conforme estrutura do banco)
        const { error } = await this.supabase
          .from('hitss_data') // Nome da tabela a ser ajustado
          .insert({
            ...row,
            imported_at: new Date().toISOString(),
            execution_id: this.executionId
          })
        
        if (error) {
          throw error
        }
        
        result.imported++
        result.details.push({
          row: i + 1,
          status: 'imported',
          data: row
        })
        
      } catch (error) {
        result.errors++
        result.details.push({
          row: i + 1,
          status: 'error',
          message: error.message
        })
        
        logger.warn('⚠️ Erro ao importar linha', { row: i + 1, error: error.message })
      }
    }
    
    logger.info('✅ Importação concluída', {
      imported: result.imported,
      errors: result.errors
    })
    
    return result
  }

  /**
   * Remove arquivo temporário
   */
  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await Deno.remove(filePath)
      logger.info('🗑️ Arquivo temporário removido', { filePath })
    } catch (error) {
      logger.warn('⚠️ Erro ao remover arquivo temporário', { filePath, error: error.message })
    }
  }

  /**
   * Registra erro no banco para auditoria
   */
  private async logError(error: Error): Promise<void> {
    try {
      await this.supabase
        .from('hitss_automation_logs')
        .insert({
          execution_id: this.executionId,
          level: 'error',
          message: error.message,
          context: {
            stack: error.stack,
            config: {
              baseUrl: this.config.baseUrl,
              username: this.config.username.substring(0, 3) + '***' // Mascarar username
            }
          },
          timestamp: new Date().toISOString()
        })
    } catch (logError) {
      logger.error('❌ Erro ao registrar log de erro:', logError)
    }
  }

  /**
   * Registra execução no banco
   */
  private async logExecution(result: AutomationResult): Promise<void> {
    try {
      await this.supabase
        .from('hitss_automation_executions')
        .insert({
          execution_id: this.executionId,
          success: result.success,
          file_downloaded: result.fileDownloaded,
          file_name: result.fileName,
          file_size: result.fileSize,
          records_processed: result.recordsProcessed,
          records_imported: result.recordsImported,
          execution_time: result.executionTime,
          errors: result.errors,
          timestamp: result.timestamp
        })
    } catch (logError) {
      logger.error('❌ Erro ao registrar execução:', logError)
    }
  }
}