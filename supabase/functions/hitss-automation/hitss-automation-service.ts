import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts'
import { logger } from '../_shared/logger.ts'
import { 
  HITSSConfig, 
  AutomationResult, 
  DownloadedFile, 
  ProcessedData, 
  ImportResult,
  BrowserConfig,
  HITSSNavigationFlow
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

    try {
      logger.info('🚀 Iniciando execução da automação HITSS', { executionId: this.executionId })

      // 1. Configurar browser
      const browser = await this.setupBrowser()
      
      try {
        // 2. Fazer login na HITSS
        const page = await this.loginToHITSS(browser)
        
        // 3. Navegar e baixar arquivo
        const downloadedFile = await this.downloadFile(page)
        result.fileDownloaded = true
        result.fileName = downloadedFile.name
        result.fileSize = downloadedFile.size
        
        // 4. Processar dados do arquivo
        const processedData = await this.processFile(downloadedFile)
        result.recordsProcessed = processedData.totalRows
        
        // 5. Importar dados no banco
        const importResult = await this.importData(processedData)
        result.recordsImported = importResult.imported
        
        // 6. Limpar arquivo temporário
        await this.cleanupFile(downloadedFile.path)
        
        result.success = true
        logger.info('✅ Automação HITSS concluída com sucesso', { 
          executionId: this.executionId,
          recordsImported: result.recordsImported
        })
        
      } finally {
        await browser.close()
      }
      
    } catch (error) {
      logger.error('❌ Erro na automação HITSS:', error)
      result.errors = [error.message]
      
      // Registrar erro no banco para auditoria
      await this.logError(error)
    }
    
    result.executionTime = Date.now() - this.startTime
    
    // Registrar execução no banco
    await this.logExecution(result)
    
    return result
  }

  /**
   * Configura e inicializa o browser Puppeteer
   */
  private async setupBrowser() {
    const browserConfig: BrowserConfig = {
      headless: true,
      timeout: this.config.timeout || 30000,
      viewport: {
        width: 1920,
        height: 1080
      },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    logger.info('🌐 Configurando browser Puppeteer')
    
    const browser = await puppeteer.launch({
      headless: browserConfig.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    return browser
  }

  /**
   * Realiza login na plataforma HITSS
   */
  private async loginToHITSS(browser: any) {
    logger.info('🔐 Iniciando processo de login na HITSS Control')
    
    const page = await browser.newPage()
    
    // Configurar viewport e user agent
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    // Navegar para página de login da HITSS Control
    logger.info('🌐 Navegando para:', this.config.baseUrl)
    await page.goto(this.config.baseUrl, { 
      waitUntil: 'networkidle2',
      timeout: this.config.timeout || 30000
    })
    
    // Aguardar campos de login aparecerem usando XPaths específicos
    await page.waitForXPath('//*[@id="usuario"]', { timeout: 10000 })
    await page.waitForXPath('//*[@id="senha"]', { timeout: 10000 })
    
    // Preencher credenciais usando XPaths específicos da HITSS Control
    const [usuarioField] = await page.$x('//*[@id="usuario"]')
    const [senhaField] = await page.$x('//*[@id="senha"]')
    
    if (!usuarioField || !senhaField) {
      throw new Error('Campos de login não encontrados na página da HITSS Control')
    }
    
    // Limpar campos e preencher
    await usuarioField.click({ clickCount: 3 })
    await usuarioField.type(this.config.username)
    
    await senhaField.click({ clickCount: 3 })
    await senhaField.type(this.config.password)
    
    logger.info('✅ Credenciais preenchidas:', { usuario: this.config.username })
    
    // Aguardar um pouco para garantir que os campos foram preenchidos
    await page.waitForTimeout(2000)
    
    // Procurar e clicar no botão de login
    const loginButton = await page.$('button[type="submit"], input[type="submit"], .btn-login, #login-button, button:contains("Entrar"), input[value*="Entrar"]')
    if (loginButton) {
      await loginButton.click()
    } else {
      // Tentar pressionar Enter no campo de senha
      await senhaField.press('Enter')
    }
    
    // Aguardar redirecionamento após login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })
    
    // Verificar se login foi bem-sucedido
    const currentUrl = page.url()
    logger.info('🔍 URL após login:', currentUrl)
    
    if (currentUrl.includes('login') || currentUrl.includes('error')) {
      throw new Error('Falha no login - credenciais inválidas ou página não carregou corretamente')
    }
    
    logger.info('✅ Login realizado com sucesso na HITSS Control')
    return page
  }

  /**
   * Navega até o arquivo DRE e faz o download usando o XPATH específico
   */
  private async downloadFile(page: any): Promise<DownloadedFile> {
    logger.info('📥 Iniciando download do arquivo DRE XLSX')
    
    // Configurar interceptação de downloads
    const client = await page.target().createCDPSession()
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: '/tmp'
    })
    
    // Aguardar o botão de exportar Excel usando o XPATH específico
    logger.info('🔍 Procurando botão de exportar Excel')
    await page.waitForXPath('//*[@id="btnExportarExcel"]', { timeout: 15000 })
    
    // Localizar o elemento usando XPATH
    const [exportButton] = await page.$x('//*[@id="btnExportarExcel"]')
    
    if (!exportButton) {
      throw new Error('Botão de exportar Excel não encontrado')
    }
    
    logger.info('✅ Botão de exportar Excel encontrado')
    
    // Configurar listener para download
    const downloadPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout aguardando download'))
      }, 30000)
      
      page.on('response', async (response: any) => {
        const url = response.url()
        const contentType = response.headers()['content-type']
        
        if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
          clearTimeout(timeout)
          const buffer = await response.buffer()
          const fileName = `hitss_dre_${Date.now()}.xlsx`
          const filePath = `/tmp/${fileName}`
          
          await Deno.writeFile(filePath, new Uint8Array(buffer))
          
          resolve({
            path: filePath,
            name: fileName,
            size: buffer.length,
            mimeType: contentType
          })
        }
      })
    })
    
    // Clicar no botão de exportar
    await exportButton.click()
    logger.info('🖱️ Clicou no botão de exportar Excel')
    
    // Aguardar entre 30 a 50 segundos conforme especificado
    const waitTime = Math.floor(Math.random() * (50000 - 30000 + 1)) + 30000
    logger.info(`⏳ Aguardando ${waitTime/1000} segundos para processamento do arquivo...`)
    await page.waitForTimeout(waitTime)
    
    // Aguardar download completar
    const downloadedFile = await downloadPromise as DownloadedFile
    
    logger.info('✅ Arquivo DRE baixado com sucesso', { 
      fileName: downloadedFile.name, 
      fileSize: downloadedFile.size 
    })
    
    return downloadedFile
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