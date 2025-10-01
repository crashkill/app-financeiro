import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Badge, Spinner, Alert, Accordion } from 'react-bootstrap'
import { FaPlay, FaClock, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaTools } from 'react-icons/fa'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import AutomationMetrics from './AutomationMetrics'
import AutomationService, { ExecutionStatus } from '../../services/automationService'
import AutomationExecutionService, { ExecutionMetrics } from '../../services/automationExecutionService'

interface AutomationStatus {
  isActive: boolean
  lastExecution: Date | null
  nextExecution: Date | null
  status: 'success' | 'error' | 'running' | 'idle'
  recordsProcessed: number
  executionTime: number
}

const AutomationMonitor: React.FC = () => {
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({
    isActive: true,
    lastExecution: null,
    nextExecution: null,
    status: 'idle',
    recordsProcessed: 0,
    executionTime: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null)
  const [executionMessage, setExecutionMessage] = useState<string>('')
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [executionMetrics, setExecutionMetrics] = useState<ExecutionMetrics | null>(null)
  
  const automationService = AutomationService.getInstance()
  const executionService = AutomationExecutionService.getInstance()

  useEffect(() => {
    fetchAutomationStatus()
    fetchExecutionMetrics()
    
    // Iniciar monitoramento de conectividade para sincronização automática
    automationService.startConnectivityMonitoring()
    
    // Usar um intervalo maior para evitar sobreposição de requisições
    const interval = setInterval(() => {
      fetchAutomationStatus()
      fetchExecutionMetrics()
    }, 35000) // Atualiza a cada 35 segundos
    
    // Limpar intervalo e monitoramento quando o componente for desmontado
    return () => {
      clearInterval(interval)
      automationService.stopConnectivityMonitoring()
    }
  }, [])

  const fetchAutomationStatus = async () => {
    try {
      // Verificar conectividade antes de fazer a requisição
      if (!navigator.onLine) {
        console.warn('Sem conexão com a internet')
        setIsLoading(false)
        return
      }

      // Usar o novo serviço para buscar a última execução
      const lastExecution = await executionService.getLastExecution()

      if (!lastExecution) {
        // Fallback para dados offline se disponível
        const cachedData = localStorage.getItem('automation_status_cache')
        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          setAutomationStatus(parsed)
        } else {
          // Primeira execução - definir status padrão
          const nextExecution = new Date()
          nextExecution.setDate(nextExecution.getDate() + 1)
          nextExecution.setHours(8, 0, 0, 0)

          setAutomationStatus({
            isActive: true,
            lastExecution: null,
            nextExecution,
            status: 'idle',
            recordsProcessed: 0,
            executionTime: 0
          })
        }
        return
      }

      // Determinar status baseado no campo status da nova tabela
      let status: string
      if (lastExecution.status === 'completed') {
        status = 'success'
      } else if (lastExecution.status === 'failed') {
        status = 'error'
      } else if (lastExecution.status === 'running') {
        status = 'running'
      } else {
        status = 'idle'
      }
      
      const nextExecution = new Date()
      nextExecution.setDate(nextExecution.getDate() + 1)
      nextExecution.setHours(8, 0, 0, 0) // Próxima execução às 8h

      setAutomationStatus({
        isActive: true,
        lastExecution: new Date(lastExecution.started_at),
        nextExecution,
        status: status as 'success' | 'error' | 'running' | 'idle',
        recordsProcessed: lastExecution.records_imported || 0,
        executionTime: lastExecution.execution_time_ms || 0
      })
      
      // Cache dos dados para uso offline
      localStorage.setItem('automation_status_cache', JSON.stringify({
        isActive: true,
        lastExecution: new Date(lastExecution.started_at),
        nextExecution,
        status,
        recordsProcessed: lastExecution.records_imported || 0,
        executionTime: lastExecution.execution_time_ms || 0
      }))
    } catch (error: any) {
      console.error('Erro ao buscar status da automação:', error)
      
      // Tratamento específico para diferentes tipos de erro
      if (error.name === 'AbortError') {
        console.warn('Requisição cancelada por timeout')
      } else if (error.message?.includes('Failed to fetch')) {
        console.warn('Problema de conectividade detectado')
      }
      
      // Tentar carregar dados do cache
      const cachedData = localStorage.getItem('automation_status_cache')
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          setAutomationStatus(parsed)
          console.info('Dados carregados do cache offline')
        } catch (cacheError) {
          console.error('Erro ao carregar cache:', cacheError)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchExecutionMetrics = async () => {
    try {
      const metrics = await executionService.getExecutionMetrics(30) // Últimos 30 dias
      setExecutionMetrics(metrics)
    } catch (error) {
      console.error('Erro ao buscar métricas de execução:', error)
    }
  }

  const executeManually = async () => {
    try {
      setIsExecuting(true)
      setExecutionMessage('Iniciando execução manual...')
      
      const response = await automationService.executeManually()
      
      if (response.success && response.executionId) {
        setExecutionMessage('Execução iniciada com sucesso! Monitorando progresso...')
        
        // Iniciar monitoramento da execução
        automationService.startExecutionMonitoring(response.executionId, (status) => {
          setExecutionStatus(status)
          if (status) {
            if (status.status === 'completed') {
              setExecutionMessage('Execução concluída com sucesso!')
              setIsExecuting(false)
              fetchAutomationStatus() // Atualizar dados
            } else if (status.status === 'failed') {
              setExecutionMessage(`Execução falhou: ${status.message}`)
              setIsExecuting(false)
            } else {
              setExecutionMessage(`Executando: ${status.message || 'Processando...'}`)
            }
          }
        })
      } else {
        setExecutionMessage(response.message || 'Erro ao executar automação')
        setIsExecuting(false)
      }
    } catch (err) {
      console.error('Erro ao executar automação:', err)
      setExecutionMessage('Erro interno ao executar automação')
      setIsExecuting(false)
    }
  }

  const runDiagnostic = async () => {
    try {
      setIsDiagnosing(true)
      setDiagnosticResult(null)
      
      const result = await automationService.runDiagnostic()
      setDiagnosticResult(result)
      setShowDiagnostic(true)
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error)
      setDiagnosticResult({
        success: false,
        message: 'Erro ao executar diagnóstico',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      setShowDiagnostic(true)
    } finally {
      setIsDiagnosing(false)
    }
  }
  
  // Cleanup do monitoramento quando o componente for desmontado
  useEffect(() => {
    return () => {
      automationService.stopExecutionMonitoring()
    }
  }, [])

  const getStatusIcon = () => {
    if (isExecuting) return <Loader2 className="w-4 h-4 animate-spin" />
    
    switch (automationStatus.status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    if (isExecuting) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Executando</span>
    
    switch (automationStatus.status) {
      case 'success':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Sucesso</span>
      case 'error':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Erro</span>
      case 'running':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Executando</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Aguardando</span>
    }
  }

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'Nunca executado'
    return date.toLocaleString('pt-BR')
  }

  const formatExecutionTime = (time: number) => {
    if (time < 1000) return `${time}ms`
    return `${(time / 1000).toFixed(1)}s`
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
        <p className="mt-2">Carregando status da automação...</p>
      </div>
    )
  }

  // Calcular métricas baseadas nos dados reais das execuções
  const totalExecutions = executionMetrics?.totalExecutions || 0
  const successfulExecutions = executionMetrics?.successfulExecutions || 0
  const failedExecutions = executionMetrics?.failedExecutions || 0
  const totalRecordsProcessed = executionMetrics?.totalRecordsProcessed || 0
  const averageExecutionTime = executionMetrics?.averageExecutionTime || 0
  const lastExecutionStatus = automationStatus.status

  return (
    <div>
      {/* Métricas Visuais */}
      <AutomationMetrics
        totalExecutions={totalExecutions}
        successfulExecutions={successfulExecutions}
        failedExecutions={failedExecutions}
        totalRecordsProcessed={totalRecordsProcessed}
        averageExecutionTime={averageExecutionTime}
        lastExecutionStatus={lastExecutionStatus}
        executionMetrics={executionMetrics}
      />

      {/* Monitor Principal */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              {getStatusIcon()}
              <span className="ms-2 fw-bold">Status da Automação</span>
            </div>
            {getStatusBadge()}
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Card className="border-0 bg-light">
            <Card.Body className="text-center">
              <FaClock className="text-primary mb-2" size={24} />
              <h6 className="mb-1">Última Execução</h6>
              <small className="text-muted">
                {formatDateTime(automationStatus.lastExecution)}
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 bg-light">
            <Card.Body className="text-center">
              <FaPlay className="text-info mb-2" size={24} />
              <h6 className="mb-1">Próxima Execução</h6>
              <small className="text-muted">
                {formatDateTime(automationStatus.nextExecution)}
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Card className="border-0 bg-light">
            <Card.Body className="text-center">
              <h4 className="text-success mb-1">{automationStatus.recordsProcessed}</h4>
              <small className="text-muted">Registros Processados</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 bg-light">
            <Card.Body className="text-center">
              <h4 className="text-primary mb-1">
                {formatExecutionTime(automationStatus.executionTime)}
              </h4>
              <small className="text-muted">Tempo de Execução</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <div className="d-grid gap-2">

            
            {/* Mensagens de Status */}
            {executionMessage && (
              <div className={`mt-3 p-3 rounded ${isExecuting ? 'bg-warning bg-opacity-10 border border-warning' : executionStatus?.status === 'completed' ? 'bg-success bg-opacity-10 border border-success' : 'bg-info bg-opacity-10 border border-info'}`}>
                <div className="d-flex align-items-center">
                  {isExecuting ? (
                    <Spinner animation="border" size="sm" className="me-2" />
                  ) : executionStatus?.status === 'completed' ? (
                    <FaCheckCircle className="text-success me-2" />
                  ) : (
                    <FaClock className="text-info me-2" />
                  )}
                  <small className="fw-medium">{executionMessage}</small>
                </div>
                {executionStatus && executionStatus.status === 'running' && (
                  <div className="mt-2">
                    <div className="progress" style={{height: '4px'}}>
                      <div className="progress-bar progress-bar-striped progress-bar-animated" style={{width: '60%'}}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Resultados do Diagnóstico */}
            {showDiagnostic && diagnosticResult && (
              <div className="mt-3">
                <Accordion>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      <div className="d-flex align-items-center">
                        {diagnosticResult.success ? (
                          <FaCheckCircle className="text-success me-2" />
                        ) : (
                          <FaExclamationTriangle className="text-warning me-2" />
                        )}
                        <span>Resultado do Diagnóstico de Conectividade</span>
                        <Badge 
                          bg={diagnosticResult.success ? "success" : "warning"} 
                          className="ms-2"
                        >
                          {diagnosticResult.success ? "Todos os testes passaram" : "Problemas detectados"}
                        </Badge>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <div className="mb-3">
                        <strong>Resumo:</strong> {diagnosticResult.message}
                      </div>
                      
                      {diagnosticResult.diagnostics && diagnosticResult.diagnostics.tests && (
                        <div>
                          <strong>Detalhes dos Testes:</strong>
                          <div className="mt-2">
                            {diagnosticResult.diagnostics.tests.map((test: any, index: number) => (
                              <Alert 
                                key={index}
                                variant={test.success ? "success" : "danger"}
                                className="mb-2 py-2"
                              >
                                <div className="d-flex align-items-center">
                                  {test.success ? (
                                    <FaCheckCircle className="me-2" />
                                  ) : (
                                    <FaTimesCircle className="me-2" />
                                  )}
                                  <div>
                                    <strong>{test.name}:</strong> {test.message}
                                    {test.details && (
                                      <div className="mt-1">
                                        <small className="text-muted">{test.details}</small>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Alert>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {diagnosticResult.error && (
                        <Alert variant="danger" className="mt-3">
                          <strong>Erro:</strong> {diagnosticResult.error}
                        </Alert>
                      )}
                      
                      <div className="mt-3">
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          onClick={() => setShowDiagnostic(false)}
                        >
                          Fechar Diagnóstico
                        </Button>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default AutomationMonitor